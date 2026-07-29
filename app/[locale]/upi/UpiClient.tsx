"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { VerdictCard } from "@/components/verdict/VerdictCard";
import { Button } from "@/components/ui/button";
import type { VerdictBand } from "@/lib/engine";
import { Link } from "@/lib/i18n/navigation";

/*
 * /upi — UPI-request checker (spec §5.4). Not a text analysis: it teaches the
 * one invariant that stops the collect-request trap — entering your UPI PIN
 * always sends money OUT, so nothing you "receive" ever needs a PIN or approval.
 */

type RequestKind = "collect" | "pay" | null;
type ToReceive = "yes" | "no" | null;

interface Outcome {
  band: VerdictBand;
  score: number;
  key: "resultScam" | "resultCollectCaution" | "resultPay";
}

function outcome(kind: RequestKind, receive: ToReceive): Outcome | null {
  if (kind === "pay") return { band: "caution", score: 35, key: "resultPay" };
  if (kind === "collect") {
    if (receive === "yes") return { band: "danger", score: 95, key: "resultScam" };
    if (receive === "no") return { band: "caution", score: 50, key: "resultCollectCaution" };
  }
  return null;
}

function Choice({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={selected ? "default" : "outline"}
      className="h-auto justify-start whitespace-normal py-3 text-left"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function UpiClient() {
  const t = useTranslations("upi");
  const [kind, setKind] = useState<RequestKind>(null);
  const [receive, setReceive] = useState<ToReceive>(null);

  const result = outcome(kind, receive);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-base text-muted-foreground">{t("intro")}</p>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-lg font-semibold">{t("q1")}</legend>
        <Choice
          selected={kind === "collect"}
          onClick={() => {
            setKind("collect");
            setReceive(null);
          }}
        >
          {t("collect")}
        </Choice>
        <Choice selected={kind === "pay"} onClick={() => setKind("pay")}>
          {t("pay")}
        </Choice>
      </fieldset>

      {kind === "collect" && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-lg font-semibold">{t("q2")}</legend>
          <div className="flex gap-3">
            <Choice selected={receive === "yes"} onClick={() => setReceive("yes")}>
              {t("yes")}
            </Choice>
            <Choice selected={receive === "no"} onClick={() => setReceive("no")}>
              {t("no")}
            </Choice>
          </div>
        </fieldset>
      )}

      {result && (
        <div className="flex flex-col gap-4">
          <VerdictCard band={result.band} score={result.score} overridden={false} />
          <p className="rounded-xl border border-border bg-card p-4 text-base leading-relaxed text-foreground">
            {t(result.key)}
          </p>
        </div>
      )}

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-muted p-5">
        <p className="text-base font-semibold text-foreground">{t("invariant")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-card p-4">
            <p className="font-semibold">{t("explainerTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("explainerPay")}</p>
          </div>
          <div className="rounded-xl bg-card p-4">
            <p className="font-semibold">&nbsp;</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("explainerCollect")}
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2 text-base">
        <span className="text-muted-foreground">{t("checkMessagePrompt")}</span>
        <Link
          href="/"
          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
        >
          {t("checkMessageCta")}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
