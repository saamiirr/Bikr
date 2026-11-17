import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language.startsWith("ar") ? "ar" : "en";
  const next = current === "ar" ? "en" : "ar";

  return (
    <button
      onClick={() => i18n.changeLanguage(next)}
      aria-label="Toggle language"
      className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-primary transition-colors border border-border hover:border-gold px-3 py-2"
    >
      <Globe className="w-3.5 h-3.5" />
      <span>{current === "ar" ? "EN 🇺🇸" : "ع 🇪🇬"}</span>
    </button>
  );
}