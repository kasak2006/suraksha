import { describe, expect, test } from "vitest";
import {
  buildFeatures,
  classify,
  getModelState,
  scoreWithHead,
  sigmoid,
  type ClassifierHead,
} from "@/lib/engine/classifier";

const EMB_DIM = 4;
function stubHead(overrides: Partial<ClassifierHead> = {}): ClassifierHead {
  const coefLen = EMB_DIM + 8 + 6; // embedding + rule groups + meta
  return {
    version: 1,
    model_id: "stub",
    embedding_dim: EMB_DIM,
    rule_groups: ["credential", "upi", "url", "loan", "impersonation", "urgency", "reward", "textual"],
    meta_features: ["len", "url_count", "digit_ratio", "amount_count", "upper_ratio", "exclam"],
    coef: Array.from({ length: coefLen }, () => 0),
    intercept: 0,
    threshold: 0.5,
    normalize_embeddings: true,
    ...overrides,
  };
}

describe("classifier — pure scoring", () => {
  test("sigmoid maps 0 to 0.5 and is monotonic", () => {
    expect(sigmoid(0)).toBeCloseTo(0.5, 12);
    expect(sigmoid(10)).toBeGreaterThan(0.99);
    expect(sigmoid(-10)).toBeLessThan(0.01);
  });

  test("buildFeatures appends 8 rule-group + 6 meta features to the embedding", () => {
    const emb = Array.from({ length: EMB_DIM }, () => 0.1);
    expect(buildFeatures(emb, "hello world").length).toBe(EMB_DIM + 8 + 6);
  });

  test("zero coefficients give sigmoid(intercept)", () => {
    const emb = Array.from({ length: EMB_DIM }, () => 0);
    expect(scoreWithHead(stubHead(), emb, "anything")).toBeCloseTo(0.5, 12);
    expect(
      scoreWithHead(stubHead({ intercept: 6 }), emb, "anything"),
    ).toBeCloseTo(sigmoid(6), 12);
  });
});

describe("classifier — graceful fallback with no head file", () => {
  test("classify returns null and marks the model failed when the head is absent", async () => {
    // In Node there is no /models/classifier-head.json to fetch → rules-only.
    const p = await classify("Share your OTP now");
    expect(p).toBeNull();
    expect(getModelState()).toBe("failed");
  });
});
