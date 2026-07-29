"use client";

import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ArchetypeId } from "@/lib/engine/archetypes";
import { Button } from "@/components/ui/button";

/*
 * Complaint-draft generator (spec §5.5). Fills a copy-pasteable complaint from
 * the few details the user knows, in their language. Zero cost, high practical
 * value — most users have never filed a cyber-fraud complaint before.
 */
export function ComplaintDraft({ archetypeId }: { archetypeId: ArchetypeId }) {
  const t = useTranslations("playbook.complaint");
  const ta = useTranslations("archetypes");

  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [vpa, setVpa] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const draft = t("template", {
    archetype: ta(`${archetypeId}.name`),
    date: date.trim() || "—",
    amount: amount.trim() || "—",
    vpa: vpa.trim() || "—",
    message: message.trim() || "—",
  });

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (insecure context / old browser) — the textarea
      // below is selectable as a fallback.
    }
  }

  const field = "rounded-xl border border-border bg-card px-4 py-3 text-base";

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-muted p-5">
      <div>
        <h2 className="text-lg font-bold">{t("heading")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("fields.date")}
          <input className={field} value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("fields.amount")}
          <input
            className={field}
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
          {t("fields.vpa")}
          <input className={field} value={vpa} onChange={(e) => setVpa(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
          {t("fields.message")}
          <textarea
            className={`${field} min-h-24`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
      </div>

      <textarea
        readOnly
        value={draft}
        aria-label={t("heading")}
        className="min-h-48 w-full rounded-xl border border-border bg-card p-4 font-mono text-sm leading-relaxed"
      />

      <Button type="button" onClick={copy} className="self-start">
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copied ? t("copied") : t("copy")}
      </Button>
    </section>
  );
}
