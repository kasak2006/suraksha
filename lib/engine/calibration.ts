import type { VerdictBand } from "./types";

/*
 * §4.4 — bands: SAFE 0–24 · CAUTION 25–54 · RISKY 55–79 · DANGER 80–100.
 * Fusion weights for the neural layer arrive in Phase 2; Phase 1 verdicts
 * run on the rule score alone.
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
