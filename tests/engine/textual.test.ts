import { describe, expect, test } from "vitest";
import { evaluateRules } from "@/lib/engine/rules";
import { extractAmounts } from "@/lib/engine/text";

const fired = (text: string) =>
  evaluateRules(text).matches.map((m) => m.ruleId);

describe("textual.excessive-caps", () => {
  test("mostly-shouting message fires", () => {
    expect(
      fired("URGENT ACTION REQUIRED YOUR ACCOUNT WILL BE BLOCKED CALL NOW"),
    ).toContain("textual.excessive-caps");
  });

  test("a normal sentence with a couple of acronyms does not fire", () => {
    expect(
      fired("Your SBI UPI payment of Rs 200 was successful."),
    ).not.toContain("textual.excessive-caps");
  });
});

describe("textual.char-substitution", () => {
  test("digit-substituted trigger word (acc0unt) fires", () => {
    expect(fired("Verify your acc0unt or it will be susp3nded")).toContain(
      "textual.char-substitution",
    );
  });

  test("clean trigger words do not fire", () => {
    expect(fired("Please verify your account today")).not.toContain(
      "textual.char-substitution",
    );
  });
});

describe("textual.homoglyph-word", () => {
  test("a Latin word laced with a Cyrillic look-alike fires", () => {
    // "verіfy" contains Cyrillic і (U+0456)
    expect(fired("Please verіfy your details now")).toContain(
      "textual.homoglyph-word",
    );
  });

  test("normal Gujarati/English code-mixing does not fire", () => {
    expect(fired("તમારું SBI ખાતું verify કરો")).not.toContain(
      "textual.homoglyph-word",
    );
  });
});

describe("extractAmounts", () => {
  test("extracts rupee amounts across notations", () => {
    expect(extractAmounts("You won ₹25,00,000 and Rs 500 and રૂ 100")).toEqual([
      2500000, 500, 100,
    ]);
  });

  test("returns empty when there is no money", () => {
    expect(extractAmounts("Call us at 9am tomorrow")).toEqual([]);
  });
});
