import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { CATEGORIES } from "@/data/products";
import { checkCredentials, endSession, isAdmin, requireAdmin, startSession } from "../auth.server";
import {
  addProduct,
  changeStock,
  findProduct,
  listProducts,
  removeProduct,
  saveImage,
  getRedis,
  storageStatus,
  updateProduct,
} from "../store.server";

// ---------- Public ----------

export const getProducts = createServerFn({ method: "GET" }).handler(() => listProducts());

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().min(1).max(100) }))
  .handler(({ data }) => findProduct(data.id));

// ---------- Admin session ----------

export const getAdminStatus = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await isAdmin())) return { isAdmin: false as const, storage: null, storageError: null };
  const storage = storageStatus();
  let storageError: string | null = null;
  if (storage.products === "redis") {
    try {
      await getRedis()!.ping();
    } catch (err) {
      storageError = `Can't reach the Redis database: ${err instanceof Error ? err.message : String(err)}`;
    }
  }
  return { isAdmin: true as const, storage, storageError };
});

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator(z.object({ username: z.string().max(200), password: z.string().max(200) }))
  .handler(async ({ data }) => {
    if (!checkCredentials(data.username, data.password)) {
      await new Promise((r) => setTimeout(r, 600)); // slow down guessing
      return { ok: false as const };
    }
    await startSession();
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(() => {
  endSession();
  return { ok: true };
});

// ---------- Admin actions ----------

const notesSchema = z.object({
  top: z.array(z.string().trim().min(1).max(60)).max(10),
  middle: z.array(z.string().trim().min(1).max(60)).max(10),
  base: z.array(z.string().trim().min(1).max(60)).max(10),
});

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || undefined);

const newProductSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  tagline: z.string().trim().max(120).default(""),
  description: z.string().trim().max(2000).default(""),
  price: z.number().nonnegative().max(1_000_000),
  category: z.enum(CATEGORIES),
  stock: z.number().int().min(0).max(100000),
  notes: notesSchema,
  nameAr: optionalText(80),
  taglineAr: optionalText(120),
  descriptionAr: optionalText(2000),
  notesAr: notesSchema.optional(),
  /** A data: URL of the photo, or a "builtin:N" placeholder. */
  image: z.string().max(8_000_000),
});

export const adminAddProduct = createServerFn({ method: "POST" })
  .inputValidator(newProductSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const image = /^builtin:[0-3]$/.test(data.image) ? data.image : await saveImage(data.image);
    const hasArNotes =
      data.notesAr && (data.notesAr.top.length || data.notesAr.middle.length || data.notesAr.base.length);
    return addProduct({ ...data, image, notesAr: hasArNotes ? data.notesAr : undefined });
  });

const productDetailsSchema = newProductSchema.omit({ stock: true, image: true }).extend({
  id: z.string().min(1).max(100),
  /** Omit to keep the current photo; a data: URL to replace it. */
  image: z.string().max(8_000_000).optional(),
});

export const adminUpdateProduct = createServerFn({ method: "POST" })
  .inputValidator(productDetailsSchema)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { id, image, notesAr, ...rest } = data;
    const hasArNotes = notesAr && (notesAr.top.length || notesAr.middle.length || notesAr.base.length);
    const patch = {
      ...rest,
      // Explicitly clear Arabic fields left empty, so they fall back to English.
      nameAr: rest.nameAr,
      taglineAr: rest.taglineAr,
      descriptionAr: rest.descriptionAr,
      notesAr: hasArNotes ? notesAr : undefined,
      ...(image ? { image: /^builtin:[0-3]$/.test(image) ? image : await saveImage(image) } : {}),
    };
    const product = await updateProduct(id, patch);
    if (!product) throw new Error("Product not found.");
    return product;
  });

export const adminRemoveProduct = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1).max(100) }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const removed = await removeProduct(data.id);
    return { ok: Boolean(removed) };
  });

export const adminChangeStock = createServerFn({ method: "POST" })
  .inputValidator(
    z.union([
      z.object({ id: z.string().min(1).max(100), delta: z.number().int().min(-100000).max(100000) }),
      z.object({ id: z.string().min(1).max(100), value: z.number().int().min(0).max(100000) }),
    ]),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { id, ...change } = data;
    const product = await changeStock(id, change);
    if (!product) throw new Error("Product not found.");
    return product;
  });
