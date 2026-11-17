import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { whatsappLink } from "@/lib/contact";
import hero from "@/assets/hero-bottle.jpg";

export function Hero() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language.startsWith("ar");
  const waText = encodeURIComponent(
    isAr ? "مرحباً، أود طلب عطر من بكر." : "Hello Bikr, I'd like to order.",
  );
  return (
    <section className="relative min-h-screen overflow-hidden pt-16">
      {/* radial gold glow */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 35%, oklch(0.55 0.11 70 / 0.35), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-6 md:px-10 grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-4rem)] py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="order-2 lg:order-1"
        >
          <p className="text-xs tracking-[0.5em] uppercase text-primary mb-6">
            {t("hero.eyebrow")}
          </p>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[1.02] mb-6">
            {t("hero.title_a")}{" "}
            <em className="not-italic text-gold-gradient">{t("hero.title_em")}</em>{" "}
            {t("hero.title_b")}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-md mb-10 leading-relaxed">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="#collection"
              className="bg-gold-gradient text-primary-foreground px-8 py-4 text-xs tracking-[0.3em] uppercase font-medium hover:opacity-90 transition-opacity"
            >
              {t("hero.cta_explore")}
            </a>
            <a
              href={`${whatsappLink()}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-gold text-primary px-8 py-4 text-xs tracking-[0.3em] uppercase hover:bg-primary hover:text-primary-foreground transition-all"
            >
              {t("hero.cta_order")}
            </a>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-md">
            {[
              ["100%", t("hero.stats.immaculate")],
              ["24h+", t("hero.stats.sillage")],
              ["7", t("hero.stats.maisons")],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="font-display text-2xl md:text-3xl text-gold-gradient">{n}</div>
                <div className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mt-1">
                  {l}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          className="order-1 lg:order-2 relative"
        >
          <motion.img
            src={hero}
            alt="Bikr signature perfume bottle"
            width={1536}
            height={1536}
            className="relative z-10 w-full max-w-xl mx-auto drop-shadow-[0_30px_80px_rgba(212,165,82,0.35)]"
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.4em] uppercase text-muted-foreground">
        {t("hero.scroll")}
      </div>
    </section>
  );
}
