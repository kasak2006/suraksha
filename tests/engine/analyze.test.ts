import { describe, expect, test } from "vitest";
import { analyze, analyzeWithModel } from "@/lib/engine";

describe("analyze — public API", () => {
  test("returns a danger verdict with reasons and highlighted segments", () => {
    const r = analyze("Share your OTP now to unblock your account");
    expect(r.band).toBe("danger");
    expect(r.reasons.length).toBeGreaterThan(0);
    expect(r.reasons[0]?.reasonKey).toBeDefined();
    // Reassembling the segments reproduces the original text exactly.
    expect(r.segments.map((s) => s.text).join("")).toBe(
      "Share your OTP now to unblock your account",
    );
    expect(r.segments.some((s) => s.highlighted)).toBe(true);
  });

  test("reasons are ordered strongest-first", () => {
    const r = analyze(
      "URGENT! Share your OTP and install AnyDesk within 24 hours",
    );
    const ids = r.reasons.map((x) => x.ruleId);
    expect(ids[0]).toBe("credential.secret-ask");
  });

  test("a benign message is safe with no highlights", () => {
    const r = analyze("Let us meet for tea at 5pm tomorrow.");
    expect(r.band).toBe("safe");
    expect(r.reasons).toHaveLength(0);
    expect(r.segments.every((s) => !s.highlighted)).toBe(true);
  });

  test("empty input is safe and produces no segments", () => {
    const r = analyze("");
    expect(r.band).toBe("safe");
    expect(r.segments).toHaveLength(0);
  });

  test("synchronous analyze reports a model state and no pScam", () => {
    const r = analyze("Let us meet for tea at 5pm tomorrow.");
    expect(["unloaded", "loading", "ready", "failed"]).toContain(r.modelState);
    expect(r.pScam).toBeUndefined();
  });

  test("repeated analyses of the same text are identical (no leaked regex state)", () => {
    const text = "Share your OTP now to unblock your account";
    const first = analyze(text);
    const second = analyze(text);
    const third = analyze(text);
    expect(first.band).toBe("danger");
    expect(second.band).toBe("danger");
    expect(third.band).toBe("danger");
    expect(second.score).toBe(first.score);
    expect(third.score).toBe(first.score);
  });

  test("carries tactic scores and an archetype for a scam", () => {
    const r = analyze(
      "Dear customer, your SBI account will be blocked today as KYC is expired. Share the OTP.",
    );
    expect(r.tactics).toBeDefined();
    expect(r.tacticPeak).toBeGreaterThan(0);
    expect(r.archetype?.id).toBe("kyc-expiry");
    // The tactic peak equals the strongest axis.
    const max = Math.max(...Object.values(r.tactics ?? {}));
    expect(r.tacticPeak).toBe(max);
  });

  test("a benign message has low tactics and no archetype", () => {
    const r = analyze("Let us meet for tea at 5 pm tomorrow.");
    expect(r.tacticPeak).toBeLessThan(40);
    expect(r.archetype).toBeNull();
  });
});

describe("analyzeWithModel — degrades to rules-only when the model is absent", () => {
  test("returns the rules verdict with modelState 'failed' and no pScam", async () => {
    const text = "Share your OTP now to unblock your account";
    const rulesOnly = analyze(text);
    const withModel = await analyzeWithModel(text);

    // No /models/classifier-head.json in the test env → rules-only fallback.
    expect(withModel.modelState).toBe("failed");
    expect(withModel.pScam).toBeUndefined();
    // The verdict is exactly the deterministic one, untouched by fusion.
    expect(withModel.band).toBe(rulesOnly.band);
    expect(withModel.score).toBe(rulesOnly.score);
    expect(withModel.reasons.map((r) => r.ruleId)).toEqual(
      rulesOnly.reasons.map((r) => r.ruleId),
    );
    expect(withModel.segments.map((s) => s.text).join("")).toBe(text);
  });
});
