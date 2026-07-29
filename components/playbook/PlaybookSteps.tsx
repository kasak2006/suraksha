"use client";

import { ExternalLink, Phone, Volume2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Playbook } from "@/lib/engine/playbooks";
import { speak } from "@/lib/speech/tts";
import { useTtsAvailable } from "@/lib/speech/useTts";

/*
 * The guided response checklist (spec §5.5). Three ordered buckets; each step is
 * tappable so a panicking user can track what they've done. The "if money went"
 * bucket carries the two official channels (1930, cybercrime.gov.in).
 */

const BUCKETS = ["rightNow", "next10Min", "ifMoneyGone"] as const;

function StepItem({ label }: { label: string }) {
  const [done, setDone] = useState(false);
  return (
    <li>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4">
        <input
          type="checkbox"
          checked={done}
          onChange={(e) => setDone(e.target.checked)}
          className="mt-1 size-5 shrink-0 accent-[var(--primary)]"
        />
        <span
          className={
            done
              ? "text-base leading-relaxed text-muted-foreground line-through"
              : "text-base leading-relaxed text-foreground"
          }
        >
          {label}
        </span>
      </label>
    </li>
  );
}

export function PlaybookSteps({ playbook }: { playbook: Playbook }) {
  const t = useTranslations("playbook");
  const locale = useLocale();
  const canSpeak = useTtsAvailable(locale);

  function readAllAloud() {
    const all = BUCKETS.flatMap((bucket) => [
      t(`buckets.${bucket}`),
      ...playbook[bucket].map((step) => t(`steps.${step}`)),
    ]).join(". ");
    speak(all, locale);
  }

  return (
    <div className="flex flex-col gap-8">
      {canSpeak && (
        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={readAllAloud}
        >
          <Volume2 aria-hidden />
          {t("readAloud")}
        </Button>
      )}

      {BUCKETS.map((bucket) => (
        <section key={bucket} className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">{t(`buckets.${bucket}`)}</h2>
          <ol className="flex flex-col gap-3">
            {playbook[bucket].map((step) => (
              <StepItem key={step} label={t(`steps.${step}`)} />
            ))}
          </ol>

          {bucket === "ifMoneyGone" && (
            <div className="mt-1 flex flex-wrap gap-3">
              <a
                href="tel:1930"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground"
              >
                <Phone className="size-4" aria-hidden />
                {t("helpline.call1930")}
              </a>
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 font-semibold text-primary"
              >
                <ExternalLink className="size-4" aria-hidden />
                {t("helpline.portal")}
              </a>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
