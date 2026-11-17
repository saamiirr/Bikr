import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "@/locales/en/translation.json";
import ar from "@/locales/ar/translation.json";

export const SUPPORTED_LANGS = ["en", "ar"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        ar: { translation: ar },
      },
      fallbackLng: "en",
      supportedLngs: SUPPORTED_LANGS as unknown as string[],
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator"],
        lookupLocalStorage: "bikr_lang",
        caches: ["localStorage"],
      },
      returnObjects: true,
    });
}

export function applyDocumentLang(lang: string) {
  if (typeof document === "undefined") return;
  const l = lang.startsWith("ar") ? "ar" : "en";
  document.documentElement.lang = l;
  document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
}

if (typeof window !== "undefined") {
  applyDocumentLang(i18n.language);
  i18n.on("languageChanged", applyDocumentLang);
}

export default i18n;