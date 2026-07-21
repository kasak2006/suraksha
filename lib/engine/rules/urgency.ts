import type { EvidenceSpan, Rule, RuleContext } from "../types";
import { findAll, firstIn, lexiconRule, windowAround } from "./helpers";

/*
 * §4.2 "Urgency & time pressure". Manufactured deadlines and the secrecy demand
 * ("don't tell family or bank staff") are the psychological engine of scams —
 * they stop the victim from pausing to verify.
 */

const DEADLINE_TERMS: readonly RegExp[] = [
  /within\s?\d+\s?(?:hours?|hrs?|minutes?|mins?)/giu,
  /in\s?the\s?next\s?\d+\s?(?:hours?|minutes?)/giu,
  /(?:account|khata|खाता|ખાતું)[^.?!]{0,40}(?:block|suspend|close|freeze|band|बंद|બંધ)/giu,
  /(?:block|suspend|close|freeze)[^.?!]{0,30}(?:today|now|immediately|within)/giu,
  /last\s?chance/giu,
  /act\s?(?:now|immediately|fast)/giu,
  /immediately/giu,
  /expire[sd]?\s?(?:today|soon|now)/giu,
  /તાત્કાલિક/gu,
  /તાકીદ/gu,
  /આજે\s?જ/gu,
  /તરત\s?જ/gu,
  /છેલ્લી\s?તક/gu,
  /तुरंत/gu,
  /तत्काल/gu,
  /आज\s?ही/gu,
  /अभी\s?ही/gu,
  /आखिरी\s?मौका/gu,
  /\d+\s?घंटे\s?में/gu,
  /\d+\s?કલાકમાં/gu,
];

const SECRECY_TERMS: readonly RegExp[] = [
  /do\s?not\s?tell\s?(?:anyone|any\s?one|anybody)/giu,
  /don'?t\s?tell\s?(?:anyone|anybody|family)/giu,
  /keep\s?(?:this|it)\s?(?:a\s?)?secret/giu,
  /not\s?even\s?(?:your\s?)?(?:family|bank)/giu,
  /between\s?(?:us|you\s?and\s?me)/giu,
  /કોઈને\s?(?:કહેશો|જણાવશો)\s?નહીં/gu,
  /કોઈને\s?ન\s?કહો/gu,
  /ગુપ્ત\s?રાખ/gu,
  /किसी\s?को\s?(?:मत|न|नहीं)\s?बता/gu,
  /किसी\s?को\s?मत\s?बताना/gu,
  /गुप्त\s?रख/gu,
  /राज़\s?रख/gu,
];

/**
 * A credential mention next to the secrecy phrase means it is legitimate
 * security advice ("don't share your OTP with anyone"), not the scam's
 * isolate-from-help tactic ("don't tell your family about this call").
 */
const CREDENTIAL_NEARBY: readonly RegExp[] = [
  /\botp\b/giu,
  /\bpin\b/giu,
  /\bcvv\b/giu,
  /password/giu,
  /ઓ\.?ટી\.?પી/gu,
  /પિન/gu,
  /પાસવર્ડ/gu,
  /ओ\.?टी\.?पी/gu,
  /पिन/gu,
  /पासवर्ड/gu,
];

const secrecy: Rule = {
  id: "urgency.secrecy",
  category: "urgency",
  weight: 55,
  reasonKey: "reasons.urgency.secrecy",
  detect: (ctx: RuleContext) => {
    const spans: EvidenceSpan[] = [];
    for (const pattern of SECRECY_TERMS) {
      for (const span of findAll(pattern, ctx.raw)) {
        const context = windowAround(ctx.raw, span, 40);
        if (firstIn(CREDENTIAL_NEARBY, context)) continue;
        spans.push(span);
      }
    }
    return spans;
  },
};

export const urgencyRules: readonly Rule[] = [
  lexiconRule({
    id: "urgency.deadline",
    category: "urgency",
    weight: 30,
    reasonKey: "reasons.urgency.deadline",
    patterns: DEADLINE_TERMS,
  }),
  secrecy,
];
