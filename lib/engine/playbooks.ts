import { ARCHETYPE_IDS, type ArchetypeId } from "./archetypes";

/*
 * Guided response playbooks (spec §5.5). Per-archetype, sequenced steps in three
 * buckets. Steps are i18n keys under `playbook.steps.*`, so a small shared
 * library of ~19 step strings covers all 16 archetypes without duplicating
 * translations. Helpline facts (1930, cybercrime.gov.in) are verified and cited
 * in docs/PLAYBOOK-SOURCES.md (honest-engineering §9.7).
 */

export interface Playbook {
  rightNow: readonly string[];
  next10Min: readonly string[];
  ifMoneyGone: readonly string[];
}

// Shared once the immediate danger is handled — the same for every archetype.
const NEXT_10_MIN = [
  "callBankOfficial",
  "freezeCard",
  "changePin",
  "checkStatement",
] as const;

const IF_MONEY_GONE = [
  "call1930",
  "goldenHour",
  "fileComplaint",
  "informBank",
] as const;

// Archetype-specific "right now" steps lead with the myth-busting truth for
// that scam, then the generic protective actions.
const RIGHT_NOW: Record<ArchetypeId, readonly string[]> = {
  "kyc-expiry": ["dontClick", "doNotShare", "breatheVerify"],
  "upi-collect": ["pinInvariant", "doNotPay", "breatheVerify"],
  "refund-reversal": ["refundTruth", "doNotPay", "breatheVerify"],
  "digital-arrest": ["digitalArrestTruth", "hangUp", "doNotPay"],
  "courier-parcel": ["hangUp", "doNotPay", "breatheVerify"],
  "electricity-bill": ["dontClick", "hangUp", "breatheVerify"],
  "army-officer": ["pinInvariant", "doNotPay", "breatheVerify"],
  "loan-advance-fee": ["loanTruth", "doNotPay", "breatheVerify"],
  "job-task": ["doNotPay", "doNotShare", "breatheVerify"],
  "lottery-prize": ["lotteryTruth", "doNotPay", "doNotShare"],
  "sim-swap": ["doNotShare", "dontClick", "breatheVerify"],
  "card-upgrade": ["doNotShare", "doNotInstall", "breatheVerify"],
  "investment-trading": ["doNotPay", "breatheVerify", "doNotShare"],
  "qr-receive": ["pinInvariant", "doNotPay", "breatheVerify"],
  "phishing-link": ["dontClick", "doNotShare", "breatheVerify"],
  other: ["breatheVerify", "doNotShare", "doNotPay"],
};

export function getPlaybook(id: ArchetypeId): Playbook {
  return {
    rightNow: RIGHT_NOW[id],
    next10Min: NEXT_10_MIN,
    ifMoneyGone: IF_MONEY_GONE,
  };
}

/** Type guard for a route param. */
export function isArchetypeId(value: string): value is ArchetypeId {
  return (ARCHETYPE_IDS as readonly string[]).includes(value);
}
