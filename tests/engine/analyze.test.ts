import { describe, expect, test } from "vitest";
import { analyze } from "@/lib/engine";

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
});
