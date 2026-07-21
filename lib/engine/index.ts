import { evaluateRules } from "./rules";
import type { EvidenceSpan, RuleEvaluation, VerdictBand } from "./types";

/*
 * Public API of the intelligence layer (spec §7). Phase 1 runs on the
 * deterministic rule engine alone; the neural classifier and tactic scorer
 * (Phases 2–3) will fuse in here behind the same return shape, so UI code
 * never has to change.
 */

export interface HighlightSegment {
  text: string;
  /** True when this segment is evidence for at least one rule. */
  highlighted: boolean;
}

export interface AnalysisResult {
  score: number;
  band: VerdictBand;
  overridden: boolean;
  reasons: Array<{
    ruleId: string;
    category: string;
    reasonKey: string;
    evidence: EvidenceSpan[];
  }>;
  /** The input split into plain/highlighted segments for evidence rendering. */
  segments: HighlightSegment[];
}

/** Merge all evidence spans into non-overlapping, sorted ranges. */
function mergeSpans(spans: EvidenceSpan[]): Array<{ start: number; end: number }> {
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const merged: Array<{ start: number; end: number }> = [];
  for (const span of sorted) {
    const last = merged[merged.length - 1];
    if (last && span.start <= last.end) {
      last.end = Math.max(last.end, span.end);
    } else {
      merged.push({ start: span.start, end: span.end });
    }
  }
  return merged;
}

function toSegments(raw: string, spans: EvidenceSpan[]): HighlightSegment[] {
  const ranges = mergeSpans(spans);
  if (ranges.length === 0) {
    return raw.length > 0 ? [{ text: raw, highlighted: false }] : [];
  }
  const segments: HighlightSegment[] = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start > cursor) {
      segments.push({ text: raw.slice(cursor, range.start), highlighted: false });
    }
    segments.push({ text: raw.slice(range.start, range.end), highlighted: true });
    cursor = range.end;
  }
  if (cursor < raw.length) {
    segments.push({ text: raw.slice(cursor), highlighted: false });
  }
  return segments;
}

export function analyze(text: string): AnalysisResult {
  const evaluation: RuleEvaluation = evaluateRules(text);

  // Strongest signals first, so the "Why" list leads with what matters.
  const reasons = [...evaluation.matches]
    .sort((a, b) => b.weight - a.weight)
    .map((m) => ({
      ruleId: m.ruleId,
      category: m.category,
      reasonKey: m.reasonKey,
      evidence: m.evidence,
    }));

  const allEvidence = evaluation.matches.flatMap((m) => m.evidence);

  return {
    score: evaluation.score,
    band: evaluation.band,
    overridden: evaluation.overridden,
    reasons,
    segments: toSegments(text, allEvidence),
  };
}

export type { EvidenceSpan, VerdictBand } from "./types";
