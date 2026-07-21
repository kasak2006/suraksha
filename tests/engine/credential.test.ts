import { describe, expect, test } from "vitest";
import { evaluateRules } from "@/lib/engine/rules";

const fired = (text: string) =>
  evaluateRules(text).matches.map((m) => m.ruleId);

describe("credential.secret-ask", () => {
  test("English OTP ask is danger with a hard override", () => {
    const r = evaluateRules(
      "Your SBI account will be suspended. Share your OTP immediately to verify.",
    );
    expect(r.matches.map((m) => m.ruleId)).toContain("credential.secret-ask");
    expect(r.band).toBe("danger");
  });

  test("Gujarati OTP ask fires", () => {
    expect(fired("બેંક ખાતું ચાલુ રાખવા તમારો ઓટીપી અમને મોકલો")).toContain(
      "credential.secret-ask",
    );
  });

  test("Hindi PIN ask fires", () => {
    expect(fired("खाता चालू रखने के लिए अपना ओटीपी हमें भेजें")).toContain(
      "credential.secret-ask",
    );
  });

  test("genuine English OTP delivery with do-not-share warning stays safe", () => {
    const r = evaluateRules(
      "482913 is your OTP for login. Do not share it with anyone.",
    );
    expect(r.matches.map((m) => m.ruleId)).not.toContain(
      "credential.secret-ask",
    );
    expect(r.band).toBe("safe");
  });

  test("genuine Hindi OTP delivery stays safe", () => {
    const r = evaluateRules("आपका ओटीपी 4829 है। इसे किसी को न बताएं।");
    expect(r.matches.map((m) => m.ruleId)).not.toContain(
      "credential.secret-ask",
    );
    expect(r.band).toBe("safe");
  });

  test("plain OTP delivery without any ask verb does not fire", () => {
    expect(fired("Your OTP is 482913 for txn of Rs 500")).not.toContain(
      "credential.secret-ask",
    );
  });
});

describe("credential.remote-access", () => {
  test("AnyDesk mention fires", () => {
    expect(fired("Install AnyDesk app for refund help")).toContain(
      "credential.remote-access",
    );
  });

  test("Hindi screen-share instruction fires", () => {
    expect(fired("रिफंड के लिए स्क्रीन शेयर करें")).toContain(
      "credential.remote-access",
    );
  });
});

describe("credential.install-app", () => {
  test("install-this-app instruction fires", () => {
    expect(fired("Please install this app to update your KYC")).toContain(
      "credential.install-app",
    );
  });

  test("Gujarati app-install instruction fires", () => {
    expect(fired("કેવાયસી માટે આ એપ ઇન્સ્ટોલ કરો")).toContain(
      "credential.install-app",
    );
  });
});
