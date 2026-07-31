"use client";

import { GraduationCap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { LessonPlayer } from "@/components/learn/LessonPlayer";
import { ShieldScore } from "@/components/learn/ShieldScore";
import { SwipeDeck } from "@/components/learn/SwipeDeck";
import { Button } from "@/components/ui/button";
import { drillDeck, type DrillCard } from "@/data/drills";
import {
  completeRound,
  emptyProgress,
  recordAnswer,
  selectRound,
  type LearnProgress,
} from "@/lib/learn/scheduler";
import { readJSON, writeJSON } from "@/lib/storage/local";

/*
 * /learn — adaptive "Scam or Safe?" drills (spec §5.6). A round is 10 cards
 * chosen by the scheduler to favour the archetypes/tactics the user gets wrong.
 * Progress and the shield score persist on-device (localStorage). The engine is
 * not called here; each card carries its own ground-truth label and reason.
 */

const STORAGE_KEY = "suraksha:learn";
const ROUND_SIZE = 10;

type Phase = "idle" | "answering" | "feedback" | "done";

export function LearnClient() {
  const t = useTranslations("learn");
  const locale = useLocale();

  // Show drill cards in the user's own language (spec §C6) — a Gujarati user
  // practises on Gujarati messages, not English ones.
  const localeDeck = useMemo(
    () => drillDeck.filter((c) => c.lang === locale),
    [locale],
  );

  const [progress, setProgress] = useState<LearnProgress>(emptyProgress);
  const [round, setRound] = useState<DrillCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [roundCorrect, setRoundCorrect] = useState(0);

  // Load saved progress once, on mount.
  useEffect(() => {
    setProgress(readJSON<LearnProgress>(STORAGE_KEY, emptyProgress()));
  }, []);

  function persist(next: LearnProgress) {
    setProgress(next);
    writeJSON(STORAGE_KEY, next);
  }

  function startRound() {
    setRound(selectRound(localeDeck, progress, ROUND_SIZE));
    setIdx(0);
    setRoundCorrect(0);
    setLastCorrect(null);
    setPhase("answering");
  }

  function answer(guessScam: boolean) {
    const card = round[idx];
    if (!card) return;
    const correct = guessScam === card.isScam;
    setLastCorrect(correct);
    if (correct) setRoundCorrect((n) => n + 1);
    persist(recordAnswer(progress, card, correct));
    setPhase("feedback");
  }

  function next() {
    if (idx + 1 < round.length) {
      setIdx((i) => i + 1);
      setPhase("answering");
    } else {
      persist(completeRound(progress));
      setPhase("done");
    }
  }

  const current = round[idx];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <GraduationCap className="size-7 shrink-0 text-primary" aria-hidden />
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>

      <ShieldScore
        score={progress.shieldScore}
        streak={progress.streak}
        best={progress.bestStreak}
      />

      {phase === "idle" && (
        <>
          <p className="text-lg text-muted-foreground">{t("intro")}</p>
          <Button type="button" variant="accent" size="lg" onClick={startRound}>
            {t("start")}
          </Button>
          <LessonPlayer />
        </>
      )}

      {(phase === "answering" || phase === "feedback") && current && (
        <SwipeDeck
          card={current}
          index={idx}
          total={round.length}
          phase={phase}
          lastCorrect={lastCorrect}
          onAnswer={answer}
          onNext={next}
        />
      )}

      {phase === "done" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-lg font-semibold">{t("roundDone")}</p>
            <p className="mt-2 text-3xl font-bold text-primary tabular-nums">
              {roundCorrect} / {round.length}
            </p>
          </div>
          <Button type="button" variant="accent" size="lg" onClick={startRound}>
            {t("playAgain")}
          </Button>
          <LessonPlayer />
        </div>
      )}
    </div>
  );
}
