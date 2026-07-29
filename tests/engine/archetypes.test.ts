import { describe, expect, test } from "vitest";
import { matchArchetype } from "@/lib/engine/archetypes";
import { evaluateRules } from "@/lib/engine/rules";
import { scoreTactics } from "@/lib/engine/tactics";

function archetypeOf(text: string): string | null {
  const evaluation = evaluateRules(text);
  const { scores } = scoreTactics(text, evaluation);
  return matchArchetype(text, scores, evaluation)?.id ?? null;
}

describe("matchArchetype — maps scams to the 16 known frauds", () => {
  const cases: Array<[string, string]> = [
    [
      "Dear customer, your SBI account will be blocked today as KYC is expired. Update now http://sbi-kyc.verify-in.xyz",
      "kyc-expiry",
    ],
    [
      "This is CBI officer speaking. You are under digital arrest. Do not tell anyone including family.",
      "digital-arrest",
    ],
    [
      "You have a pending UPI collect request. Approve the request and enter your UPI PIN to receive your refund.",
      "upi-collect",
    ],
    [
      "I sent Rs 5000 to your UPI by mistake. Please return the money, I am a poor man.",
      "refund-reversal",
    ],
    [
      "Congratulations! You have won Rs 25,00,000 in the KBC lucky draw.",
      "lottery-prize",
    ],
    [
      "Customs has held your parcel due to prohibited contents. Pay clearance fee Rs 8500.",
      "courier-parcel",
    ],
    [
      "Pre-approved personal loan. No documents needed. Pay Rs 3999 processing fee. RBI approved lender.",
      "loan-advance-fee",
    ],
    [
      "Your SIM card will be deactivated in 24 hours. Re-verify to keep your number active.",
      "sim-swap",
    ],
    [
      "Scan this QR code to receive your refund of Rs 2400. Enter your UPI PIN to confirm.",
      "qr-receive",
    ],
    [
      "Guaranteed 3x returns. Join our trading group. Double your money in 30 days.",
      "investment-trading",
    ],
  ];

  for (const [text, expected] of cases) {
    test(`${expected}`, () => {
      expect(archetypeOf(text)).toBe(expected);
    });
  }

  test("a benign message has no archetype", () => {
    expect(archetypeOf("Let us meet for tea at 5 pm tomorrow.")).toBeNull();
  });
});
