import { Reveal } from "./Reveal";
import { useTranslation } from "react-i18next";

export function About() {
  const { t } = useTranslation();
  const pillars = t("about.pillars", { returnObjects: true }) as Record<string, string>;
  return (
    <section id="about" className="relative py-32 md:py-40">
      <div className="mx-auto max-w-6xl px-6 md:px-10 grid md:grid-cols-12 gap-12 items-center">
        <Reveal className="md:col-span-5">
          <p className="text-xs tracking-[0.5em] uppercase text-primary mb-6">{t("about.eyebrow")}</p>
          <h2 className="font-display text-4xl md:text-6xl leading-[1.05] mb-8">
            {t("about.title_a")} <em className="not-italic text-gold-gradient">{t("about.title_em")}</em>{t("about.title_b")}
          </h2>
        </Reveal>
        <Reveal delay={0.15} className="md:col-span-7 md:pl-8 md:border-l border-gold">
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            {t("about.p1_a")} <span className="text-primary">{t("about.p1_em")}</span>{t("about.p1_b")}
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            {t("about.p2")}
          </p>
          <div className="grid grid-cols-2 gap-6 text-sm">
            {Object.values(pillars).map((label) => (
              <div key={label} className="flex items-center gap-3 border-t border-border pt-4">
                <span className="h-1 w-1 bg-primary rounded-full" />
                <span className="tracking-wider">{label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}