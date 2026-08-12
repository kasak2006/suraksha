import type { VerdictBand } from "./types";

/*
 * §4.4 — bands: SAFE 0–24 · CAUTION 25–54 · RISKY 55–79 · DANGER 80–100.
 * Phase 1 verdicts ran on the rule score alone; Phase 2 fuses the neural
 * classifier and (Phase 3) the tactic scorer into the same 0–100 scale below.
 */

const BAND_FLOORS: ReadonlyArray<{ band: VerdictBand; floor: number }> = [
  { band: "danger", floor: 80 },
  { band: "risky", floor: 55 },
  { band: "caution", floor: 25 },
  { band: "safe", floor: 0 },
];

const BAND_ORDER: Record<VerdictBand, number> = {
  safe: 0,
  caution: 1,
  risky: 2,
  danger: 3,
};

export function scoreToBand(score: number): VerdictBand {
  for (const { band, floor } of BAND_FLOORS) {
    if (score >= floor) return band;
  }
  return "safe";
}

export function bandFloor(band: VerdictBand): number {
  const entry = BAND_FLOORS.find((b) => b.band === band);
  return entry ? entry.floor : 0;
}

export function maxBand(a: VerdictBand, b: VerdictBand): VerdictBand {
  return BAND_ORDER[a] >= BAND_ORDER[b] ? a : b;
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

/** Clamp to the 0–100 range without rounding, for intermediate fusion terms. */
function clampRange(x: number): number {
  return Math.max(0, Math.min(100, x));
}

/*
 * Fusion (§4.4): riskScore = w1·pScam + w2·ruleScore + w3·tacticPeak.
 *
 * Scale fix flagged in Phase 1: all three components are normalised to the SAME
 * 0–100 scale *before* weighting — pScam arrives as 0–1, the rule and tactic
 * scores as 0–100. Weights are [0.45, 0.40, 0.15] (neural / rules / tactic).
 * All three are live: the real tacticPeak from scoreTactics() feeds the third
 * term (analyzeWithModel), so pure fusion spans the full 0–100 range. Hard
 * overrides (explicit OTP/PIN ask, APK link) still floor to DANGER regardless.
 */
export const FUSION_WEIGHTS = {
  neural: 0.45,
  rules: 0.4,
  tactic: 0.15,
} as const;

export interface FusionInput {
  /** Neural head output, 0–1. */
  pScam: number;
  /** Deterministic rule score, 0–100. */
  ruleScore: number;
  /** Peak tactic-axis score, 0–100. Stubbed 0 until Phase 3. */
  tacticPeak?: number;
  /** Hard band floor from a matched override rule (credential ask, APK link). */
  overrideBand?: VerdictBand;
}

export interface FusionResult {
  score: number;
  band: VerdictBand;
  overridden: boolean;
}

export function fuse({
  pScam,
  ruleScore,
  tacticPeak = 0,
  overrideBand,
}: FusionInput): FusionResult {
  const neural = clampRange(pScam * 100);
  const rules = clampRange(ruleScore);
  const tactic = clampRange(tacticPeak);

  const weighted = clampScore(
    FUSION_WEIGHTS.neural * neural +
      FUSION_WEIGHTS.rules * rules +
      FUSION_WEIGHTS.tactic * tactic,
  );
  const weightedBand = scoreToBand(weighted);

  // Hard overrides bypass the weights entirely: an explicit OTP/PIN request or
  // an APK link is at least DANGER no matter what the neural model believes.
  // This is deliberate safety engineering — a missed scam can cost someone their
  // savings, while a false alarm costs ten seconds — so the model is never
  // allowed to talk the verdict *down* below a structural red flag.
  const band = overrideBand ? maxBand(weightedBand, overrideBand) : weightedBand;
  const overridden = band !== weightedBand;
  const score = overridden ? Math.max(weighted, bandFloor(band)) : weighted;

  return { score, band, overridden };
}
