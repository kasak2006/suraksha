import type { Rule } from "../types";
import { lexiconRule, proximityRule } from "./helpers";

/*
 * §4.2 "Credential / access asks" — the highest-value group. An explicit
 * OTP/PIN/password request carries a hard DANGER override (§4.4): no bank,
 * wallet or official ever asks for these.
 */

/** OTP / PIN / CVV / password tokens across scripts. */
const SECRET_TERMS: readonly RegExp[] = [
  /\bOTP\b/giu,
  /one[\s-]?time\s+password/giu,
  /\bCVV\b/giu,
  /\bM-?PIN\b/giu,
  /\b(?:UPI|ATM)[\s-]?PIN\b/giu,
  /\bPIN\b/giu,
  /password/giu,
  /verification code/giu,
  /ઓ\.?ટી\.?પી\.?/gu,
  /પિન/gu,
  /પાસવર્ડ/gu,
  /ओ\.?टी\.?पी\.?/gu,
  /पिन/gu,
  /पासवर्ड/gu,
];

/** Verbs that turn a secret mention into a request for it. */
const ASK_VERBS: readonly RegExp[] = [
  /\b(?:share|send|tell|give|provide|enter|type|submit|confirm|verify)\b/giu,
  /\bbata\w*\b/giu,
  /\bbhej\w*\b/giu,
  /મોકલ/gu,
  /આપો/gu,
  /જણાવ/gu,
  /નાખો/gu,
  /લખો/gu,
  /બતાવ/gu,
  /भेज/gu,
  /बता/gu,
  /डाल/gu,
  /दर्ज/gu,
  /(?:^|\s)दें(?=[\s।,!?]|$)/gu,
  /(?:^|\s)दो(?=[\s।,!?]|$)/gu,
];

/**
 * Negations — genuine bank messages warn "do NOT share your OTP". A secret
 * term whose window carries a negation is the bank's own safety warning,
 * not an ask.
 */
const NEGATIONS: readonly RegExp[] = [
  /\bdo\s*not\b/giu,
  /\bdon'?t\b/giu,
  /\bnever\b/giu,
  /\bmat\s+(?:bata|bhej|de)\w*\b/giu,
  /\bkabhi\s+(?:na|nahi|mat)\b/giu,
  /ન\s?આપ/gu,
  /ના\s?આપ/gu,
  /આપશો\s?નહીં/gu,
  /કહેશો\s?નહીં/gu,
  /ક્યારેય/gu,
  /મત/gu,
  // NOTE: \b is ASCII-only in JS and never matches around Indic characters —
  // standalone Devanagari tokens need explicit whitespace/danda boundaries.
  /(?:^|\s)मत(?=[\s।,!?]|$)/gu,
  /(?:^|\s)न(?=[\s।,!?]|$)/gu,
  /(?:^|\s)नहीं(?=[\s।,!?]|$)/gu,
  /कभी/gu,
];

export const credentialRules: readonly Rule[] = [
  proximityRule({
    id: "credential.secret-ask",
    category: "credential",
    weight: 85,
    reasonKey: "reasons.credential.secretAsk",
    override: "danger",
    anchor: SECRET_TERMS,
    near: ASK_VERBS,
    unless: NEGATIONS,
    window: 60,
  }),
  lexiconRule({
    id: "credential.remote-access",
    category: "credential",
    weight: 80,
    reasonKey: "reasons.credential.remoteAccess",
    patterns: [
      /\bany\s?desk\b/giu,
      /\bteam\s?viewer\b/giu,
      /\bquick\s?support\b/giu,
      /\brust\s?desk\b/giu,
      /\bair\s?droid\b/giu,
      /screen\s?shar(?:e|ing)/giu,
      /સ્ક્રીન\s?શેર/gu,
      /स्क्रीन\s?शेयर/gu,
    ],
  }),
  lexiconRule({
    id: "credential.install-app",
    category: "credential",
    weight: 50,
    reasonKey: "reasons.credential.installApp",
    patterns: [
      /install\s+(?:this|the|our)\s+app/giu,
      /\bapp\s+install\s+kar\w*/giu,
      /enable\s+accessibility/giu,
      /allow\s+screen\s+shar/giu,
      /એપ\s?(?:લિકેશન)?\s?ઇન્સ્ટોલ/gu,
      /ઍપ\s?ઇન્સ્ટોલ/gu,
      /ऐप\s?इंस्टॉल/gu,
      /एप्लिकेशन\s?इंस्टॉल/gu,
    ],
  }),
];
