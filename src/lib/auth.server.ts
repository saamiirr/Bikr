import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import process from "node:process";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { getRedis } from "./store.server";

// Single admin account, checked on the server.
// Defaults to admin / admin. Override with the ADMIN_USERNAME and
// ADMIN_PASSWORD environment variables (recommended before going live).

const COOKIE = "bikr_admin";
const SESSION_DAYS = 7;

const credentials = () => ({
  username: process.env.ADMIN_USERNAME || "admin",
  password: process.env.ADMIN_PASSWORD || "admin",
});

let secretPromise: Promise<Buffer> | null = null;

/**
 * Signing key for session cookies: ADMIN_SESSION_SECRET if set, otherwise a
 * random key kept in Redis (online) or in data/ (on your computer).
 */
function getSecret() {
  if (process.env.ADMIN_SESSION_SECRET) {
    return Promise.resolve(Buffer.from(process.env.ADMIN_SESSION_SECRET));
  }
  const redis = getRedis();
  if (redis) {
    secretPromise ??= (async () => {
      const key = "bikr:session-secret";
      await redis.set(key, crypto.randomBytes(32).toString("hex"), { nx: true });
      const hex = await redis.get<string>(key);
      if (!hex) throw new Error("Couldn't load the session key.");
      return Buffer.from(hex, "hex");
    })().catch((err) => {
      secretPromise = null;
      throw err;
    });
    return secretPromise;
  }
  if (process.env.VERCEL) {
    // No disk and no database online: derive the key from the login details.
    const c = credentials();
    return Promise.resolve(
      crypto.createHash("sha256").update(`bikr-session\0${c.username}\0${c.password}`).digest(),
    );
  }
  secretPromise ??= (async () => {
    const file = path.resolve(process.cwd(), "data", ".session-secret");
    try {
      return Buffer.from(await fs.readFile(file, "utf8"), "hex");
    } catch {
      const key = crypto.randomBytes(32);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, key.toString("hex"), "utf8");
      return key;
    }
  })();
  return secretPromise;
}

const sign = (payload: string, key: Buffer) =>
  crypto.createHmac("sha256", key).update(payload).digest("hex");

const safeEqual = (a: string, b: string) => {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
};

export function checkCredentials(username: string, password: string) {
  const c = credentials();
  // Evaluate both so timing doesn't reveal which one was wrong.
  const userOk = safeEqual(username, c.username);
  const passOk = safeEqual(password, c.password);
  return userOk && passOk;
}

export async function startSession() {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = String(expires);
  const token = `${payload}.${sign(payload, await getSecret())}`;
  setCookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export function endSession() {
  deleteCookie(COOKIE, { path: "/" });
}

export async function isAdmin() {
  const token = getCookie(COOKIE);
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if (!safeEqual(signature, sign(payload, await getSecret()))) return false;
  return Number(payload) > Date.now();
}

export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Not signed in as admin.");
}
