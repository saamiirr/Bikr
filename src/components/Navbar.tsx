import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { whatsappLink } from "@/lib/contact";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Navbar() {
  const { t } = useTranslation();
  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-50 backdrop-blur-md bg-background/60 border-b border-border"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-2xl tracking-[0.3em] text-gold-gradient">
          BIKR
        </Link>
        <nav className="hidden md:flex items-center gap-10 text-xs tracking-[0.25em] uppercase text-muted-foreground">
          <a href="/#collection" className="hover:text-primary transition-colors">
            {t("nav.collection")}
          </a>
          <a href="/#about" className="hover:text-primary transition-colors">
            {t("nav.maison")}
          </a>
          <a href="/#why" className="hover:text-primary transition-colors">
            {t("nav.craft")}
          </a>
          <a href="/#contact" className="hover:text-primary transition-colors">
            {t("nav.contact")}
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs tracking-[0.25em] uppercase border border-gold px-4 py-2 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
          >
            {t("nav.order")}
          </a>
        </div>
      </div>
    </motion.header>
  );
}
