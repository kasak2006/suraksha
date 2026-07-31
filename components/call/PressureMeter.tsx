"use client";

import { useTranslations } from "next-intl";
import type { VerdictBand } from "@/lib/engine";
import { TACTIC_AXES, type TacticScores } from "@/lib/engine/tactics";
import { cn } from "@/lib/utils";

/*
 * The live "pressure meter" (spec §5.3): a 0–100 bar that fills and changes
 * colour as a call gets more dangerous, with the manipulation tactics lighting
 * up as they are detected. This is verdict UI, so the reserved band colours
 * (§8) are allowed here (see eslint.config.mjs allowlist).
 */

const BAND_FILL: Record<VerdictBand, string> = {
  safe: "bg-verdict-safe",
  caution: "bg-verdict-caution",
  risky: "bg-verdict-risky",
  danger: "bg-verdict-danger",
};

const BAND_TEXT: Record<VerdictBand, string> = {
  safe: "text-verdict-safe",
  caution: "text-verdict-caution",
  risky: "text-verdict-risky",
  danger: "text-verdict-danger",
};

// A tactic axis is "lit" once it clears this — matches the radar's threshold.
const LIT = 40;

export function PressureMeter({
  score,
  band,
  tactics,
}: {
  score: number;
  band: VerdictBand;
  tactics: TacticScores;
}) {
  const t = useTranslations("call");
  const tt = useTranslations("tactics");
  const lit = TACTIC_AXES.filter((a) => tactics[a] >= LIT);

  return (
    <section className="flex flex-col gap-3" aria-label={t("meterLabel")}>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {t("meterLabel")}
        </span>
        <span className={cn("text-lg font-bold tabular-nums", BAND_TEXT[band])}>
          {score}/100
        </span>
      </div>
      <div
        className="h-4 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${score}, ${t(`bands.${band}`)}`}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", BAND_FILL[band])}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-2" aria-live="polite">
        {lit.length === 0 ? (
          <span className="text-sm text-muted-foreground">{t("noTacticsYet")}</span>
        ) : (
          lit.map((axis) => (
            <span
              key={axis}
              className="rounded-full border border-border bg-card px-3 py-1 text-sm font-medium"
            >
              {tt(axis)}
            </span>
          ))
        )}
      </div>
    </section>
  );
}
