import type { Rule, RuleContext } from "../types";
import { findAll, firstIn, lexiconRule } from "./helpers";

/*
 * §4.2 "Impersonation & authority". Scammers borrow the identity of a bank,
 * regulator, police force or courier. The "digital arrest" pattern — threat of
 * arrest to freeze a victim into compliance — gets its own high-weight rule.
 */

const AUTHORITY_TERMS: readonly RegExp[] = [
  /\brbi\b/giu,
  /reserve\s?bank/giu,
  /\btrai\b/giu,
  /\bcbi\b/giu,
  /\bpolice\b/giu,
  /cyber\s?(?:cell|crime|police)/giu,
  /income\s?tax/giu,
  /\bepfo?\b/giu,
  /\bkyc\b\s?(?:department|dept|team|verification)/giu,
  /\bkyc\s?વિભાગ/giu,
  /electricity\s?(?:board|department)/giu,
  /(?:fedex|dhl|blue\s?dart|courier)\b/giu,
  /custom(?:s)?\s?department/giu,
  /officer|अधिकारी|અધિકારી/giu,
  /આવકવેરા\s?વિભાગ/gu,
  /आयकर\s?विभाग/gu,
  /પોલીસ/gu,
  /पुलिस/gu,
  /વિભાગમાંથી/gu,
  /વિભાગમાં/gu,
  /विभाग\s?से/gu,
];

const DIGITAL_ARREST_TERMS: readonly RegExp[] = [
  /digital\s?arrest/giu,
  /under\s?arrest/giu,
  /arrest\s?warrant/giu,
  /non[\s-]?bailable/giu,
  /\bnarcotics?\b/giu,
  /(?:illegal\s?)?drugs?\b/giu,
  /money\s?laundering/giu,
  /parcel\s?(?:contains|seized|held)/giu,
  /ધરપકડ/gu,
  /વોરંટ/gu,
  /गिरफ्तार/gu,
  /गिरफ़्तारी/gu,
  /वारंट/gu,
];

/**
 * A personal 10-digit Indian mobile number (starts 6–9). Genuine bank alerts
 * come from short alphanumeric sender IDs, never a personal mobile — so a
 * bank/authority claim plus a personal number is a mismatch tell.
 */
const PERSONAL_MOBILE = /\b[6-9]\d{9}\b/gu;

const BANK_CLAIM = /\b(?:sbi|icici|hdfc|axis|pnb|kotak|bank|બેંક|बैंक|rbi)\b/iu;

const senderIdMismatch: Rule = {
  id: "impersonation.sender-id-mismatch",
  category: "impersonation",
  weight: 40,
  reasonKey: "reasons.impersonation.senderIdMismatch",
  detect: (ctx: RuleContext) => {
    if (!BANK_CLAIM.test(ctx.raw)) return [];
    // Amounts like "9876543210" are rare; a 10-digit 6–9 starter in a
    // bank-claiming message is almost always a callback number.
    return findAll(PERSONAL_MOBILE, ctx.raw);
  },
};

const authorityClaim: Rule = {
  id: "impersonation.authority-claim",
  category: "impersonation",
  weight: 40,
  reasonKey: "reasons.impersonation.authorityClaim",
  detect: (ctx: RuleContext) => {
    // Require a first-person/"from" framing so plain mentions ("I paid income
    // tax") do not trip it.
    const hasFraming = firstIn(
      [
        /\b(?:this is|we are|calling from|on behalf of|from the?)\b/giu,
        /માંથી\s?બોલ/gu,
        /માંથી\s?વાત/gu,
        /से\s?बात/gu,
        /से\s?बोल/gu,
      ],
      ctx.raw,
    );
    if (!hasFraming) return [];
    return AUTHORITY_TERMS.flatMap((p) => findAll(p, ctx.raw));
  },
};

export const impersonationRules: readonly Rule[] = [
  authorityClaim,
  lexiconRule({
    id: "impersonation.digital-arrest",
    category: "impersonation",
    weight: 70,
    reasonKey: "reasons.impersonation.digitalArrest",
    patterns: DIGITAL_ARREST_TERMS,
  }),
  senderIdMismatch,
];
