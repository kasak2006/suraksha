import { describe, expect, test } from "vitest";
import { evaluateRules } from "@/lib/engine/rules";
import { scoreTactics, TACTIC_AXES } from "@/lib/engine/tactics";

/** Convenience: score with rule corroboration, as the engine does. */
function tactics(text: string) {
  return scoreTactics(text, evaluateRules(text));
}

function argmax(scores: Record<string, number>): string {
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

describe("scoreTactics — the 8-axis manipulation scorer", () => {
  test("digital-arrest lights up fear + authority + secrecy", () => {
    const { scores } = tactics(
      "This is CBI officer speaking. A parcel in your name contains illegal items. You are under digital arrest. Do not tell anyone including family until verification is complete.",
    );
    expect(scores.fear).toBeGreaterThanOrEqual(60);
    expect(scores.authority).toBeGreaterThanOrEqual(60);
    expect(scores.secrecy).toBeGreaterThanOrEqual(60);
  });

  test("an OTP ask peaks on credential", () => {
    const { scores } = tactics("Share your OTP now to unblock your account");
    expect(argmax(scores)).toBe("credential");
    expect(scores.credential).toBeGreaterThanOrEqual(60);
  });

  test("a deadline threat scores urgency high", () => {
    const { scores } = tactics(
      "Your account will be blocked within 24 hours. Act immediately.",
    );
    expect(scores.urgency).toBeGreaterThanOrEqual(60);
  });

  test("KBC prize bait scores reward high", () => {
    const { scores } = tactics(
      "Congratulations! You have won Rs 25,00,000 in the KBC lucky draw.",
    );
    expect(scores.reward).toBeGreaterThanOrEqual(60);
  });

  test("a wrong-transfer refund scam shows trust + irreversibility", () => {
    const { scores } = tactics(
      "I sent Rs 5000 to your UPI by mistake. Please approve the request and return the money. I am a poor man please help.",
    );
    expect(scores.trust).toBeGreaterThanOrEqual(40);
    expect(scores.irreversibility).toBeGreaterThanOrEqual(40);
  });

  test("peak equals the maximum axis score", () => {
    const r = tactics("Share your OTP now to unblock your account");
    const max = Math.max(...TACTIC_AXES.map((a) => r.scores[a]));
    expect(r.peak).toBe(max);
  });

  test("a benign message stays low on every axis", () => {
    const { scores, peak } = tactics("Let us meet for tea at 5 pm tomorrow.");
    expect(peak).toBeLessThan(40);
    for (const axis of TACTIC_AXES) {
      expect(scores[axis]).toBeLessThan(40);
    }
  });

  test("works without a rule evaluation (lexicon-only)", () => {
    const { scores } = scoreTactics("Share your OTP immediately");
    expect(scores.credential).toBeGreaterThan(0);
    expect(scores.urgency).toBeGreaterThan(0);
  });
});
