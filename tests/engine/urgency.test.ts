import { describe, expect, test } from "vitest";
import { evaluateRules } from "@/lib/engine/rules";

const fired = (text: string) =>
  evaluateRules(text).matches.map((m) => m.ruleId);

describe("urgency.deadline", () => {
  test("account-blocked-today deadline fires", () => {
    expect(
      fired("Your account will be blocked today. Act within 24 hours."),
    ).toContain("urgency.deadline");
  });

  test("Hindi deadline fires", () => {
    expect(fired("आपका खाता आज ही बंद हो जाएगा, तुरंत कार्रवाई करें")).toContain(
      "urgency.deadline",
    );
  });

  test("Gujarati deadline fires", () => {
    expect(fired("તમારું ખાતું આજે જ બંધ થઈ જશે, તાત્કાલિક કરો")).toContain(
      "urgency.deadline",
    );
  });

  test("a calm message with no time pressure does not fire", () => {
    expect(fired("Thank you for banking with us.")).not.toContain(
      "urgency.deadline",
    );
  });
});

describe("urgency.secrecy", () => {
  test("do-not-tell-anyone fires", () => {
    expect(
      fired("Do not tell anyone, not even bank staff or family."),
    ).toContain("urgency.secrecy");
  });

  test("Hindi secrecy demand fires", () => {
    expect(fired("यह बात किसी को मत बताना, परिवार को भी नहीं")).toContain(
      "urgency.secrecy",
    );
  });

  test("Gujarati secrecy demand fires", () => {
    expect(fired("આ વાત કોઈને કહેશો નહીં")).toContain("urgency.secrecy");
  });
});
