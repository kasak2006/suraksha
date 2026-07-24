import { describe, expect, test } from "vitest";
import { evaluateRules } from "@/lib/engine/rules";
import { fuse } from "@/lib/engine/calibration";

/*
 * Regression: an explicit OTP/PIN ask carries a hard DANGER override. Because
 * its raw rule score already reaches DANGER on its own, `overridden` is false —
 * so the override floor has to be surfaced separately (`overrideBand`) and fed
 * into fusion, or a noisy neural score could pull the verdict down out of
 * DANGER. This exact path shipped broken once (SBI "share the OTP" → Risky 74).
 */
describe("override floor survives fusion", () => {
  test("evaluateRules exposes the override floor even when it didn't move the band", () => {
    const e = evaluateRules("Share your OTP now to unblock your account");
    expect(e.band).toBe("danger");
    expect(e.overridden).toBe(false); // raw score already reached danger
    expect(e.overrideBand).toBe("danger"); // …but the floor is still recorded
  });

  test("a benign message has no override floor", () => {
    const e = evaluateRules("Let us meet for tea at 5pm tomorrow.");
    expect(e.overrideBand).toBeUndefined();
  });

  test("fusing a credential ask with a LOW neural score still lands DANGER", () => {
    const e = evaluateRules(
      "Dear customer, your SBI account will be blocked today. Share the OTP sent to your number.",
    );
    // Simulate the model disagreeing (low pScam) — the override must win.
    const r = fuse({ pScam: 0.05, ruleScore: 50, overrideBand: e.overrideBand });
    expect(r.band).toBe("danger");
    expect(r.score).toBeGreaterThanOrEqual(80);
  });
});
