import { AlertTriangle, CheckCircle2, ShieldAlert, ShieldX } from "lucide-react";
import { useTranslations } from "next-intl";
import type { VerdictBand } from "@/lib/engine";
import { cn } from "@/lib/utils";

/*
 * This file is inside components/verdict/, the ONLY place the reserved verdict
 * colour tokens (spec §8) may be used. The eslint guard is disabled here.
 */

const BAND_STYLES: Record<
  VerdictBand,
  { surface: string; border: string; text: string; icon: typeof CheckCircle2 }
> = {
  safe: {
    surface: "bg-verdict-safe-surface",
    border: "border-verdict-safe-border",
    text: "text-verdict-safe",
    icon: CheckCircle2,
  },
  caution: {
    surface: "bg-verdict-caution-surface",
    border: "border-verdict-caution-border",
    text: "text-verdict-caution",
    icon: AlertTriangle,
  },
  risky: {
    surface: "bg-verdict-risky-surface",
    border: "border-verdict-risky-border",
    text: "text-verdict-risky",
    icon: ShieldAlert,
  },
  danger: {
    surface: "bg-verdict-danger-surface",
    border: "border-verdict-danger-border",
    text: "text-verdict-danger",
    icon: ShieldX,
  },
};

export function VerdictCard({
  band,
  score,
  overridden,
}: {
  band: VerdictBand;
  score: number;
  overridden: boolean;
}) {
  const t = useTranslations("check");
  const style = BAND_STYLES[band];
  const Icon = style.icon;

  return (
    <section
      aria-label={t(`bands.${band}`)}
      className={cn("rounded-2xl border-2 p-6", style.surface, style.border)}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn("size-10 shrink-0", style.text)} aria-hidden />
        <div className="flex flex-col">
          <span className={cn("text-2xl font-bold", style.text)}>
            {t(`bands.${band}`)}
          </span>
          <span className="text-sm text-muted-foreground">
            {t("scoreLabel")}: {score}/100
          </span>
        </div>
      </div>
      <p className="mt-4 text-lg font-medium text-foreground">
        {t(`verdictLine.${band}`)}
      </p>
      {overridden && (
        <p className="mt-3 text-sm text-muted-foreground">{t("overrideNote")}</p>
      )}
    </section>
  );
}
