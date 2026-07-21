import type {
  EvidenceSpan,
  Rule,
  RuleCategory,
  RuleContext,
  VerdictBand,
} from "../types";

/** All matches of a pattern as evidence spans. Pattern must NOT be sticky. */
export function findAll(pattern: RegExp, text: string): EvidenceSpan[] {
  const flags = pattern.flags.includes("g")
    ? pattern.flags
    : `${pattern.flags}g`;
  const re = new RegExp(pattern.source, flags);
  const spans: EvidenceSpan[] = [];
  for (const match of text.matchAll(re)) {
    const matched = match[0];
    if (match.index === undefined || matched.length === 0) continue;
    spans.push({
      start: match.index,
      end: match.index + matched.length,
      text: matched,
    });
  }
  return spans;
}

/** First match of any pattern inside a window of text, or null. */
export function firstIn(patterns: readonly RegExp[], text: string): boolean {
  return patterns.some((p) => p.test(text));
}

/** The ±window characters of raw text around a span. */
export function windowAround(
  raw: string,
  span: EvidenceSpan,
  window: number,
): string {
  return raw.slice(Math.max(0, span.start - window), span.end + window);
}

interface LexiconRuleOptions {
  id: string;
  category: RuleCategory;
  weight: number;
  reasonKey: string;
  override?: VerdictBand;
  /** Any single pattern matching anywhere fires the rule. */
  patterns: readonly RegExp[];
}

/** A rule that fires when any lexicon pattern matches the input. */
export function lexiconRule(options: LexiconRuleOptions): Rule {
  const { patterns, ...rest } = options;
  return {
    ...rest,
    detect: (ctx: RuleContext) =>
      patterns.flatMap((pattern) => findAll(pattern, ctx.raw)),
  };
}

interface ProximityRuleOptions {
  id: string;
  category: RuleCategory;
  weight: number;
  reasonKey: string;
  override?: VerdictBand;
  /** Anchor patterns — evidence spans come from these. */
  anchor: readonly RegExp[];
  /** Required companion pattern within ±window chars of each anchor match. */
  near: readonly RegExp[];
  /** Optional veto: if this matches inside the window, the anchor is skipped. */
  unless?: readonly RegExp[];
  window: number;
}

/**
 * A rule that fires when an anchor term and a companion term appear close
 * together — and no veto term appears in the same window. Used where a term
 * alone is innocent (e.g. "OTP" in a genuine delivery SMS) but a nearby
 * request verb makes it an attack.
 */
export function proximityRule(options: ProximityRuleOptions): Rule {
  const { anchor, near, unless, window, ...rest } = options;
  return {
    ...rest,
    detect: (ctx: RuleContext) => {
      const spans: EvidenceSpan[] = [];
      for (const pattern of anchor) {
        for (const span of findAll(pattern, ctx.raw)) {
          const context = windowAround(ctx.raw, span, window);
          if (!firstIn(near, context)) continue;
          if (unless && firstIn(unless, context)) continue;
          spans.push(span);
        }
      }
      return spans;
    },
  };
}
