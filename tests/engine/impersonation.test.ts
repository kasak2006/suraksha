import { describe, expect, test } from "vitest";
import { evaluateRules } from "@/lib/engine/rules";

const fired = (text: string) =>
  evaluateRules(text).matches.map((m) => m.ruleId);

describe("impersonation.authority-claim", () => {
  test("claims to be from the bank / RBI / police fires", () => {
    expect(fired("This is an officer from the CBI cyber cell")).toContain(
      "impersonation.authority-claim",
    );
  });

  test("Hindi income-tax department claim fires", () => {
    expect(fired("हम आयकर विभाग से बात कर रहे हैं")).toContain(
      "impersonation.authority-claim",
    );
  });

  test("Gujarati KYC-department claim fires", () => {
    expect(fired("અમે બેંકના કેવાયસી વિભાગમાંથી બોલીએ છીએ")).toContain(
      "impersonation.authority-claim",
    );
  });
});

describe("impersonation.digital-arrest", () => {
  test("parcel-with-drugs / arrest framing fires", () => {
    expect(
      fired("Your parcel contains illegal drugs. You are under digital arrest."),
    ).toContain("impersonation.digital-arrest");
  });

  test("Hindi arrest-warrant framing fires", () => {
    expect(fired("आपके नाम गिरफ्तारी वारंट जारी हुआ है")).toContain(
      "impersonation.digital-arrest",
    );
  });
});

describe("impersonation.sender-id-mismatch", () => {
  test("bank claim arriving with a personal 10-digit number fires", () => {
    expect(
      fired("SBI: your account is blocked. Call 9876543210 immediately."),
    ).toContain("impersonation.sender-id-mismatch");
  });

  test("bank message without a personal number does not fire", () => {
    expect(
      fired("SBI: Rs 500 debited for UPI payment to a merchant."),
    ).not.toContain("impersonation.sender-id-mismatch");
  });
});
