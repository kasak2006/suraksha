import { describe, expect, test } from "vitest";
import en from "@/messages/en.json";
import gu from "@/messages/gu.json";
import hi from "@/messages/hi.json";

/*
 * The three catalogues must stay key-for-key identical (project rule: no locale
 * ships with a key the others lack). This generalises the reason-keys guard to
 * ALL namespaces, so a new string added to one language but not the others fails
 * the suite rather than throwing a MISSING_MESSAGE at runtime.
 */

function flatten(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) return [prefix];
  return Object.entries(obj).flatMap(([key, value]) =>
    flatten(value, prefix ? `${prefix}.${key}` : key),
  );
}

const enKeys = new Set(flatten(en));
const hiKeys = new Set(flatten(hi));
const guKeys = new Set(flatten(gu));

function missing(reference: Set<string>, other: Set<string>): string[] {
  return [...reference].filter((k) => !other.has(k)).sort();
}

describe("message catalogues are in full parity", () => {
  test("hi has every key en has", () => {
    expect(missing(enKeys, hiKeys)).toEqual([]);
  });
  test("gu has every key en has", () => {
    expect(missing(enKeys, guKeys)).toEqual([]);
  });
  test("en has every key hi and gu have", () => {
    expect(missing(hiKeys, enKeys)).toEqual([]);
    expect(missing(guKeys, enKeys)).toEqual([]);
  });
});
