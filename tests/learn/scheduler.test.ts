import { describe, expect, it } from "vitest";
import { drillDeck, type DrillCard } from "@/data/drills";
import {
  cardWeight,
  completeRound,
  emptyProgress,
  recordAnswer,
  selectRound,
} from "@/lib/learn/scheduler";

const loanCard = drillDeck.find((c) => c.id === "en-0004")!; // loan-advance-fee

/** Answer a card `n` times with the given correctness. */
function answerRepeatedly(card: DrillCard, correct: boolean, n: number) {
  let p = emptyProgress();
  for (let i = 0; i < n; i++) p = recordAnswer(p, card, correct);
  return p;
}

/** Deterministic RNG so the sampling test is reproducible. */
function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

describe("scheduler weighting", () => {
  it("weights a card up when its categories are answered wrong, down when right", () => {
    const neutral = cardWeight(loanCard, emptyProgress());
    const weak = cardWeight(loanCard, answerRepeatedly(loanCard, false, 5));
    const strong = cardWeight(loanCard, answerRepeatedly(loanCard, true, 5));

    expect(weak).toBeGreaterThan(neutral);
    expect(neutral).toBeGreaterThan(strong);
  });

  it("keeps every card reachable (nonzero base weight even when mastered)", () => {
    const strong = cardWeight(loanCard, answerRepeatedly(loanCard, true, 20));
    expect(strong).toBeGreaterThan(0);
  });
});

describe("recordAnswer", () => {
  it("tracks per-archetype accuracy, streak and a non-decreasing shield score", () => {
    let p = emptyProgress();
    p = recordAnswer(p, loanCard, true);
    p = recordAnswer(p, loanCard, true);

    expect(p.archetypes["loan-advance-fee"]).toEqual({ seen: 2, correct: 2 });
    expect(p.streak).toBe(2);
    expect(p.bestStreak).toBe(2);
    const afterStreak = p.shieldScore;

    p = recordAnswer(p, loanCard, false);
    expect(p.streak).toBe(0);
    expect(p.bestStreak).toBe(2); // best is remembered
    expect(p.shieldScore).toBe(afterStreak); // never goes down
  });

  it("tracks legit cards under the 'legit' pseudo-category", () => {
    const legitCard = drillDeck.find((c) => !c.isScam)!;
    const p = recordAnswer(emptyProgress(), legitCard, false);
    expect(p.archetypes["legit"]).toEqual({ seen: 1, correct: 0 });
  });

  it("is pure — the input progress is not mutated", () => {
    const p0 = emptyProgress();
    recordAnswer(p0, loanCard, true);
    expect(p0.shieldScore).toBe(0);
    expect(p0.archetypes).toEqual({});
  });
});

describe("selectRound", () => {
  it("returns the requested number of unique cards from the deck", () => {
    const round = selectRound(drillDeck, emptyProgress(), 10, seededRng(1));
    expect(round).toHaveLength(10);
    expect(new Set(round.map((c) => c.id)).size).toBe(10);
    for (const card of round) expect(drillDeck).toContain(card);
  });

  it("surfaces weak categories more often than mastered ones", () => {
    // User keeps failing loan-advance-fee, but aces kyc-expiry.
    let p = emptyProgress();
    const kycCard = drillDeck.find((c) => c.id === "en-0001")!;
    for (let i = 0; i < 8; i++) {
      p = recordAnswer(p, loanCard, false);
      p = recordAnswer(p, kycCard, true);
    }

    const rng = seededRng(42);
    let loanSeen = 0;
    let kycSeen = 0;
    for (let r = 0; r < 200; r++) {
      const round = selectRound(drillDeck, p, 6, rng);
      if (round.some((c) => c.archetype === "loan-advance-fee")) loanSeen++;
      if (round.some((c) => c.id === "en-0001")) kycSeen++;
    }
    expect(loanSeen).toBeGreaterThan(kycSeen);
  });

  it("completeRound increments the round counter", () => {
    expect(completeRound(emptyProgress()).rounds).toBe(1);
  });
});
