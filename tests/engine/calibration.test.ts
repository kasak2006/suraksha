import { describe, expect, test } from "vitest";
import { bandFloor, fuse, maxBand, scoreToBand } from "@/lib/engine/calibration";

describe("scoreToBand (§4.4 bands)", () => {
  test("0–24 is safe", () => {
    expect(scoreToBand(0)).toBe("safe");
    expect(scoreToBand(24)).toBe("safe");
  });

  test("25–54 is caution", () => {
    expect(scoreToBand(25)).toBe("caution");
    expect(scoreToBand(54)).toBe("caution");
  });

  test("55–79 is risky", () => {
    expect(scoreToBand(55)).toBe("risky");
    expect(scoreToBand(79)).toBe("risky");
  });

  test("80–100 is danger", () => {
    expect(scoreToBand(80)).toBe("danger");
    expect(scoreToBand(100)).toBe("danger");
  });
});

describe("band ordering helpers", () => {
  test("bandFloor returns the minimum score of each band", () => {
    expect(bandFloor("safe")).toBe(0);
    expect(bandFloor("caution")).toBe(25);
    expect(bandFloor("risky")).toBe(55);
    expect(bandFloor("danger")).toBe(80);
  });

  test("maxBand picks the more severe band", () => {
    expect(maxBand("safe", "danger")).toBe("danger");
    expect(maxBand("risky", "caution")).toBe("risky");
    expect(maxBand("caution", "caution")).toBe("caution");
  });
});

describe("fuse (§4.4 — neural / rules / tactic-peak)", () => {
  test("weights the three components 0.45 / 0.40 / 0.15", () => {
    // 0.45·40 + 0.40·60 + 0.15·0 = 18 + 24 = 42
    const r = fuse({ pScam: 0.4, ruleScore: 60, tacticPeak: 0 });
    expect(r.score).toBe(42);
    expect(r.band).toBe("caution");
    expect(r.overridden).toBe(false);
  });

  test("normalises pScam (0–1) onto the 0–100 scale", () => {
    // 0.45·100 + 0.40·100 = 85 (the effective cap while tactic-peak is stubbed 0)
    const r = fuse({ pScam: 1, ruleScore: 100 });
    expect(r.score).toBe(85);
    expect(r.band).toBe("danger");
  });

  test("tactic-peak contributes at 0.15 weight", () => {
    const r = fuse({ pScam: 0, ruleScore: 0, tacticPeak: 100 });
    expect(r.score).toBe(15);
    expect(r.band).toBe("safe");
  });

  test("all-zero input is safe", () => {
    const r = fuse({ pScam: 0, ruleScore: 0 });
    expect(r.score).toBe(0);
    expect(r.band).toBe("safe");
  });

  test("a hard override forces DANGER regardless of a low neural score", () => {
    const r = fuse({ pScam: 0.05, ruleScore: 10, overrideBand: "danger" });
    expect(r.band).toBe("danger");
    expect(r.score).toBeGreaterThanOrEqual(80);
    expect(r.overridden).toBe(true);
  });

  test("an override never lowers a band the weights already reached", () => {
    const r = fuse({ pScam: 1, ruleScore: 100, overrideBand: "caution" });
    expect(r.band).toBe("danger");
    expect(r.overridden).toBe(false);
  });
});
