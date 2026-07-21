import type { Rule } from "../types";
import { lexiconRule, proximityRule } from "./helpers";

/*
 * §4.2 "Loan-scam specific". Real lenders deduct fees from disbursal and never
 * demand money up front; "guaranteed / no-documents / instant" loans and vague
 * "RBI approved" claims without a named NBFC are the tells.
 */

const LOAN_TERMS: readonly RegExp[] = [
  /\bloan\b/giu,
  /\bcredit\b/giu,
  /લોન/gu,
  /ધિરાણ/gu,
  /लोन/gu,
  /कर्ज़?/gu,
  /ऋण/gu,
];

const ADVANCE_FEE_TERMS: readonly RegExp[] = [
  /processing\s?fee/giu,
  /\bgst\b/giu,
  /insurance\s?(?:fee|charge)/giu,
  /file\s?charge/giu,
  /registration\s?(?:fee|charge)/giu,
  /advance\s?(?:fee|payment|amount)/giu,
  /security\s?deposit/giu,
  /પ્રોસેસિંગ\s?ફી/gu,
  /પ્રોસેસિંગ\s?ચાર્જ/gu,
  /ફી\s?ભરો/gu,
  /प्रोसेसिंग\s?फ़?ीस/gu,
  /प्रोसेसिंग\s?शुल्क/gu,
  /फ़?ीस\s?भर/gu,
];

const TOO_EASY_TERMS: readonly RegExp[] = [
  /no\s+documents?/giu,
  /without\s+documents?/giu,
  /instant\s+approval/giu,
  /guaranteed\s+loan/giu,
  /guaranteed\s+approval/giu,
  /no\s+cibil/giu,
  /credit\s+score\s+not\s+required/giu,
  /બિના\s?દસ્તાવેજ/gu,
  /ડોક્યુમેન્ટ\s?વગર/gu,
  /દસ્તાવેજ\s?વગર/gu,
  /તરત\s?મંજૂર/gu,
  /બાંયધરી\s?લોન/gu,
  /बिना\s?दस्तावेज़?/gu,
  /बिना\s?कागज़?/gu,
  /तुरंत\s?मंज़?ूर/gu,
  /गारंटीड\s?लोन/gu,
];

const RBI_CLAIM_TERMS: readonly RegExp[] = [
  /rbi\s+approved/giu,
  /rbi[\s-]?(?:registered|certified|authoris?ed)/giu,
  /approved\s+by\s+rbi/giu,
  /આરબીઆઈ\s?(?:માન્ય|મંજૂર|દ્વારા)/gu,
  /आरबीआई\s?(?:अनुमोदित|मान्यता|द्वारा|से\s?मान्यता)/gu,
  /रिज़र्व\s?बैंक\s?(?:द्वारा|से)/gu,
];

export const loanRules: readonly Rule[] = [
  proximityRule({
    id: "loan.advance-fee",
    category: "loan",
    weight: 65,
    reasonKey: "reasons.loan.advanceFee",
    anchor: LOAN_TERMS,
    near: ADVANCE_FEE_TERMS,
    window: 120,
  }),
  lexiconRule({
    id: "loan.too-easy",
    category: "loan",
    weight: 45,
    reasonKey: "reasons.loan.tooEasy",
    patterns: TOO_EASY_TERMS,
  }),
  lexiconRule({
    id: "loan.rbi-claim",
    category: "loan",
    weight: 40,
    reasonKey: "reasons.loan.rbiClaim",
    patterns: RBI_CLAIM_TERMS,
  }),
];
