import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal } from "./Reveal";
import { Quote } from "lucide-react";
import { useTranslation } from "react-i18next";

type Review = { quote: string; name: string; role: string };

export function Testimonials() {
  const { t } = useTranslation();
  const reviews = (t("testimonials", { returnObjects: true }) as Review[]) ?? [];
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reviews.length === 0) return;
    const t = setInterval(() => setI((v) => (v + 1) % reviews.length), 6000);
    return () => clearInterval(t);
  }, [reviews.length]);
  const r = reviews[i % Math.max(reviews.length, 1)];
  if (!r) return null;
  return (
    <section className="relative py-32 md:py-40 bg-card/40 border-y border-border overflow-hidden">
      <div className="mx-auto max-w-4xl px-6 md:px-10 text-center">
        <Reveal>
          <Quote className="w-10 h-10 text-primary mx-auto mb-10 opacity-70" />
        </Reveal>
        <div className="relative min-h-[200px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
            >
              <p className="font-display text-2xl md:text-4xl leading-snug mb-10 italic">
                "{r.quote}"
              </p>
              <p className="text-xs tracking-[0.4em] uppercase text-primary">{r.name}</p>
              <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mt-2">{r.role}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex justify-center gap-2 mt-12">
          {reviews.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`Review ${idx + 1}`}
              className={`h-px transition-all duration-500 ${idx === i ? "w-12 bg-primary" : "w-6 bg-border"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}