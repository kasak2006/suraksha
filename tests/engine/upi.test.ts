import { describe, expect, test } from "vitest";
import { evaluateRules } from "@/lib/engine/rules";

const fired = (text: string) =>
  evaluateRules(text).matches.map((m) => m.ruleId);

describe("upi.collect-to-receive — you never enter a PIN to receive money", () => {
  test("English enter-PIN-to-receive is danger with a hard override", () => {
    const r = evaluateRules(
      "To receive your ₹5000 cashback, open the app and enter your UPI PIN",
    );
    expect(r.matches.map((m) => m.ruleId)).toContain("upi.collect-to-receive");
    expect(r.band).toBe("danger");
  });

  test("Gujarati PIN-to-receive fires", () => {
    expect(fired("પૈસા મેળવવા માટે પિન નાખો")).toContain(
      "upi.collect-to-receive",
    );
  });

  test("Hindi approve-request-to-receive fires", () => {
    expect(fired("पैसे पाने के लिए रिक्वेस्ट स्वीकार करें और पिन डालें")).toContain(
      "upi.collect-to-receive",
    );
  });

  test("genuine UPI credit alert stays safe", () => {
    const r = evaluateRules(
      "Rs 500 credited to your account via UPI from Ramesh Patel",
    );
    expect(r.matches.map((m) => m.ruleId)).not.toContain(
      "upi.collect-to-receive",
    );
    expect(r.band).toBe("safe");
  });

  test("courier pin-code message does not trip the PIN rule", () => {
    expect(
      fired("Share your area pin code to receive the parcel delivery"),
    ).not.toContain("upi.collect-to-receive");
  });
});

describe("upi.qr-receive", () => {
  test("scan-QR-to-receive fires", () => {
    expect(fired("Scan this QR code to receive your prize money")).toContain(
      "upi.qr-receive",
    );
  });

  test("Hindi scan-QR-to-receive fires", () => {
    expect(fired("पैसे प्राप्त करने के लिए यह क्यूआर कोड स्कैन करें")).toContain(
      "upi.qr-receive",
    );
  });
});

describe("upi.wrong-transfer-return", () => {
  test("sent-by-mistake-please-return fires", () => {
    expect(
      fired("I sent ₹2000 to your account by mistake, please return it"),
    ).toContain("upi.wrong-transfer-return");
  });

  test("Gujarati wrong-transfer fires", () => {
    expect(fired("ભૂલથી તમારા ખાતામાં પૈસા મોકલાઈ ગયા છે, પરત કરો")).toContain(
      "upi.wrong-transfer-return",
    );
  });
});

describe("upi.refund-bait", () => {
  test("unsolicited refund offer fires", () => {
    expect(fired("Claim your electricity bill refund now")).toContain(
      "upi.refund-bait",
    );
  });

  test("Hindi cashback bait fires", () => {
    expect(fired("आपका कैशबैक जारी हुआ है, अभी क्लेम करें")).toContain(
      "upi.refund-bait",
    );
  });
});

describe("upi.unusual-vpa", () => {
  test("unknown PSP suffix fires", () => {
    expect(fired("Pay to winner2024@zzpay to claim")).toContain(
      "upi.unusual-vpa",
    );
  });

  test("well-known PSP suffix does not fire", () => {
    expect(fired("Pay the shop at ramesh.kirana@okaxis")).not.toContain(
      "upi.unusual-vpa",
    );
  });

  test("email addresses are not mistaken for VPAs", () => {
    expect(fired("Contact us at support@gmail.com for help")).not.toContain(
      "upi.unusual-vpa",
    );
  });
});
