import { describe, expect, test } from "vitest";
import { bandFloor, maxBand, scoreToBand } from "@/lib/engine/calibration";

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
