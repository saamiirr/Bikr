import { Reveal } from "./Reveal";
import { Droplet, Clock, Sparkles, Gem, Crown, Hammer } from "lucide-react";
import { useTranslation } from "react-i18next";

const iconKeys = [
  { icon: Droplet, key: "alcohol" },
  { icon: Clock, key: "lasting" },
  { icon: Sparkles, key: "premium" },
  { icon: Gem, key: "packaging" },
  { icon: Crown, key: "luxury" },
  { icon: Hammer, key: "craft" },
] as const;

export function WhyChoose() {
  const { t } = useTranslation();
  return (
    <section id="why" className="relative py-32 bg-card/40 border-y border-border">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Reveal className="text-center max-w-2xl mx-auto mb-20">
          <p className="text-xs tracking-[0.5em] uppercase text-primary mb-6">{t("why.eyebrow")}</p>
          <h2 className="font-display text-4xl md:text-6xl leading-[1.05]">
            {t("why.title_a")} <em className="not-italic text-gold-gradient">{t("why.title_em")}</em> {t("why.title_b")}
          </h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {iconKeys.map(({ icon: Icon, key }, i) => (
            <Reveal key={key} delay={i * 0.05}>
              <div className="bg-background h-full p-10 group hover:bg-card transition-colors duration-500">
                <div className="w-12 h-12 border border-gold flex items-center justify-center mb-8 group-hover:bg-gold-gradient transition-all duration-500">
                  <Icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="font-display text-2xl mb-3">{t(`why.items.${key}_t`)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(`why.items.${key}_d`)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}