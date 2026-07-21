import { describe, expect, test } from "vitest";
import { evaluateRules } from "@/lib/engine/rules";

const fired = (text: string) =>
  evaluateRules(text).matches.map((m) => m.ruleId);

describe("loan.advance-fee", () => {
  test("processing-fee-before-loan fires in English", () => {
    expect(
      fired("Your loan of ₹2 lakh is approved. Pay ₹1999 processing fee first"),
    ).toContain("loan.advance-fee");
  });

  test("Hindi advance-fee fires", () => {
    expect(fired("लोन पाने के लिए पहले प्रोसेसिंग फीस भेजें")).toContain(
      "loan.advance-fee",
    );
  });

  test("Gujarati advance-fee fires", () => {
    expect(fired("લોન મેળવવા પહેલા પ્રોસેસિંગ ફી મોકલો")).toContain(
      "loan.advance-fee",
    );
  });

  test("genuine EMI reminder stays safe", () => {
    const r = evaluateRules(
      "Dear customer, your loan EMI of Rs 4,500 is due on 05-08-2026.",
    );
    expect(r.matches.map((m) => m.ruleId)).not.toContain("loan.advance-fee");
    expect(r.band).toBe("safe");
  });
});

describe("loan.too-easy", () => {
  test("no-documents guaranteed loan fires", () => {
    expect(
      fired("Guaranteed loan approval! No documents needed, instant approval"),
    ).toContain("loan.too-easy");
  });

  test("Hindi no-documents loan fires", () => {
    expect(fired("बिना दस्तावेज तुरंत लोन मंजूर")).toContain("loan.too-easy");
  });

  test("Gujarati no-documents loan fires", () => {
    expect(fired("ડોક્યુમેન્ટ વગર તરત લોન મંજૂર")).toContain("loan.too-easy");
  });
});

describe("loan.rbi-claim", () => {
  test("RBI-approved claim fires", () => {
    expect(fired("We are RBI approved lender, 100% safe")).toContain(
      "loan.rbi-claim",
    );
  });

  test("Hindi RBI claim fires", () => {
    expect(fired("हमारी कंपनी आरबीआई से मान्यता प्राप्त है")).toContain(
      "loan.rbi-claim",
    );
  });
});
