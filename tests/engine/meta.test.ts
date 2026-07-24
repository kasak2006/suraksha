import { describe, expect, test } from "vitest";
import { META_NAMES, metaVector } from "@/lib/engine/meta";

/*
 * These vectors are pinned by hand (not generated from the implementation) so
 * they act as a contract against the notebook's `meta_vector` (cell 8). If the
 * TS and Python metadata features ever drift, every classifier score is subtly
 * wrong — this test is the tripwire. Cross-check the same three strings in Colab.
 */
describe("metaVector — matches the notebook's meta_vector", () => {
  test("META_NAMES order matches the notebook", () => {
    expect(META_NAMES).toEqual([
      "len",
      "url_count",
      "digit_ratio",
      "amount_count",
      "upper_ratio",
      "exclam",
    ]);
  });

  test("probe A: 'Share your OTP now!' — uppercase + exclamation", () => {
    // len 19, no url/digit/amount, 4 uppercase (S,O,T,P), 1 '!'
    const v = metaVector("Share your OTP now!");
    const expected = [19 / 300, 0, 0, 0, 4 / 19, 1 / 3];
    v.forEach((x, i) => expect(x).toBeCloseTo(expected[i] ?? NaN, 12));
  });

  test("probe B: 'Rs 5000 credited. Call 98765.' — digits + amount", () => {
    // len 29, no url, 9 digits, 1 amount ('Rs 5000'), 2 uppercase (R,C), no '!'
    const v = metaVector("Rs 5000 credited. Call 98765.");
    const expected = [29 / 300, 0, 9 / 29, 1 / 3, 2 / 29, 0];
    v.forEach((x, i) => expect(x).toBeCloseTo(expected[i] ?? NaN, 12));
  });

  test("probe C: KYC line — code-point length + uppercase ratio", () => {
    // len 62, no url/digit/amount, 5 uppercase (Y,K,Y,C,U), no '!'
    const v = metaVector(
      "Your KYC is expiring today. Update now to avoid account block.",
    );
    const expected = [62 / 300, 0, 0, 0, 5 / 62, 0];
    v.forEach((x, i) => expect(x).toBeCloseTo(expected[i] ?? NaN, 12));
  });

  test("empty string does not divide by zero", () => {
    const v = metaVector("");
    expect(v).toEqual([0, 0, 0, 0, 0, 0]);
  });
});
