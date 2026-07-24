import { clampScore } from "./calibration";
import { evaluateRules } from "./rules";
import type { RuleCategory } from "./types";

/*
 * Rule-group feature vector — the "R" block the classifier fuses with the
 * embedding and metadata (notebook cell 6, `GROUPS`). One number per rule
 * category: the sum of matched rule weights in that group, clamped to 0–100.
 *
 * This is the single source of truth shared by the offline exporter
 * (scripts/score-corpus.ts) and the in-browser classifier, so the features the
 * head was trained on match the features it scores against at runtime.
 */

/** Order is fixed and must match the notebook's GROUPS array exactly. */
export const RULE_GROUPS: readonly RuleCategory[] = [
  "credential",
  "upi",
  "url",
  "loan",
  "impersonation",
  "urgency",
  "reward",
  "textual",
];

export type RuleGroupScores = Record<RuleCategory, number>;

/** Per-group score map for a message: summed rule weights, clamped to 100. */
export function ruleGroupScores(text: string): RuleGroupScores {
  const scores = Object.fromEntries(
    RULE_GROUPS.map((g) => [g, 0]),
  ) as RuleGroupScores;

  for (const match of evaluateRules(text).matches) {
    scores[match.category] += match.weight;
  }

  for (const group of RULE_GROUPS) {
    scores[group] = clampScore(scores[group]);
  }
  return scores;
}

/** The group scores as a normalised 0–1 vector, in RULE_GROUPS order —
 *  the exact "R" slice the classifier head expects (notebook: `d[g] / 100`). */
export function ruleGroupVector(text: string): number[] {
  const scores = ruleGroupScores(text);
  return RULE_GROUPS.map((g) => scores[g] / 100);
}
