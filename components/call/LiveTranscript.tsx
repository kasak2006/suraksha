"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

/*
 * The scrolling live transcript (spec §5.3). Final phrases render solid; the
 * interim (still-being-recognised) phrase is dimmed. Auto-scrolls to the newest
 * text. aria-live keeps it available to screen readers.
 */
export function LiveTranscript({
  final,
  interim,
}: {
  final: string;
  interim: string;
}) {
  const t = useTranslations("call");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [final, interim]);

  const empty = final.trim().length === 0 && interim.trim().length === 0;

  return (
    <div
      className="max-h-56 min-h-24 overflow-y-auto rounded-xl border border-border bg-card p-4 text-lg leading-relaxed"
      aria-live="polite"
      aria-label={t("transcriptLabel")}
    >
      {empty ? (
        <p className="text-muted-foreground">{t("transcriptEmpty")}</p>
      ) : (
        <p>
          <span>{final}</span>
          {interim && <span className="text-muted-foreground"> {interim}</span>}
        </p>
      )}
      <div ref={endRef} />
    </div>
  );
}
