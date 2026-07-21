import { describe, expect, test } from "vitest";
import { evaluateRules } from "@/lib/engine/rules";
import { extractUrls } from "@/lib/engine/text";

const fired = (text: string) =>
  evaluateRules(text).matches.map((m) => m.ruleId);

describe("extractUrls", () => {
  test("extracts scheme URLs and bare domains with hostname + registrable", () => {
    const urls = extractUrls(
      "Visit https://secure.sbi-verify.xyz/kyc or bit.ly/3xYz now",
    );
    expect(urls).toHaveLength(2);
    const first = urls[0];
    const second = urls[1];
    expect(first?.hostname).toBe("secure.sbi-verify.xyz");
    expect(first?.registrable).toBe("sbi-verify.xyz");
    expect(second?.hostname).toBe("bit.ly");
  });

  test("understands Indian second-level public suffixes", () => {
    const urls = extractUrls("Official site: https://www.sbi.co.in/portal");
    expect(urls[0]?.registrable).toBe("sbi.co.in");
  });

  test("marks http:// as insecure and https:// as not", () => {
    const urls = extractUrls("http://a-site.com and https://b-site.com");
    expect(urls[0]?.insecureScheme).toBe(true);
    expect(urls[1]?.insecureScheme).toBe(false);
  });

  test("does not extract VPAs, emails, or amounts", () => {
    expect(extractUrls("Pay ramesh@okaxis Rs.500 or mail x@y.dev")).toHaveLength(
      0,
    );
  });
});

describe("url.apk-download", () => {
  test("APK link is danger with a hard override", () => {
    const r = evaluateRules("Update your bank app: http://kyc-update.in/sbi.apk");
    expect(r.matches.map((m) => m.ruleId)).toContain("url.apk-download");
    expect(r.band).toBe("danger");
  });
});

describe("url.lookalike-domain", () => {
  test("brand token inside a non-official domain fires", () => {
    expect(fired("Complete KYC at https://sbi-verify.xyz/kyc")).toContain(
      "url.lookalike-domain",
    );
  });

  test("small edit distance from a real bank domain fires", () => {
    expect(fired("Login at https://icicibnak.com/verify")).toContain(
      "url.lookalike-domain",
    );
  });

  test("the official domain itself does not fire", () => {
    expect(fired("Visit https://www.icicibank.com for details")).not.toContain(
      "url.lookalike-domain",
    );
  });
});

describe("url.shortener", () => {
  test("bit.ly fires", () => {
    expect(fired("Claim here bit.ly/3xYz")).toContain("url.shortener");
  });
});

describe("url.ip-address", () => {
  test("raw IP URL fires", () => {
    expect(fired("Login: http://192.168.4.2/netbanking")).toContain(
      "url.ip-address",
    );
  });
});

describe("url.suspicious-tld", () => {
  test("cheap TLD fires", () => {
    expect(fired("Offer at https://kyc-update.buzz")).toContain(
      "url.suspicious-tld",
    );
  });
});

describe("url.http-bank", () => {
  test("insecure link in a banking context fires", () => {
    expect(fired("SBI netbanking login http://sbi-login.com")).toContain(
      "url.http-bank",
    );
  });

  test("https official bank link stays safe overall", () => {
    const r = evaluateRules("Visit https://www.sbi.co.in for account details");
    expect(r.band).toBe("safe");
  });
});

describe("url.gov-claim-non-gov", () => {
  test("government claim with a non-gov link fires", () => {
    expect(
      fired("PM Yojana subsidy portal: https://pm-yojana-apply.com"),
    ).toContain("url.gov-claim-non-gov");
  });

  test("government claim with a real gov.in link does not fire", () => {
    expect(
      fired("Income tax refunds: https://www.incometax.gov.in/portal"),
    ).not.toContain("url.gov-claim-non-gov");
  });
});

describe("url.excessive-subdomains", () => {
  test("deeply nested hostname fires", () => {
    expect(
      fired("Login https://secure.login.sbi.account-verify.co.in.kyc-portal.top/x"),
    ).toContain("url.excessive-subdomains");
  });
});

describe("url.punycode-homoglyph", () => {
  test("punycode hostname fires", () => {
    expect(fired("Verify at https://xn--icici-bank-verify.com")).toContain(
      "url.punycode-homoglyph",
    );
  });
});
