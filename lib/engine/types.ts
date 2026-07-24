/*
 * lib/engine is pure TypeScript — no React, no framework imports (spec §7).
 * It must stay portable to a future SMS/IVR gateway or embeddable widget.
 */

export type VerdictBand = "safe" | "caution" | "risky" | "danger";

export type RuleCategory =
  | "credential"
  | "upi"
  | "url"
  | "loan"
  | "impersonation"
  | "urgency"
  | "reward"
  | "textual";

/** A matched region of the original input, for evidence highlighting (§5.2). */
export interface EvidenceSpan {
  start: number;
  end: number;
  text: string;
}

export interface ExtractedUrl {
  span: EvidenceSpan;
  /** Full hostname, lowercased (e.g. "secure.sbi-verify.xyz"). */
  hostname: string;
  /** Registrable domain (e.g. "sbi-verify.xyz", "sbi.co.in"). */
  registrable: string;
  /** True when the URL was written with an explicit http:// (not https). */
  insecureScheme: boolean;
}

/** Shared, precomputed view of the input so rules don't re-parse. */
export interface RuleContext {
  raw: string;
  urls: ExtractedUrl[];
}

export interface Rule {
  /** Stable id, "<group>.<rule>" — e.g. "credential.secret-ask". */
  id: string;
  category: RuleCategory;
  /** Contribution to the 0–100 rule score when matched. */
  weight: number;
  /** i18n key (dot path) resolving to a translated explanation in gu/hi/en. */
  reasonKey: string;
  /** Hard floor on the verdict band, bypassing weights (§4.4 overrides). */
  override?: VerdictBand;
  /** Returns matched evidence spans; empty array means the rule did not fire. */
  detect: (ctx: RuleContext) => EvidenceSpan[];
}

export interface RuleMatch {
  ruleId: string;
  category: RuleCategory;
  weight: number;
  reasonKey: string;
  override?: VerdictBand;
  evidence: EvidenceSpan[];
}

export interface RuleEvaluation {
  /** 0–100. Sum of matched rule weights, clamped, then floored to any override band. */
  score: number;
  band: VerdictBand;
  matches: RuleMatch[];
  /** True when a hard override raised the band above what the score alone gave. */
  overridden: boolean;
  /**
   * The most severe hard-override band among matched rules, if any — regardless
   * of whether it changed the rules-only verdict. This is the floor that must
   * survive neural fusion (an explicit credential ask stays DANGER even if the
   * model pulls the weighted score down).
   */
  overrideBand?: VerdictBand;
}
