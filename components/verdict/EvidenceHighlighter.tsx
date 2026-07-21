import type { HighlightSegment } from "@/lib/engine";

/*
 * Renders the original message with evidence spans marked. The highlight uses
 * the neutral accent, not a verdict colour — verdict colours stay reserved for
 * the verdict card itself (spec §8).
 */
export function EvidenceHighlighter({
  segments,
}: {
  segments: HighlightSegment[];
}) {
  return (
    <p className="rounded-xl border border-border bg-card p-4 text-base leading-relaxed break-words whitespace-pre-wrap">
      {segments.map((segment, i) =>
        segment.highlighted ? (
          <mark
            key={i}
            className="rounded bg-accent/25 px-0.5 font-semibold text-foreground underline decoration-accent decoration-2 underline-offset-2"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={i}>{segment.text}</span>
        ),
      )}
    </p>
  );
}
