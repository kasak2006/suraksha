import { clampScore, fuse } from "./calibration";
import { classify, getModelState, type ModelState } from "./classifier";
import { evaluateRules } from "./rules";
import type { EvidenceSpan, RuleEvaluation, VerdictBand } from "./types";

/*
 * Public API of the intelligence layer (spec §7).
 *
 * `analyze` is synchronous and runs the deterministic rule engine alone, so the
 * UI can render a verdict in <300ms (§10). `analyzeWithModel` is the async
 * companion: it lazily loads the neural classifier, fuses pScam with the rule
 * score (§4.4), and returns the SAME shape — so the /check page renders rules
 * first and refines when the model resolves, and degrades to rules-only if the
 * model never loads.
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
  /** Neural model load state (§4.1). 'unloaded' on the synchronous rules path. */
  modelState: ModelState;
  /** Neural scam probability 0–1, present only once the model has scored. */
  pScam?: number;
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

/** Reasons (strongest-first) and evidence segments — shared by both entry points. */
function explain(
  text: string,
  evaluation: RuleEvaluation,
): Pick<AnalysisResult, "reasons" | "segments"> {
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
  return { reasons, segments: toSegments(text, allEvidence) };
}

export function analyze(text: string): AnalysisResult {
  const evaluation: RuleEvaluation = evaluateRules(text);
  return {
    score: evaluation.score,
    band: evaluation.band,
    overridden: evaluation.overridden,
    ...explain(text, evaluation),
    modelState: getModelState(),
  };
}

/**
 * Rules + neural fusion (§4.4). Lazily loads the encoder on first call. If the
 * model is unavailable (no trained head, or load failure) the result is the
 * rules-only verdict with `modelState: 'failed'` — the tested degradation path.
 */
export async function analyzeWithModel(text: string): Promise<AnalysisResult> {
  const evaluation: RuleEvaluation = evaluateRules(text);
  const shared = explain(text, evaluation);

  const pScam = await classify(text);
  if (pScam === null) {
    return {
      score: evaluation.score,
      band: evaluation.band,
      overridden: evaluation.overridden,
      ...shared,
      modelState: getModelState(),
    };
  }

  // Fuse the RAW rule score (pre-override) so the override isn't double-counted;
  // the matched override band is applied as a hard floor inside fuse().
  const rawRuleScore = clampScore(
    evaluation.matches.reduce((sum, m) => sum + m.weight, 0),
  );
  const fused = fuse({
    pScam,
    ruleScore: rawRuleScore,
    tacticPeak: 0,
    // The hard-override floor must hold even when it didn't change the
    // rules-only verdict — otherwise fusion could talk an explicit OTP/PIN ask
    // down out of DANGER.
    overrideBand: evaluation.overrideBand,
  });

  return {
    score: fused.score,
    band: fused.band,
    overridden: fused.overridden,
    ...shared,
    modelState: getModelState(),
    pScam,
  };
}

export type { EvidenceSpan, VerdictBand } from "./types";
export type { ModelState } from "./classifier";
