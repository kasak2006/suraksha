import { clampScore } from "../calibration";
import { findAll } from "../rules/helpers";
import type { EvidenceSpan, RuleEvaluation } from "../types";
import { TACTIC_AXES, type TacticAxis, type TacticScores } from "./axes";
import { AXIS_LEXICONS } from "./lexicons";

/*
 * Component C — the manipulation-tactic scorer (spec §4.3). Scores the input
 * 0–100 on each of the 8 axes from (a) trilingual lexicon hits and (b)
 * corroboration from matched rules mapped to their tactic. Deterministic and
 * language-portable, so it runs on both the sync and async analyse paths and
 * feeds `tacticPeak` into fusion.
 */

export { TACTIC_AXES } from "./axes";
export type { TacticAxis, TacticScores } from "./axes";

/** Per distinct matching lexicon pattern for an axis. */
const LEXICON_HIT = 30;
/** Boost when a matched rule corroborates an axis. */
const RULE_BOOST = 40;

/**
 * Which tactic axes a matched rule corroborates. Rules already encode strong,
 * tested signals; mapping them into axes keeps the radar consistent with the
 * "Why" list. Keyed by rule id, with a category fallback below.
 */
const RULE_AXES: Record<string, readonly TacticAxis[]> = {
  "credential.secret-ask": ["credential"],
  "credential.remote-access": ["credential"],
  "credential.install-app": ["credential"],
  "upi.collect-to-receive": ["credential", "irreversibility"],
  "upi.qr-receive": ["irreversibility", "credential"],
  "upi.wrong-transfer-return": ["trust", "irreversibility"],
  "upi.refund-bait": ["reward"],
  "upi.unusual-vpa": ["irreversibility"],
  "url.apk-download": ["credential", "irreversibility"],
  "impersonation.authority-claim": ["authority"],
  "impersonation.digital-arrest": ["authority", "fear", "secrecy"],
  "impersonation.sender-id-mismatch": ["authority"],
  "urgency.deadline": ["urgency"],
  "urgency.secrecy": ["secrecy"],
  "reward.lottery-prize": ["reward"],
  "reward.job-upfront": ["reward"],
  "reward.investment": ["reward"],
  "loan.advance-fee": ["reward"],
  "loan.too-easy": ["reward"],
  "loan.rbi-claim": ["authority"],
};

function zeroScores(): TacticScores {
  return {
    urgency: 0,
    authority: 0,
    fear: 0,
    reward: 0,
    secrecy: 0,
    credential: 0,
    trust: 0,
    irreversibility: 0,
  };
}

function emptyEvidence(): Record<TacticAxis, EvidenceSpan[]> {
  return {
    urgency: [],
    authority: [],
    fear: [],
    reward: [],
    secrecy: [],
    credential: [],
    trust: [],
    irreversibility: [],
  };
}

export interface TacticResult {
  scores: TacticScores;
  /** The strongest single axis, 0–100 — the value fusion weights (§4.4). */
  peak: number;
  /** Matched spans per axis, for evidence/tooltips. */
  evidence: Record<TacticAxis, EvidenceSpan[]>;
}

/**
 * Score the 8 tactic axes for `text`. Pass the rule evaluation to fold in rule
 * corroboration (recommended); lexicons alone work too.
 */
export function scoreTactics(
  text: string,
  evaluation?: RuleEvaluation,
): TacticResult {
  const scores = zeroScores();
  const evidence = emptyEvidence();

  for (const axis of TACTIC_AXES) {
    let hitPatterns = 0;
    for (const pattern of AXIS_LEXICONS[axis]) {
      const spans = findAll(pattern, text);
      if (spans.length > 0) {
        hitPatterns += 1;
        evidence[axis].push(...spans);
      }
    }
    scores[axis] = Math.min(100, hitPatterns * LEXICON_HIT);
  }

  if (evaluation) {
    for (const match of evaluation.matches) {
      const axes = RULE_AXES[match.ruleId];
      if (!axes) continue;
      for (const axis of axes) {
        scores[axis] = clampScore(scores[axis] + RULE_BOOST);
      }
    }
  }

  let peak = 0;
  for (const axis of TACTIC_AXES) {
    scores[axis] = clampScore(scores[axis]);
    if (scores[axis] > peak) peak = scores[axis];
  }

  return { scores, peak, evidence };
}
