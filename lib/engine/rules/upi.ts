import type { EvidenceSpan, Rule } from "../types";
import { findAll, lexiconRule, proximityRule } from "./helpers";

/*
 * §4.2 "UPI-specific" — headlined by the collect-request trap. The invariant
 * we teach everywhere: entering your UPI PIN only ever sends money OUT, and
 * receiving money never needs a PIN, an approval, or a QR scan.
 */

/** Claims that money is coming TO the user. */
const RECEIVE_TERMS: readonly RegExp[] = [
  /receiv\w*/giu,
  /credit\w*/giu,
  /cashback/giu,
  /refund/giu,
  /મેળવ/gu,
  /મળશે/gu,
  /પ્રાપ્ત/gu,
  /પૈસા\s?મળ/gu,
  /मिलेग[ाे]/gu,
  /मिलेंगे/gu,
  /पाने/gu,
  /प्राप्त/gu,
  /रिफंड/gu,
  /कैशबैक/gu,
  /રિફંડ/gu,
  /કેશબેક/gu,
];

/**
 * PIN-entry / approval actions. Deliberately never a bare "pin" — postal
 * "pin code" appears in genuine courier messages.
 */
const PIN_OR_APPROVE_ACTIONS: readonly RegExp[] = [
  /(?:upi|atm)[\s-]?pin/giu,
  /\bm-?pin\b/giu,
  /enter\s+(?:your\s+)?pin\b(?!\s?code)/giu,
  /pin\s+(?:dal|nakh|enter)\w*/giu,
  /પિન\s?નાખ/gu,
  /પિન\s?દાખલ/gu,
  /पिन\s?डाल/gu,
  /पिन\s?दर्ज/gu,
  /\bapprove\b/giu,
  /\baccept\b/giu,
  /સ્વીકાર/gu,
  /स्वीकार/gu,
  /મંજૂર/gu,
  /मंजूर/gu,
  /collect\s?request/giu,
  /payment\s?request/giu,
  /રિક્વેસ્ટ/gu,
  /रिक्वेस्ट/gu,
];

const QR_TERMS: readonly RegExp[] = [
  /\bqr\s?(?:code)?\b/giu,
  /ક્યુઆર\s?(?:કોડ)?/gu,
  /क्यूआर\s?(?:कोड)?/gu,
];

const MISTAKE_TERMS: readonly RegExp[] = [
  /by\s+mistake/giu,
  /wrongly/giu,
  /\bgalti\s?se\b/giu,
  /ભૂલથી/gu,
  /गलती\s?से/gu,
];

const RETURN_TERMS: readonly RegExp[] = [
  /return/giu,
  /send\s+(?:it\s+)?back/giu,
  /\bsent\b/giu,
  /transfer/giu,
  /પરત/gu,
  /પાછા/gu,
  /મોકલ/gu,
  /वापस/gu,
  /लौटा/gu,
  /भेज/gu,
];

/** PSP handle suffixes in live use by major banks/apps (verify before shipping UI copy). */
const KNOWN_PSP_SUFFIXES: ReadonlySet<string> = new Set([
  "okaxis", "oksbi", "okhdfcbank", "okicici", "okbizaxis",
  "ybl", "ibl", "axl", "apl", "yapl",
  "ptyes", "ptaxis", "pthdfc", "ptsbi", "paytm",
  "upi", "sbi", "barodampay", "boi", "cnrb", "fbl", "federal",
  "hdfcbank", "icici", "idbi", "idfcbank", "indus", "jio", "kotak",
  "mahb", "naviaxis", "niyoicici", "pnb", "pockets", "rbl", "sib",
  "sliceaxis", "tapicici", "uco", "unionbank",
  "waaxis", "waicici", "wahdfcbank", "wasbi",
  "yesbank", "airtel", "freecharge", "mobikwik", "amazonpay", "apay",
  "axisb", "dbs", "kmbl", "kphdfc", "rapl", "sc", "tmb", "utbi",
]);

/**
 * VPA-shaped tokens. The trailing lookahead rejects email addresses
 * (suffix followed by ".tld").
 */
const VPA_PATTERN = /\b[a-z0-9][a-z0-9._-]{1,49}@([a-z][a-z0-9]{1,19})\b(?!\.[a-z])/gi;

const unusualVpa: Rule = {
  id: "upi.unusual-vpa",
  category: "upi",
  weight: 20,
  reasonKey: "reasons.upi.unusualVpa",
  detect: (ctx) => {
    const spans: EvidenceSpan[] = [];
    for (const span of findAll(VPA_PATTERN, ctx.raw)) {
      const atIndex = span.text.lastIndexOf("@");
      if (atIndex === -1) continue;
      const suffix = span.text.slice(atIndex + 1).toLowerCase();
      if (!KNOWN_PSP_SUFFIXES.has(suffix)) spans.push(span);
    }
    return spans;
  },
};

export const upiRules: readonly Rule[] = [
  proximityRule({
    id: "upi.collect-to-receive",
    category: "upi",
    weight: 85,
    reasonKey: "reasons.upi.collectToReceive",
    override: "danger",
    anchor: RECEIVE_TERMS,
    near: PIN_OR_APPROVE_ACTIONS,
    window: 80,
  }),
  proximityRule({
    id: "upi.qr-receive",
    category: "upi",
    weight: 80,
    reasonKey: "reasons.upi.qrReceive",
    anchor: QR_TERMS,
    near: RECEIVE_TERMS,
    window: 60,
  }),
  proximityRule({
    id: "upi.wrong-transfer-return",
    category: "upi",
    weight: 50,
    reasonKey: "reasons.upi.wrongTransferReturn",
    anchor: MISTAKE_TERMS,
    near: RETURN_TERMS,
    window: 60,
  }),
  lexiconRule({
    id: "upi.refund-bait",
    category: "upi",
    weight: 40,
    reasonKey: "reasons.upi.refundBait",
    patterns: [
      /refund/giu,
      /cashback/giu,
      /रिफंड/gu,
      /कैशबैक/gu,
      /રિફંડ/gu,
      /કેશબેક/gu,
    ],
  }),
  unusualVpa,
];
