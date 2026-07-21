import { describe, expect, test } from "vitest";
import { evaluateRules } from "@/lib/engine/rules";

const fired = (text: string) =>
  evaluateRules(text).matches.map((m) => m.ruleId);

describe("reward.lottery-prize", () => {
  test("KBC lottery win fires", () => {
    expect(
      fired("Congratulations! You won ₹25 lakh in the KBC lucky draw"),
    ).toContain("reward.lottery-prize");
  });

  test("Hindi lottery fires", () => {
    expect(fired("बधाई हो! आपकी लॉटरी में 25 लाख का इनाम निकला है")).toContain(
      "reward.lottery-prize",
    );
  });

  test("Gujarati prize fires", () => {
    expect(fired("અભિનંદન! તમને લકી ડ્રોમાં ઇનામ મળ્યું છે")).toContain(
      "reward.lottery-prize",
    );
  });

  test("a normal congratulations does not fire", () => {
    expect(fired("Congratulations on your new job!")).not.toContain(
      "reward.lottery-prize",
    );
  });
});

describe("reward.job-upfront", () => {
  test("work-from-home task scam fires", () => {
    expect(
      fired("Earn ₹5000 daily from home. Pay ₹500 registration to start."),
    ).toContain("reward.job-upfront");
  });

  test("Hindi part-time task offer fires", () => {
    expect(
      fired("घर बैठे रोज़ कमाएँ, बस पहले रजिस्ट्रेशन शुल्क भरें"),
    ).toContain("reward.job-upfront");
  });
});

describe("reward.investment", () => {
  test("guaranteed-returns trading group fires", () => {
    expect(
      fired("Join our trading group for guaranteed profit and double your money"),
    ).toContain("reward.investment");
  });

  test("Gujarati sure-profit tip fires", () => {
    expect(fired("અમારા ટ્રેડિંગ ગ્રુપમાં જોડાઓ, પાક્કો નફો")).toContain(
      "reward.investment",
    );
  });
});
