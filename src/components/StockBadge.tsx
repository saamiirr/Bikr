import { useTranslation } from "react-i18next";
import { getStockStatus } from "@/data/products";
import { cn } from "@/lib/utils";

const styles = {
  in: "border-emerald-500/40 text-emerald-400 bg-background/70",
  low: "border-amber-500/50 text-amber-400 bg-background/70",
  out: "border-red-500/50 text-red-400 bg-background/80",
} as const;

const dots = {
  in: "bg-emerald-400",
  low: "bg-amber-400 animate-pulse",
  out: "bg-red-400",
} as const;

export function StockBadge({ stock, className }: { stock: number; className?: string }) {
  const { t } = useTranslation();
  const status = getStockStatus(stock);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 border px-3 py-1.5 text-[10px] tracking-[0.25em] uppercase backdrop-blur-sm",
        styles[status],
        className,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", dots[status])} />
      {t(`stock.${status}`, { n: stock })}
    </span>
  );
}
