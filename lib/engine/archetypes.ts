import { findAll } from "./rules/helpers";
import type { RuleEvaluation } from "./types";
import type { TacticAxis, TacticScores } from "./tactics/axes";

/*
 * Scam-archetype matcher (spec §4.3). Maps an input to one of the 16 known
 * Indian fraud archetypes (verbatim from scripts/validate-corpus.ts) using
 * discriminating keywords (the primary signal — archetypes share tactics but
 * differ in vocabulary), backed by the tactic signature and rule hints. The
 * archetype drives the "how this plays out / what they'll ask next" copy (§5.2)
 * and the guided playbook (§5.5).
 */

export const ARCHETYPE_IDS = [
  "kyc-expiry",
  "upi-collect",
  "refund-reversal",
  "digital-arrest",
  "courier-parcel",
  "electricity-bill",
  "army-officer",
  "loan-advance-fee",
  "job-task",
  "lottery-prize",
  "sim-swap",
  "card-upgrade",
  "investment-trading",
  "qr-receive",
  "phishing-link",
  "other",
] as const;

export type ArchetypeId = (typeof ARCHETYPE_IDS)[number];

interface ArchetypeDef {
  id: ArchetypeId;
  /** Discriminating keywords (trilingual). Each distinct match is a strong vote. */
  keywords: readonly RegExp[];
  /** Characteristic tactic axes — a soft tiebreaker between similar archetypes. */
  signature: readonly TacticAxis[];
  /** Rule ids that strongly indicate this archetype. */
  ruleHints?: readonly string[];
}

// "other" and "phishing-link" are deliberately last / low-keyword so a specific
// archetype wins whenever one matches.
const ARCHETYPES: readonly ArchetypeDef[] = [
  {
    id: "kyc-expiry",
    keywords: [/\bkyc\b/giu, /e-?kyc/giu, /verify\s?(?:your\s?)?account/giu, /કેવાયસી/gu, /केवाईसी/gu],
    signature: ["urgency", "authority", "fear"],
  },
  {
    id: "upi-collect",
    keywords: [
      /collect\s?request/giu,
      /payment\s?request/giu,
      /approve\s?(?:the\s?|it|my)?\s?request/giu,
      /accept\s?(?:the\s?)?(?:payment|request)/giu,
      /enter\s?(?:your\s?)?upi\s?pin/giu,
    ],
    signature: ["credential", "irreversibility", "reward"],
    ruleHints: ["upi.collect-to-receive"],
  },
  {
    id: "refund-reversal",
    keywords: [
      /by\s?mistake/giu,
      /wrongly\s?(?:sent|transferred)/giu,
      /return\s?(?:the\s?)?money/giu,
      /send\s?(?:it\s?)?back/giu,
      /galti\s?se/giu,
      /ભૂલથી/gu,
      /गलती\s?से/gu,
    ],
    signature: ["trust", "irreversibility"],
    ruleHints: ["upi.wrong-transfer-return"],
  },
  {
    id: "digital-arrest",
    keywords: [
      /digital\s?arrest/giu,
      /under\s?arrest/giu,
      /\bcbi\b/giu,
      /cyber\s?(?:crime|cell|branch)/giu,
      /money\s?laundering/giu,
      /ધરપકડ/gu,
      /गिरफ्तार/gu,
    ],
    signature: ["authority", "fear", "secrecy"],
    ruleHints: ["impersonation.digital-arrest"],
  },
  {
    id: "courier-parcel",
    keywords: [
      /parcel/giu,
      /courier/giu,
      /(?:fedex|dhl|blue\s?dart)/giu,
      /customs?\b/giu,
      /clearance\s?fee/giu,
      /પાર્સલ/gu,
      /पार्सल/gu,
    ],
    signature: ["authority", "fear", "urgency"],
  },
  {
    id: "electricity-bill",
    keywords: [
      /electricity/giu,
      /power\s?(?:will\s?be\s?)?(?:cut|disconnect)/giu,
      /bill\s?(?:was\s?)?not\s?updated/giu,
      /વીજળી/gu,
      /बिजली/gu,
    ],
    signature: ["urgency", "authority", "fear"],
  },
  {
    id: "army-officer",
    keywords: [
      /(?:indian\s?)?army|navy|crpf|subedar/giu,
      /\b(?:major|captain)\b/giu,
      /\bolx\b|quikr/giu,
      /posted\s?at\s?(?:the\s?)?border/giu,
    ],
    signature: ["trust", "authority"],
  },
  {
    id: "loan-advance-fee",
    keywords: [
      /processing\s?fee/giu,
      /file\s?charges/giu,
      /no\s?documents?/giu,
      /rbi\s?approved|registered\s?nbfc/giu,
      /instant\s?(?:personal\s?)?loan/giu,
    ],
    signature: ["reward", "authority"],
    ruleHints: ["loan.advance-fee", "loan.too-easy"],
  },
  {
    id: "job-task",
    keywords: [
      /work\s?from\s?home/giu,
      /part[\s-]?time\s?job/giu,
      /\btask\b/giu,
      /registration\s?(?:fee|amount)?/giu,
      /earn\s?(?:₹|rs\.?|rupees)?\s?[\d,]+\s?(?:daily|per\s?day)/giu,
    ],
    signature: ["reward", "urgency"],
    ruleHints: ["reward.job-upfront"],
  },
  {
    id: "lottery-prize",
    keywords: [
      /lotter/giu,
      /\bkbc\b/giu,
      /lucky\s?draw/giu,
      /\bprize\b/giu,
      /you\s?(?:have\s?)?won/giu,
      /jackpot/giu,
      /લોટરી/gu,
      /लॉटरी/gu,
    ],
    signature: ["reward"],
    ruleHints: ["reward.lottery-prize"],
  },
  {
    id: "sim-swap",
    keywords: [
      /\bsim\b/giu,
      /de-?activat/giu,
      /re-?verify/giu,
      /(?:sim|number)\s?(?:will\s?be\s?)?block/giu,
    ],
    signature: ["urgency", "authority", "fear"],
  },
  {
    id: "card-upgrade",
    keywords: [
      /credit\s?card/giu,
      /card\s?(?:limit\s?)?upgrade/giu,
      /limit\s?(?:has\s?been\s?)?(?:upgraded|increased)/giu,
      /reward\s?points?/giu,
    ],
    signature: ["reward", "credential"],
  },
  {
    id: "investment-trading",
    keywords: [
      /trading\s?(?:group|tips?)/giu,
      /guaranteed\s?(?:profit|return)/giu,
      /double\s?your\s?money/giu,
      /\bbitcoin\b|crypto/giu,
      /\d+x\s?returns?/giu,
    ],
    signature: ["reward"],
    ruleHints: ["reward.investment"],
  },
  {
    id: "qr-receive",
    keywords: [/scan\s?(?:this|the)?\s?qr/giu, /qr\s?code/giu, /ક્યુઆર/gu, /क्यूआर/gu],
    signature: ["irreversibility", "credential", "reward"],
    ruleHints: ["upi.qr-receive"],
  },
  {
    id: "phishing-link",
    // Generic credential/verify link — only wins when no specific archetype does.
    keywords: [/verify\s?(?:at|here|now)/giu, /re-?activate/giu, /suspicious\s?transaction/giu],
    signature: ["urgency", "credential", "fear"],
    ruleHints: ["url.apk-download"],
  },
];

const KEYWORD_VOTE = 50;
const RULE_VOTE = 30;
/** Below this best-score, the archetype is too ambiguous to name. */
const MIN_SCORE = 40;

export interface ArchetypeMatch {
  id: ArchetypeId;
  confidence: number;
}

/**
 * Best-matching archetype for the input, or null when nothing scores clearly
 * (benign text, or a scam with no distinctive archetype vocabulary).
 */
export function matchArchetype(
  text: string,
  tactics: TacticScores,
  evaluation?: RuleEvaluation,
): ArchetypeMatch | null {
  const matchedRuleIds = new Set(
    (evaluation?.matches ?? []).map((m) => m.ruleId),
  );

  let best: ArchetypeDef | null = null;
  let bestScore = 0;

  for (const def of ARCHETYPES) {
    if (def.id === "other") continue;

    let score = 0;
    for (const kw of def.keywords) {
      if (findAll(kw, text).length > 0) score += KEYWORD_VOTE;
    }
    for (const hint of def.ruleHints ?? []) {
      if (matchedRuleIds.has(hint)) score += RULE_VOTE;
    }
    // Tactic alignment: soft support, capped so it never outvotes vocabulary.
    const sig = def.signature;
    const sigAvg =
      sig.reduce((sum, ax) => sum + tactics[ax], 0) / Math.max(sig.length, 1);
    score += Math.min(20, sigAvg * 0.2);

    if (score > bestScore) {
      bestScore = score;
      best = def;
    }
  }

  if (!best || bestScore < MIN_SCORE) return null;
  return { id: best.id, confidence: Math.min(1, bestScore / 100) };
}
