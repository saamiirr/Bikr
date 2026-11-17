import { useTranslation } from "react-i18next";
import type { Notes, Product } from "@/data/products";

const hasNotes = (n?: Notes) => Boolean(n && (n.top.length || n.middle.length || n.base.length));

/** Product text in the current language (Arabic falls back to English). */
export function useProductText() {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith("ar");
  return (p: Product) => ({
    name: (ar && p.nameAr) || p.name,
    tagline: (ar && p.taglineAr) || p.tagline,
    description: (ar && p.descriptionAr) || p.description,
    notes: ar && hasNotes(p.notesAr) ? p.notesAr! : p.notes,
  });
}
