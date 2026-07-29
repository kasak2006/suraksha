/*
 * The 8 manipulation-tactic axes (spec §4.3) — the "psychological grammar" of a
 * scam. Kept verbatim-identical to the corpus `tactics` vocabulary in
 * scripts/validate-corpus.ts / notebooks/train.ipynb / data/LABELLING.md, so the
 * scorer and the labelled data speak the same language.
 *
 * NOTE: these are distinct from the 8 RuleCategory groups — they overlap
 * (urgency, reward, credential) but authority/fear/secrecy/trust/irreversibility
 * have no direct rule group and are scored here from dedicated lexicons.
 */

export const TACTIC_AXES = [
  "urgency",
  "authority",
  "fear",
  "reward",
  "secrecy",
  "credential",
  "trust",
  "irreversibility",
] as const;

export type TacticAxis = (typeof TACTIC_AXES)[number];

/** 0–100 intensity per axis. */
export type TacticScores = Record<TacticAxis, number>;
