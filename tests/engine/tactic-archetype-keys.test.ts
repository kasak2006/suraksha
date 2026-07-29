import { describe, expect, test } from "vitest";
import { ARCHETYPE_IDS } from "@/lib/engine/archetypes";
import { TACTIC_AXES } from "@/lib/engine/tactics";
import en from "@/messages/en.json";
import gu from "@/messages/gu.json";
import hi from "@/messages/hi.json";

/*
 * Sibling of reason-keys.test.ts: every tactic axis and every archetype must
 * ship its label/copy in ALL three catalogues in the same change (project rule).
 */

function resolve(catalogue: unknown, dotPath: string): unknown {
  let node: unknown = catalogue;
  for (const part of dotPath.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

function expectString(catalogue: unknown, path: string, locale: string): void {
  const value = resolve(catalogue, path);
  expect(typeof value, `${path} missing in ${locale}.json`).toBe("string");
  expect((value as string).length).toBeGreaterThan(0);
}

const catalogues = { gu, hi, en } as const;

describe("every tactic axis has a label in every locale", () => {
  for (const axis of TACTIC_AXES) {
    for (const [locale, catalogue] of Object.entries(catalogues)) {
      test(`tactics.${axis} [${locale}]`, () => {
        expectString(catalogue, `tactics.${axis}`, locale);
      });
    }
  }
});

describe("every archetype has name/summary/nextStep in every locale", () => {
  for (const id of ARCHETYPE_IDS) {
    for (const field of ["name", "summary", "nextStep"] as const) {
      for (const [locale, catalogue] of Object.entries(catalogues)) {
        test(`archetypes.${id}.${field} [${locale}]`, () => {
          expectString(catalogue, `archetypes.${id}.${field}`, locale);
        });
      }
    }
  }
});
