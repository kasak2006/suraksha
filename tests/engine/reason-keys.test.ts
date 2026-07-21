import { describe, expect, test } from "vitest";
import { allRules } from "@/lib/engine/rules";
import en from "@/messages/en.json";
import gu from "@/messages/gu.json";
import hi from "@/messages/hi.json";

/*
 * Every rule must ship its translated explanation in ALL three catalogues in
 * the same change that adds the rule — no English placeholders (project rule).
 * This test makes that mechanical: a rule whose reasonKey is missing from any
 * locale fails the suite.
 */

function resolve(catalogue: unknown, dotPath: string): unknown {
  let node: unknown = catalogue;
  for (const part of dotPath.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

const catalogues = { gu, hi, en } as const;

describe("every rule reasonKey resolves in every locale", () => {
  for (const rule of allRules) {
    for (const [locale, catalogue] of Object.entries(catalogues)) {
      test(`${rule.id} → ${rule.reasonKey} [${locale}]`, () => {
        const value = resolve(catalogue, rule.reasonKey);
        expect(typeof value, `${rule.reasonKey} missing in ${locale}.json`).toBe(
          "string",
        );
        expect((value as string).length).toBeGreaterThan(0);
      });
    }
  }
});

describe("rule ids are unique", () => {
  test("no duplicate rule ids", () => {
    const ids = allRules.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
