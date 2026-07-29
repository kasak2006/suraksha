"use client";

import { ArrowRight, Fingerprint } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ArchetypeMatch } from "@/lib/engine/archetypes";
import { Link } from "@/lib/i18n/navigation";

/*
 * Names the scam archetype and, crucially, predicts what the scammer will ask
 * for next (spec §5.2 — the killer demo moment). Links to the guided playbook.
 */
export function ArchetypeCard({ archetype }: { archetype: ArchetypeMatch }) {
  const t = useTranslations("archetypes");
  const tc = useTranslations("check");
  const id = archetype.id;

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <Fingerprint className="size-6 shrink-0 text-primary" aria-hidden />
        <h3 className="text-lg font-bold">{t(`${id}.name`)}</h3>
      </div>

      <p className="text-base leading-relaxed text-muted-foreground">
        {t(`${id}.summary`)}
      </p>

      <div className="rounded-xl bg-muted p-4">
        <p className="text-sm font-semibold text-foreground">
          {tc("archetypeNextLabel")}
        </p>
        <p className="mt-1 text-base leading-relaxed text-foreground">
          {t(`${id}.nextStep`)}
        </p>
      </div>

      <Link
        href={`/playbook/${id}`}
        className="mt-1 inline-flex items-center gap-2 font-semibold text-primary hover:underline"
      >
        {tc("archetypePlaybookLink")}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </section>
  );
}
