import { Link } from "@tanstack/react-router";
import { Instagram, MessageCircle, Send } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer id="contact" className="relative border-t border-border">
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-20 grid md:grid-cols-12 gap-12">
        <div className="md:col-span-5">
          <Link to="/" className="font-display text-4xl tracking-[0.3em] text-gold-gradient">BIKR</Link>
          <p className="mt-6 text-sm text-muted-foreground max-w-sm leading-relaxed">
            {t("footer.tagline")}
          </p>
        </div>
        <div className="md:col-span-3">
          <p className="text-xs tracking-[0.4em] uppercase text-primary mb-6">{t("footer.navigate")}</p>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li><a href="/#collection" className="hover:text-primary transition-colors">{t("nav.collection")}</a></li>
            <li><a href="/#about" className="hover:text-primary transition-colors">{t("nav.maison")}</a></li>
            <li><a href="/#why" className="hover:text-primary transition-colors">{t("nav.craft")}</a></li>
          </ul>
        </div>
        <div className="md:col-span-4">
          <p className="text-xs tracking-[0.4em] uppercase text-primary mb-6">{t("footer.contact")}</p>
          <div className="flex flex-col gap-4 text-sm">
            <a href="https://wa.me/01101195535" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
              <MessageCircle className="w-4 h-4" /> {t("footer.whatsapp")} · 01101195535
            </a>
            <a href="https://t.me/Bikr_perfume" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
              <Send className="w-4 h-4" /> {t("footer.telegram")} · t.me/Bikr_perfume
            </a>
            <a href="https://instagram.com/bikr.perfume" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
              <Instagram className="w-4 h-4" /> {t("footer.instagram")} · @bikr.perfume
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 md:px-10 py-6 flex flex-wrap items-center justify-between gap-4 text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
          <span>{t("footer.credo")}</span>
        </div>
      </div>
    </footer>
  );
}