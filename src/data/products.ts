import p1 from "@/assets/product-1.jpg";
import p2 from "@/assets/product-2.jpg";
import p3 from "@/assets/product-3.jpg";
import p4 from "@/assets/product-4.jpg";

// Shared product types and helpers (safe for both browser and server).
// The product list itself lives on the server in data/products.json and is
// managed from the /admin dashboard. See src/lib/store.server.ts.

export const CATEGORIES = ["women", "men", "oriental"] as const;
export type Category = (typeof CATEGORIES)[number];

export type Notes = { top: string[]; middle: string[]; base: string[] };

export type Product = {
  id: string;
  name: string;
  tagline: string;
  price: number;
  /** "builtin:0".."builtin:3" for the bundled photos, or "/api/images/<file>" for uploads. */
  image: string;
  description: string;
  notes: Notes;
  category: Category;
  /** Units left. 0 = sold out. */
  stock: number;
  // Arabic text (optional — falls back to English).
  nameAr?: string;
  taglineAr?: string;
  descriptionAr?: string;
  notesAr?: Notes;
};

const BUILTIN_IMAGES = [p1, p2, p3, p4];

export const resolveImage = (image: string) =>
  image.startsWith("builtin:") ? (BUILTIN_IMAGES[Number(image.slice(8))] ?? p1) : image;

/** At or below this many units, show "Only X left". */
export const LOW_STOCK_THRESHOLD = 10;

export type StockStatus = "in" | "low" | "out";

export const getStockStatus = (stock: number): StockStatus =>
  stock <= 0 ? "out" : stock <= LOW_STOCK_THRESHOLD ? "low" : "in";

/** Prices are in Egyptian pounds: "EGP 1,250" in English, "1,250 ج.م" in Arabic. */
export const formatPrice = (price: number, lang = "en") => {
  const amount = price.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return lang.startsWith("ar") ? `${amount} ج.م` : `EGP ${amount}`;
};
