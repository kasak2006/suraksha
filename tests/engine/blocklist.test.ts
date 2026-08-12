import { describe, expect, test } from "vitest";
import {
  isBlockedHost,
  isBlockedUrl,
  normalizeHost,
  normalizeUrl,
} from "@/lib/engine/blocklist";
import { evaluateRules } from "@/lib/engine/rules";

const fired = (text: string) =>
  evaluateRules(text).matches.map((m) => m.ruleId);

describe("normalizeHost", () => {
  test("lowercases and drops a leading www.", () => {
    expect(normalizeHost("WWW.Evil.COM")).toBe("evil.com");
    expect(normalizeHost("evil.com")).toBe("evil.com");
  });
});

describe("normalizeUrl", () => {
  test("strips scheme, www., fragment and trailing slash; lowercases host only", () => {
    expect(normalizeUrl("https://www.Evil.com/Path/?a=1#frag/")).toBe(
      "evil.com/Path/?a=1",
    );
  });

  test("a URL with no path collapses to a bare host", () => {
    expect(normalizeUrl("http://Evil.com/")).toBe("evil.com");
  });

  test("matches equal links written differently", () => {
    expect(normalizeUrl("HTTP://login-hdfc.info/netbanking/verify")).toBe(
      normalizeUrl("login-hdfc.info/netbanking/verify/"),
    );
  });
});

describe("seed lookups", () => {
  test("seed host is blocked, unknown host is not", () => {
    expect(isBlockedHost("secure-sbi-kyc.xyz")).toBe(true);
    expect(isBlockedHost("www.secure-sbi-kyc.xyz")).toBe(true);
    expect(isBlockedHost("some-clean-shop.com")).toBe(false);
  });

  test("seed URL is blocked at path level", () => {
    expect(isBlockedUrl("https://login-hdfc.info/netbanking/verify")).toBe(true);
    // Same host, different path — not the reported page.
    expect(isBlockedUrl("https://login-hdfc.info/other")).toBe(false);
  });
});

describe("url.known-phishing rule", () => {
  test("blocked host fires with a hard danger override", () => {
    const evaluation = evaluateRules(
      "Update your KYC now at http://secure-sbi-kyc.xyz/login",
    );
    const match = evaluation.matches.find(
      (m) => m.ruleId === "url.known-phishing",
    );
    expect(match).toBeDefined();
    expect(match?.override).toBe("danger");
    expect(evaluation.band).toBe("danger");
    expect(evaluation.overrideBand).toBe("danger");
  });

  test("blocked exact URL fires", () => {
    expect(fired("Verify here: login-hdfc.info/netbanking/verify")).toContain(
      "url.known-phishing",
    );
  });

  test("a clean, unlisted link does not fire the blocklist rule", () => {
    expect(fired("See our store at some-clean-shop.com/sale")).not.toContain(
      "url.known-phishing",
    );
  });

  test("an allowlisted bank domain is never flagged as known-phishing", () => {
    expect(fired("Log in at https://onlinesbi.sbi/personal")).not.toContain(
      "url.known-phishing",
    );
  });
});
