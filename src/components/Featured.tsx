import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Reveal } from "./Reveal";
import { CATEGORIES, formatPrice, getStockStatus, resolveImage, type Product } from "@/data/products";
import { useProductText } from "@/lib/product-text";
import { ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { StockBadge } from "./StockBadge";

export function Featured({ products }: { products: Product[] }) {
  const { t, i18n } = useTranslation();
  const text = useProductText();
  const categories = CATEGORIES;
  return (
    <section id="collection" className="relative py-32 md:py-40">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Reveal className="flex flex-wrap items-end justify-between gap-6 mb-20">
          <div className="max-w-xl">
            <p className="text-xs tracking-[0.5em] uppercase text-primary mb-6">{t("featured.eyebrow")}</p>
            <h2 className="font-display text-4xl md:text-6xl leading-[1.05]">
              {t("featured.title_a")} <em className="not-italic text-gold-gradient">{t("featured.title_em")}</em>{t("featured.title_b")}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm">
            {t("featured.intro")}
          </p>
        </Reveal>

        {categories.map((cat) => {
          const items = products.filter((p) => p.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat} className="mb-20 last:mb-0">
              <Reveal className="mb-10">
                <p className="text-xs tracking-[0.5em] uppercase text-primary mb-3">{t(`featured.cat.${cat}.eyebrow`)}</p>
                <h3 className="font-display text-3xl md:text-4xl"><em className="not-italic text-gold-gradient">{t(`featured.cat.${cat}.title`)}</em></h3>
              </Reveal>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {items.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08}>
              <Link
                to="/products/$id"
                params={{ id: p.id }}
                className="group block"
              >
                <div className="relative overflow-hidden bg-card aspect-[4/5] mb-6">
                  <motion.img
                    src={resolveImage(p.image)}
                    alt={text(p).name}
                    width={1024}
                    height={1280}
                    loading="lazy"
                    className={`absolute inset-0 w-full h-full object-cover ${p.stock <= 0 ? "grayscale opacity-60" : ""}`}
                    whileHover={{ scale: 1.06 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                  {getStockStatus(p.stock) !== "in" && <StockBadge stock={p.stock} className="absolute top-4 start-4 z-10" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-4 right-4 w-10 h-10 bg-gold-gradient flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                    <ArrowUpRight className="w-4 h-4 text-primary-foreground" />
                  </div>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-2xl mb-1">{text(p).name}</h3>
                    <p className="text-xs text-muted-foreground tracking-wide">{text(p).tagline}</p>
                  </div>
                  <span className="font-display text-xl text-gold-gradient whitespace-nowrap">{formatPrice(p.price, i18n.language)}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-border text-[10px] tracking-[0.3em] uppercase text-primary group-hover:translate-x-1 transition-transform">
                  {t("featured.view")}
                </div>
              </Link>
            </Reveal>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}