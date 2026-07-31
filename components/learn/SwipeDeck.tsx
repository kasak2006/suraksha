"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DrillCard } from "@/data/drills";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/*
 * The "Scam or Safe?" card (spec §5.6). Presentational: the round state and
 * adaptive scoring live in LearnClient; this shows one message and, after the
 * user answers, immediate feedback with the reason — the learning moment.
 */
export function SwipeDeck({
  card,
  index,
  total,
  phase,
  lastCorrect,
  onAnswer,
  onNext,
}: {
  card: DrillCard;
  index: number;
  total: number;
  phase: "answering" | "feedback";
  lastCorrect: boolean | null;
  onAnswer: (guessScam: boolean) => void;
  onNext: () => void;
}) {
  const t = useTranslations("learn");
  const ta = useTranslations("archetypes");

  const truth = card.isScam ? t("wasScam") : t("wasSafe");
  const reason =
    card.isScam && card.archetype
      ? ta(`${card.archetype}.summary`)
      : card.isScam
        ? t("whyScamGeneric")
        : t("whySafeGeneric");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
        <span>
          {index + 1} / {total}
        </span>
        <span lang={card.lang}>{card.lang.toUpperCase()}</span>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 text-lg leading-relaxed">
        <p lang={card.lang}>{card.text}</p>
      </div>

      {phase === "answering" ? (
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => onAnswer(false)}
          >
            {t("safe")}
          </Button>
          <Button
            type="button"
            variant="accent"
            size="lg"
            onClick={() => onAnswer(true)}
          >
            {t("scam")}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted p-5">
          <p
            className={cn(
              "flex items-center gap-2 text-lg font-bold",
              lastCorrect ? "text-primary" : "text-destructive",
            )}
          >
            {lastCorrect ? (
              <CheckCircle2 className="size-6 shrink-0" aria-hidden />
            ) : (
              <XCircle className="size-6 shrink-0" aria-hidden />
            )}
            {lastCorrect ? t("correct") : t("wrong")}
          </p>
          <p className="text-base font-semibold">{truth}</p>
          <p className="text-base leading-relaxed text-muted-foreground">{reason}</p>
          <Button type="button" variant="default" size="lg" onClick={onNext}>
            {index + 1 < total ? t("next") : t("finishRound")}
          </Button>
        </div>
      )}
    </div>
  );
}
