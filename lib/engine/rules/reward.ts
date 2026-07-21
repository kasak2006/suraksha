import type { Rule } from "../types";
import { lexiconRule, proximityRule } from "./helpers";

/*
 * §4.2 "Reward bait". Lottery/prize, job-with-upfront-payment and
 * guaranteed-return investment offers. The common thread: an unearned windfall
 * that requires you to pay or share something first.
 */

const PRIZE_TERMS: readonly RegExp[] = [
  /lotter/giu,
  /\bkbc\b/giu,
  /kaun\s?banega/giu,
  /lucky\s?draw/giu,
  /\bprize\b/giu,
  /you\s?(?:have\s?)?won/giu,
  /\bjackpot\b/giu,
  /free\s?(?:gift|gas\s?cylinder|recharge)/giu,
  /લોટરી/gu,
  /લકી\s?ડ્રો/gu,
  /ઇનામ/gu,
  /જીત્યા/gu,
  /लॉटरी/gu,
  /लकी\s?ड्रॉ/gu,
  /इनाम/gu,
  /इनाम\s?निकला/gu,
  /जीत\w*/gu,
];

const CONGRATS_TERMS: readonly RegExp[] = [
  /congratulations?/giu,
  /અભિનંદન/gu,
  /બધાઈ/gu,
  /बधाई/gu,
  /मुबारक/gu,
];

const JOB_TERMS: readonly RegExp[] = [
  /work\s?from\s?home/giu,
  /part[\s-]?time\s?job/giu,
  /earn\s?(?:₹|rs\.?|rupees)?\s?[\d,]+\s?(?:daily|per\s?day|a\s?day|weekly)/giu,
  /घर\s?बैठे\s?(?:रोज़?\s?)?कमा/gu,
  /घर\s?से\s?कमा/gu,
  /ઘરે\s?બેઠા\s?કમા/gu,
  /પાર્ટ\s?ટાઈમ/gu,
];

const UPFRONT_TERMS: readonly RegExp[] = [
  // Anchored on a job term already, so a bare "registration" nearby is enough.
  /registration/giu,
  /joining\s?fee/giu,
  /pay\s?(?:₹|rs\.?|rupees)?\s?[\d,]+/giu,
  /(?:deposit|pay)\s?(?:first|to\s?start)/giu,
  /रजिस्ट्रेशन/gu,
  /पहले\s?(?:शुल्क|फ़?ीस|पैसे)\s?भर/gu,
  /રજિસ્ટ્રેશન/gu,
  /પહેલા\s?(?:ફી|પૈસા)\s?ભર/gu,
];

const INVESTMENT_TERMS: readonly RegExp[] = [
  /guaranteed\s?(?:profit|return)/giu,
  /double\s?your\s?money/giu,
  /sure\s?(?:profit|shot)/giu,
  /trading\s?(?:group|tips?)/giu,
  /fixed\s?daily\s?return/giu,
  /\bmultibagger\b/giu,
  /પાક્કો\s?નફો/gu,
  /ડબલ\s?પૈસા/gu,
  /ટ્રેડિંગ\s?ગ્રુપ/gu,
  /पक्का\s?(?:नफ़ा|मुनाफ़ा|लाभ)/gu,
  /पैसा\s?दोगुना/gu,
  /ट्रेडिंग\s?ग्रुप/gu,
];

export const rewardRules: readonly Rule[] = [
  proximityRule({
    id: "reward.lottery-prize",
    category: "reward",
    weight: 45,
    reasonKey: "reasons.reward.lotteryPrize",
    anchor: PRIZE_TERMS,
    near: [...CONGRATS_TERMS, ...PRIZE_TERMS],
    window: 200,
  }),
  proximityRule({
    id: "reward.job-upfront",
    category: "reward",
    weight: 50,
    reasonKey: "reasons.reward.jobUpfront",
    anchor: JOB_TERMS,
    near: UPFRONT_TERMS,
    window: 160,
  }),
  lexiconRule({
    id: "reward.investment",
    category: "reward",
    weight: 45,
    reasonKey: "reasons.reward.investment",
    patterns: INVESTMENT_TERMS,
  }),
];
