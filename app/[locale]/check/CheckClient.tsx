"use client";

import { ArrowLeft, Loader2, Sparkles, Volume2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArchetypeCard } from "@/components/verdict/ArchetypeCard";
import { EvidenceHighlighter } from "@/components/verdict/EvidenceHighlighter";
import { TacticRadar } from "@/components/verdict/TacticRadar";
import { VerdictCard } from "@/components/verdict/VerdictCard";
import { WhyList } from "@/components/verdict/WhyList";
import { Button } from "@/components/ui/button";
import { analyze, analyzeWithModel, type AnalysisResult } from "@/lib/engine";
import { decodeMessage } from "@/lib/check-link";
import { Link } from "@/lib/i18n/navigation";
import { cancelSpeech, speak } from "@/lib/speech/tts";
import { useTtsAvailable } from "@/lib/speech/useTts";

export function CheckClient() {
  const t = useTranslations("check");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const encoded = searchParams.get("q") ?? "";

  const message = useMemo(() => decodeMessage(encoded), [encoded]);
  const rulesResult = useMemo(() => analyze(message), [message]);

  // Rules render instantly; the neural check refines the same shape when ready.
  const [refined, setRefined] = useState<AnalysisResult | null>(null);
  const [aiState, setAiState] =
    useState<AnalysisResult["modelState"]>("unloaded");
  // Voice UI appears only when a voice for this language is actually installed.
  const canSpeak = useTtsAvailable(locale);

  const spokenVerdict = `${t(`bands.${rulesResult.band}`)}. ${t(`verdictLine.${rulesResult.band}`)}`;

  // Auto-read the verdict aloud (§5.2) — critical for low-literacy users.
  useEffect(() => {
    if (!canSpeak || message.trim().length === 0) return;
    speak(spokenVerdict, locale);
    return () => cancelSpeech();
    // Read once per message; spokenVerdict/locale are derived from it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSpeak, message]);

  useEffect(() => {
    setRefined(null);
    if (message.trim().length === 0) {
      setAiState("unloaded");
      return;
    }
    let active = true;
    setAiState("loading");
    void analyzeWithModel(message).then((res) => {
      if (!active) return;
      setAiState(res.modelState);
      // Only replace the verdict when the model actually scored.
      if (res.modelState === "ready") setRefined(res);
    });
    return () => {
      active = false;
    };
  }, [message]);

  const result = refined ?? rulesResult;

  const backButton = (
    <Button asChild variant="outline">
      <Link href="/">
        <ArrowLeft aria-hidden />
        {t("backToHome")}
      </Link>
    </Button>
  );

  if (message.trim().length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
        <p className="text-lg text-muted-foreground">{t("emptyState")}</p>
        {backButton}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <VerdictCard
        band={result.band}
        score={result.score}
        overridden={result.overridden}
      />

      {aiState === "loading" && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 aria-hidden className="size-4 animate-spin" />
          <span>
            {t("ai.checking")} {t("ai.downloading")}
          </span>
        </p>
      )}
      {aiState === "ready" && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles aria-hidden className="size-4" />
          <span>{t("ai.ready")}</span>
        </p>
      )}
      {aiState === "failed" && (
        <p className="text-sm text-muted-foreground">{t("ai.rulesOnly")}</p>
      )}

      {canSpeak && (
        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() => speak(spokenVerdict, locale)}
        >
          <Volume2 aria-hidden />
          {t("listen")}
        </Button>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t("yourMessage")}</h2>
        <EvidenceHighlighter segments={result.segments} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("whyHeading")}</h2>
        {result.reasons.length > 0 ? (
          <WhyList reasons={result.reasons} />
        ) : (
          <p className="rounded-xl border border-border bg-card p-4 text-base text-muted-foreground">
            {t("noReasons")}
          </p>
        )}
      </section>

      {result.tactics && (result.tacticPeak ?? 0) > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{t("tacticsHeading")}</h2>
          <TacticRadar tactics={result.tactics} />
        </section>
      )}

      {result.archetype && <ArchetypeCard archetype={result.archetype} />}

      {backButton}
    </div>
  );
}
