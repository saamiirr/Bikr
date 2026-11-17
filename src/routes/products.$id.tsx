import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { StockBadge } from "@/components/StockBadge";
import { formatPrice, getStockStatus, resolveImage } from "@/data/products";
import { getProducts } from "@/lib/api/products.functions";
import { useProductText } from "@/lib/product-text";
import { MessageCircle, ArrowLeft, Check } from "lucide-react";

export const Route = createFileRoute("/products/$id")({
  loader: async ({ params }) => {
    const products = await getProducts();
    const product = products.find((p) => p.id === params.id);
    if (!product) throw notFound();
    const related = products.filter((p) => p.id !== product.id && p.stock > 0).slice(0, 3);
    return { product, related };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.product.name ?? "Fragrance"} — Bikr` },
      { name: "description", content: loaderData?.product.tagline ?? "Bikr luxury perfume." },
      { property: "og:title", content: `${loaderData?.product.name ?? ""} — Bikr` },
      { property: "og:description", content: loaderData?.product.tagline ?? "" },
      { property: "og:image", content: loaderData ? resolveImage(loaderData.product.image) : "" },
      { property: "og:type", content: "product" },
    ],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <p className="font-display text-4xl mb-4">Fragrance not found</p>
        <Link to="/" className="text-primary tracking-[0.3em] uppercase text-xs">← Return Home</Link>
      </div>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { product, related } = Route.useLoaderData();
  const { t, i18n } = useTranslation();
  const text = useProductText();
  const productImage = resolveImage(product.image);
  const [mainImg, setMainImg] = useState(productImage);
  useEffect(() => setMainImg(productImage), [productImage]);

  const {
    name: localizedName,
    tagline: localizedTagline,
    description: localizedDesc,
    notes: localNotes,
  } = text(product);

  const isAr = i18n.language.startsWith("ar");
  const waTemplate = isAr
    ? `مرحباً، أود طلب عطر ${localizedName} من بكر.`
    : `Hello, I would like to order ${localizedName} from Bikr.`;
  const waMessage = encodeURIComponent(
    waTemplate,
  );
  const waLink = `https://wa.me/01101195535?text=${waMessage}`;

  const thumbs = [productImage, productImage, productImage];

  return (
    <main className="bg-background text-foreground min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <Link to="/" className="inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-muted-foreground hover:text-primary transition-colors mb-12">
            <ArrowLeft className="w-3 h-3" /> {t("product.back")}
          </Link>

          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
            {/* Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative aspect-[4/5] bg-card overflow-hidden mb-6">
                <motion.img
                  key={mainImg}
                  src={mainImg}
                  alt={localizedName}
                  width={1024}
                  height={1280}
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {thumbs.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setMainImg(t)}
                    className={`aspect-square overflow-hidden border ${mainImg === t ? "border-gold" : "border-border"} hover:border-gold transition-colors`}
                  >
                    <img src={t} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
            >
              <p className="text-xs tracking-[0.5em] uppercase text-primary mb-6">{t("product.maison")}</p>
              <h1 className="font-display text-5xl md:text-6xl leading-[1.05] mb-4">{localizedName}</h1>
              <p className="text-lg text-muted-foreground italic mb-8">{localizedTagline}</p>
              <div className="flex items-baseline gap-4 mb-10 pb-10 border-b border-border">
                <span className="font-display text-4xl text-gold-gradient">{formatPrice(product.price, i18n.language)}</span>
                <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground">{t("product.size")}</span>
                <StockBadge stock={product.stock} className="ms-auto" />
              </div>

              <p className="text-base text-muted-foreground leading-relaxed mb-10">{localizedDesc}</p>

              {/* Notes */}
              {(localNotes.top.length > 0 || localNotes.middle.length > 0 || localNotes.base.length > 0) && (
              <div className="mb-10">
                <p className="text-xs tracking-[0.4em] uppercase text-primary mb-6">{t("product.pyramid")}</p>
                <div className="space-y-5">
                  {[
                    [t("product.top"), localNotes.top],
                    [t("product.heart"), localNotes.middle],
                    [t("product.base"), localNotes.base],
                  ].filter(([, list]) => (list as string[]).length > 0).map(([label, list]) => (
                    <div key={label as string} className="grid grid-cols-[120px_1fr] gap-6 items-start pb-5 border-b border-border last:border-0">
                      <p className="font-display text-base text-primary">{label}</p>
                      <p className="text-sm text-foreground/90">{(list as string[]).join(" · ")}</p>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* Features */}
              <ul className="grid grid-cols-2 gap-3 mb-10 text-sm">
                {(["alcohol", "lasting", "oils", "packaging"] as const).map((k) => (
                  <li key={k} className="flex items-center gap-3 text-muted-foreground">
                    <Check className="w-4 h-4 text-primary" /> {t(`product.features.${k}`)}
                  </li>
                ))}
              </ul>

              {/* Order CTA */}
              {product.stock <= 0 ? (
                <div
                  aria-disabled="true"
                  className="flex items-center justify-center gap-3 w-full border border-border text-muted-foreground px-8 py-5 text-xs tracking-[0.4em] uppercase font-medium cursor-not-allowed"
                >
                  {t("stock.order_disabled")}
                </div>
              ) : (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center gap-3 w-full bg-gold-gradient text-primary-foreground px-8 py-5 text-xs tracking-[0.4em] uppercase font-medium hover:opacity-90 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                {t("product.order_wa")}
              </a>
              )}
              <p className="text-center text-[10px] tracking-[0.3em] uppercase text-muted-foreground mt-4">
                {t("product.order_note")}
              </p>
            </motion.div>
          </div>

          {/* Related */}
          <section className="mt-32 pt-20 border-t border-border">
            <Reveal className="mb-16">
              <p className="text-xs tracking-[0.5em] uppercase text-primary mb-4">{t("product.related_eyebrow")}</p>
              <h2 className="font-display text-3xl md:text-5xl">{t("product.related_title_a")} <em className="not-italic text-gold-gradient">{t("product.related_title_em")}</em></h2>
            </Reveal>
            <div className="grid sm:grid-cols-3 gap-8">
              {related.map((p, i) => (
                <Reveal key={p.id} delay={i * 0.08}>
                  <Link to="/products/$id" params={{ id: p.id }} className="group block">
                    <div className="relative overflow-hidden bg-card aspect-[4/5] mb-5">
                      <motion.img
                        src={resolveImage(p.image)}
                        alt={text(p).name}
                        loading="lazy"
                        className={`absolute inset-0 w-full h-full object-cover ${p.stock <= 0 ? "grayscale opacity-60" : ""}`}
                        whileHover={{ scale: 1.06 }}
                        transition={{ duration: 0.8 }}
                      />
                      {getStockStatus(p.stock) !== "in" && <StockBadge stock={p.stock} className="absolute top-4 start-4 z-10" />}
                    </div>
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-display text-xl">{text(p).name}</h3>
                      <span className="font-display text-base text-gold-gradient whitespace-nowrap">{formatPrice(p.price, i18n.language)}</span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}