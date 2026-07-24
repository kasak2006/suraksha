"use client";

import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EvidenceHighlighter } from "@/components/verdict/EvidenceHighlighter";
import { VerdictCard } from "@/components/verdict/VerdictCard";
import { WhyList } from "@/components/verdict/WhyList";
import { Button } from "@/components/ui/button";
import { analyze, analyzeWithModel, type AnalysisResult } from "@/lib/engine";
import { decodeMessage } from "@/lib/check-link";
import { Link } from "@/lib/i18n/navigation";

export function CheckClient() {
  const t = useTranslations("check");
  const searchParams = useSearchParams();
  const encoded = searchParams.get("q") ?? "";

  const message = useMemo(() => decodeMessage(encoded), [encoded]);
  const rulesResult = useMemo(() => analyze(message), [message]);

  // Rules render instantly; the neural check refines the same shape when ready.
  const [refined, setRefined] = useState<AnalysisResult | null>(null);
  const [aiState, setAiState] =
    useState<AnalysisResult["modelState"]>("unloaded");

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

      {backButton}
    </div>
  );
}
