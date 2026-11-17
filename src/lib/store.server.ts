import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import process from "node:process";
import { Redis } from "@upstash/redis";
import { del as blobDel, put as blobPut } from "@vercel/blob";

import type { Product } from "@/data/products";
import { SEED_PRODUCTS } from "@/data/seed";
import en from "@/locales/en/translation.json";
import ar from "@/locales/ar/translation.json";

// Product store with two backends, picked automatically:
//
//  • Online (Vercel): products in Upstash Redis, photos in Vercel Blob.
//    Used when the Redis env vars are set (KV_REST_API_URL + KV_REST_API_TOKEN,
//    or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN) and, for photos,
//    BLOB_READ_WRITE_TOKEN.
//  • On your computer: data/products.json and data/uploads/.
//
// Either way the catalogue is created from src/data/seed.ts the first time.

type Details = Omit<Product, "stock">;

interface Backend {
  list(): Promise<Product[]>;
  /** Creates a product with a unique id derived from `baseId`. */
  create(baseId: string, input: Omit<Product, "id">): Promise<Product>;
  update(id: string, patch: Partial<Omit<Product, "id" | "stock">>): Promise<{ before: Product; after: Product } | null>;
  remove(id: string): Promise<Product | null>;
  stock(id: string, change: { delta: number } | { value: number }): Promise<Product | null>;
}

const MAX_STOCK = 100000;
const clampStock = (n: number) => Math.max(0, Math.min(MAX_STOCK, Math.round(n)));

type TranslatedProduct = {
  name?: string;
  tagline?: string;
  description?: string;
  notes?: Product["notes"];
};

function buildSeed(): Product[] {
  const enP = (en as { products?: Record<string, TranslatedProduct> }).products ?? {};
  const arP = (ar as { products?: Record<string, TranslatedProduct> }).products ?? {};
  return SEED_PRODUCTS.map((p) => {
    const e = enP[p.id] ?? {};
    const a = arP[p.id] ?? {};
    return {
      ...p,
      name: e.name ?? p.name,
      tagline: e.tagline ?? p.tagline,
      description: e.description ?? p.description,
      notes: e.notes ?? p.notes,
      nameAr: a.name,
      taglineAr: a.tagline,
      descriptionAr: a.description,
      notesAr: a.notes,
    };
  });
}

// ---------------------------------------------------------------------------
// Redis backend (Vercel)
// ---------------------------------------------------------------------------

const K = {
  details: "bikr:products", // hash  id -> JSON (everything except stock)
  stock: "bikr:stock", //      hash  id -> integer
  order: "bikr:order", //      zset  id -> position
  seeded: "bikr:seeded",
};

// Atomically adds to a stock count without going below 0 or above MAX_STOCK.
const INCR_STOCK = `
local v = redis.call('HINCRBY', KEYS[1], ARGV[1], ARGV[2])
if v < 0 then v = 0 redis.call('HSET', KEYS[1], ARGV[1], 0) end
if v > ${MAX_STOCK} then v = ${MAX_STOCK} redis.call('HSET', KEYS[1], ARGV[1], v) end
return v`;

export function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token, automaticDeserialization: false });
}

/** HGETALL comes back as [field, value, field, value, …] when auto-deserialization is off. */
function toRecord(raw: unknown): Record<string, string> {
  if (!raw) return {};
  if (Array.isArray(raw)) {
    const out: Record<string, string> = {};
    for (let i = 0; i + 1 < raw.length; i += 2) out[String(raw[i])] = String(raw[i + 1]);
    return out;
  }
  return Object.fromEntries(Object.entries(raw as Record<string, unknown>).map(([k, v]) => [k, String(v)]));
}

function redisBackend(redis: Redis): Backend {
  const split = (p: Product): { details: Details; stock: number } => {
    const { stock, ...details } = p;
    return { details, stock };
  };

  let seeding: Promise<void> | null = null;
  const ensureSeeded = () =>
    (seeding ??= (async () => {
      // Only the first caller ever seeds (SET NX).
      const first = await redis.set(K.seeded, "1", { nx: true });
      if (!first) return;
      const seed = buildSeed();
      const tx = redis.multi();
      seed.forEach((p, i) => {
        const { details, stock } = split(p);
        tx.hset(K.details, { [p.id]: JSON.stringify(details) });
        tx.hset(K.stock, { [p.id]: stock });
        tx.zadd(K.order, { score: i, member: p.id });
      });
      await tx.exec();
    })().catch((err) => {
      seeding = null;
      throw err;
    }));

  const read = async (id: string): Promise<Product | null> => {
    const [json, stock] = await Promise.all([
      redis.hget<string>(K.details, id),
      redis.hget<string>(K.stock, id),
    ]);
    if (!json) return null;
    return { ...(JSON.parse(json) as Details), stock: Number(stock ?? 0) };
  };

  return {
    async list() {
      await ensureSeeded();
      const [ids, rawDetails, rawStock] = await Promise.all([
        redis.zrange<string[]>(K.order, 0, -1),
        redis.hgetall(K.details),
        redis.hgetall(K.stock),
      ]);
      const details = toRecord(rawDetails);
      const stock = toRecord(rawStock);
      return ids
        .filter((id) => details[id])
        .map((id) => ({ ...(JSON.parse(details[id]) as Details), stock: Number(stock[id] ?? 0) }));
    },

    async create(baseId, input) {
      await ensureSeeded();
      const { stock, ...rest } = input;
      for (let n = 1; ; n++) {
        const id = n === 1 ? baseId : `${baseId}-${n}`;
        const details: Details = { ...rest, id };
        // HSETNX makes the id claim atomic.
        if (await redis.hsetnx(K.details, id, JSON.stringify(details))) {
          await Promise.all([
            redis.hset(K.stock, { [id]: clampStock(stock) }),
            redis.zadd(K.order, { score: Date.now(), member: id }),
          ]);
          return { ...details, stock: clampStock(stock) };
        }
      }
    },

    async update(id, patch) {
      await ensureSeeded();
      const before = await read(id);
      if (!before) return null;
      const after: Product = { ...before, ...patch, id, stock: before.stock };
      await redis.hset(K.details, { [id]: JSON.stringify(split(after).details) });
      return { before, after };
    },

    async remove(id) {
      await ensureSeeded();
      const before = await read(id);
      if (!before) return null;
      await Promise.all([redis.hdel(K.details, id), redis.hdel(K.stock, id), redis.zrem(K.order, id)]);
      return before;
    },

    async stock(id, change) {
      await ensureSeeded();
      if (!(await redis.hexists(K.details, id))) return null;
      if ("delta" in change) {
        await redis.eval(INCR_STOCK, [K.stock], [id, String(Math.round(change.delta))]);
      } else {
        await redis.hset(K.stock, { [id]: clampStock(change.value) });
      }
      return read(id);
    },
  };
}

// ---------------------------------------------------------------------------
// File backend (your computer)
// ---------------------------------------------------------------------------

const dataDir = () => path.resolve(process.cwd(), "data");
const productsFile = () => path.join(dataDir(), "products.json");
const uploadsDir = () => path.join(dataDir(), "uploads");

function fileBackend(): Backend {
  let cache: Product[] | null = null;
  // Serialises writes so two quick clicks can't overwrite each other.
  let queue: Promise<unknown> = Promise.resolve();

  const save = async (products: Product[]) => {
    await fs.mkdir(dataDir(), { recursive: true });
    const tmp = `${productsFile()}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(products, null, 2), "utf8");
    await fs.rename(tmp, productsFile());
    cache = products;
  };

  const load = async (): Promise<Product[]> => {
    if (cache) return cache;
    try {
      cache = JSON.parse(await fs.readFile(productsFile(), "utf8")) as Product[];
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      await save(buildSeed());
    }
    return cache!;
  };

  const mutate = <T>(fn: (products: Product[]) => { next: Product[]; result: T }): Promise<T> => {
    const run = queue.then(async () => {
      const { next, result } = fn(await load());
      await save(next);
      return result;
    });
    queue = run.catch(() => {});
    return run;
  };

  return {
    list: load,

    create: (baseId, input) =>
      mutate((products) => {
        let id = baseId;
        for (let n = 2; products.some((p) => p.id === id); n++) id = `${baseId}-${n}`;
        const product: Product = { ...input, id, stock: clampStock(input.stock) };
        return { next: [...products, product], result: product };
      }),

    update: (id, patch) =>
      mutate((products) => {
        const before = products.find((p) => p.id === id);
        if (!before) return { next: products, result: null };
        const after: Product = { ...before, ...patch, id, stock: before.stock };
        return { next: products.map((p) => (p.id === id ? after : p)), result: { before, after } };
      }),

    remove: (id) =>
      mutate((products) => ({
        next: products.filter((p) => p.id !== id),
        result: products.find((p) => p.id === id) ?? null,
      })),

    stock: (id, change) =>
      mutate((products) => {
        const p = products.find((x) => x.id === id);
        if (!p) return { next: products, result: null };
        const updated = { ...p, stock: clampStock("delta" in change ? p.stock + change.delta : change.value) };
        return { next: products.map((x) => (x.id === id ? updated : x)), result: updated };
      }),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

let backend: Backend | null = null;
const db = () => (backend ??= (() => {
  const redis = getRedis();
  if (redis) return redisBackend(redis);
  if (process.env.VERCEL) {
    throw new Error(
      "No database connected. In Vercel, add Upstash Redis to this project (Storage tab) and redeploy.",
    );
  }
  return fileBackend();
})());

export const listProducts = () => db().list();

export async function findProduct(id: string) {
  return (await db().list()).find((p) => p.id === id) ?? null;
}

const slugify = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "perfume";

export const addProduct = (input: Omit<Product, "id">) => db().create(slugify(input.name), input);

export async function removeProduct(id: string) {
  const removed = await db().remove(id);
  if (removed) await deleteImage(removed.image);
  return removed;
}

/** Updates a product's details (not its id or stock). Removes the old photo if it was replaced. */
export async function updateProduct(id: string, patch: Partial<Omit<Product, "id" | "stock">>) {
  const res = await db().update(id, patch);
  if (res && res.before.image !== res.after.image) await deleteImage(res.before.image);
  return res?.after ?? null;
}

export const changeStock = (id: string, change: { delta: number } | { value: number }) =>
  db().stock(id, change);

// ---------------------------------------------------------------------------
// Images: Vercel Blob online, data/uploads locally
// ---------------------------------------------------------------------------

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const isBlobUrl = (url: string) => /^https:\/\/[^/]+\.blob\.vercel-storage\.com\//.test(url);

/** Saves a base64 data URL and returns the public URL of the image. */
export async function saveImage(dataUrl: string) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error("Image must be a JPG, PNG or WebP file.");
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error("Image is larger than 5 MB.");
  const name = `${crypto.randomBytes(16).toString("hex")}.${IMAGE_TYPES[match[1]]}`;

  if (useBlob()) {
    const blob = await blobPut(`perfumes/${name}`, bytes, {
      access: "public",
      contentType: match[1],
      addRandomSuffix: false,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
    return blob.url;
  }
  if (process.env.VERCEL) {
    throw new Error("Photo storage isn't connected. In Vercel, add a Blob store to this project and redeploy.");
  }
  await fs.mkdir(uploadsDir(), { recursive: true });
  await fs.writeFile(path.join(uploadsDir(), name), bytes);
  return `/api/images/${name}`;
}

async function deleteImage(image: string) {
  try {
    if (isBlobUrl(image) && useBlob()) await blobDel(image);
    else if (image.startsWith("/api/images/") && !process.env.VERCEL) {
      await fs.rm(path.join(uploadsDir(), path.basename(image)), { force: true });
    }
  } catch (err) {
    // A leftover photo isn't worth failing the request over.
    console.error("Couldn't delete old photo", image, err);
  }
}

/** Serves locally uploaded photos (data/uploads). Online photos come straight from Blob. */
export async function readImage(name: string) {
  const m = /^[a-f0-9]{32}\.(jpg|png|webp)$/.exec(name);
  if (!m) return null;
  try {
    const data = await fs.readFile(path.join(uploadsDir(), name));
    const type = m[1] === "jpg" ? "image/jpeg" : `image/${m[1]}`;
    return { data, type };
  } catch {
    return null;
  }
}
