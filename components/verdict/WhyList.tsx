import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AnalysisResult } from "@/lib/engine";

/*
 * The "Why" section (spec §5.2): one entry per matched rule, strongest first,
 * each showing the phrase(s) that triggered it and a tap-to-expand plain-language
 * reason. Uses native <details> so it works without JavaScript.
 */
export function WhyList({ reasons }: { reasons: AnalysisResult["reasons"] }) {
  const t = useTranslations();

  return (
    <ul className="flex flex-col gap-3">
      {reasons.map((reason) => {
        const snippet = reason.evidence
          .map((e) => e.text.trim())
          .filter((s) => s.length > 0)
          .slice(0, 3)
          .join(" · ");
        return (
          <li key={reason.ruleId}>
            <details className="group rounded-xl border border-border bg-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
                <span className="text-base font-semibold">
                  {snippet.length > 0 ? `“${snippet}”` : t(reason.reasonKey)}
                </span>
                <ChevronDown
                  className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="px-4 pb-4 text-base leading-relaxed text-muted-foreground">
                {t(reason.reasonKey)}
              </p>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
