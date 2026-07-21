import { bandFloor, clampScore, maxBand, scoreToBand } from "../calibration";
import type {
  Rule,
  RuleContext,
  RuleEvaluation,
  RuleMatch,
  VerdictBand,
} from "../types";
import { extractUrls } from "../text";
import { credentialRules } from "./credential";
import { impersonationRules } from "./impersonation";
import { loanRules } from "./loan";
import { rewardRules } from "./reward";
import { textualRules } from "./textual";
import { upiRules } from "./upi";
import { urgencyRules } from "./urgency";
import { urlRules } from "./url";

export const allRules: readonly Rule[] = [
  ...credentialRules,
  ...upiRules,
  ...urlRules,
  ...loanRules,
  ...impersonationRules,
  ...urgencyRules,
  ...rewardRules,
  ...textualRules,
];

export function evaluateRules(
  text: string,
  rules: readonly Rule[] = allRules,
): RuleEvaluation {
  const ctx: RuleContext = { raw: text, urls: extractUrls(text) };

  const matches: RuleMatch[] = [];
  for (const rule of rules) {
    const evidence = rule.detect(ctx);
    if (evidence.length === 0) continue;
    matches.push({
      ruleId: rule.id,
      category: rule.category,
      weight: rule.weight,
      reasonKey: rule.reasonKey,
      ...(rule.override !== undefined && { override: rule.override }),
      evidence,
    });
  }

  const rawScore = clampScore(
    matches.reduce((sum, match) => sum + match.weight, 0),
  );
  const scoreBand = scoreToBand(rawScore);

  let band: VerdictBand = scoreBand;
  for (const match of matches) {
    if (match.override !== undefined) band = maxBand(band, match.override);
  }

  const overridden = band !== scoreBand;
  const score = overridden ? Math.max(rawScore, bandFloor(band)) : rawScore;

  return { score, band, matches, overridden };
}
