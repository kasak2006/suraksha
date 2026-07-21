"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { EvidenceHighlighter } from "@/components/verdict/EvidenceHighlighter";
import { VerdictCard } from "@/components/verdict/VerdictCard";
import { WhyList } from "@/components/verdict/WhyList";
import { Button } from "@/components/ui/button";
import { analyze } from "@/lib/engine";
import { decodeMessage } from "@/lib/check-link";
import { Link } from "@/lib/i18n/navigation";

export function CheckClient() {
  const t = useTranslations("check");
  const searchParams = useSearchParams();
  const encoded = searchParams.get("q") ?? "";

  const message = useMemo(() => decodeMessage(encoded), [encoded]);
  const result = useMemo(() => analyze(message), [message]);

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
