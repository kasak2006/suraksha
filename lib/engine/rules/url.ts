import legitDomains from "../../../data/legit-domains.json";
import { isBlockedHost, isBlockedUrl } from "../blocklist";
import { levenshtein } from "../text";
import type { EvidenceSpan, Rule, RuleContext } from "../types";
import { findAll } from "./helpers";

/*
 * §4.2 "URL / phishing" — structural signals from links. APK/EXE downloads
 * carry the hard DANGER override: sideloaded "bank apps" are the dominant
 * remote-access fraud vector in India.
 */

const LEGIT_DOMAINS: ReadonlySet<string> = new Set(legitDomains.domains);

const SHORTENER_DOMAINS: ReadonlySet<string> = new Set([
  "bit.ly", "tinyurl.com", "cutt.ly", "is.gd", "t.ly", "rb.gy",
  "goo.gl", "ow.ly", "s.id", "tiny.cc", "shorturl.at", "t.co",
  "rebrand.ly", "surl.li", "u.to",
]);

const SUSPICIOUS_TLDS: readonly string[] = [
  ".xyz", ".top", ".buzz", ".click", ".rest", ".icu", ".vip",
  ".cyou", ".monster", ".quest",
];

/** Brand tokens scammers embed in lookalike hostnames. Matched only at label
 *  starts so "taxis.com" never trips "axis". */
const BRAND_TOKENS: readonly string[] = [
  "sbi", "icici", "hdfc", "axis", "kotak", "pnb", "paytm", "phonepe",
  "npci", "rbi", "uidai", "aadhaar", "irctc", "epfo", "incometax", "bhim",
];

const GOV_CLAIM_PATTERN =
  /(government|govt|સરકાર|सरकार|uidai|aadhaa?r|આધાર|आधार|income\s?tax|આવકવેરા|आयकर|pm[\s-]?(?:kisan|yojana|awas)|યોજના|योजना|subsidy|સબસિડી|सब्सिडी)/giu;

const BANK_CONTEXT_PATTERN =
  /(bank|બેંક|बैंक|netbanking|kyc|upi|sbi|icici|hdfc|axis|pnb|kotak)/iu;

const APK_PATTERN = /\.(apk|exe)\b/iu;
const IP_HOSTNAME_PATTERN = /^\d{1,3}(?:\.\d{1,3}){3}$/u;

function urlRule(
  base: Omit<Rule, "detect">,
  select: (ctx: RuleContext) => EvidenceSpan[],
): Rule {
  return { ...base, detect: select };
}

function isLookalike(hostname: string, registrable: string): boolean {
  if (LEGIT_DOMAINS.has(registrable)) return false;
  const labels = hostname.split(".");
  for (const token of BRAND_TOKENS) {
    for (const label of labels) {
      if (label === token || label.startsWith(`${token}-`)) return true;
    }
  }
  for (const legit of LEGIT_DOMAINS) {
    const distance = levenshtein(registrable, legit);
    if (distance > 0 && distance <= 2) return true;
  }
  return false;
}

export const urlRules: readonly Rule[] = [
  urlRule(
    {
      id: "url.known-phishing",
      category: "url",
      weight: 90,
      reasonKey: "reasons.url.knownPhishing",
      override: "danger",
    },
    // A confirmed report outranks every structural guess below, so this leads
    // the "Why" list. The allowlist guard means a compromised path on a genuine
    // bank/govt domain never blanket-flags that domain as phishing.
    (ctx) =>
      ctx.urls
        .filter(
          (u) =>
            !LEGIT_DOMAINS.has(u.registrable) &&
            (isBlockedUrl(u.span.text) || isBlockedHost(u.hostname)),
        )
        .map((u) => u.span),
  ),
  urlRule(
    {
      id: "url.apk-download",
      category: "url",
      weight: 85,
      reasonKey: "reasons.url.apkDownload",
      override: "danger",
    },
    (ctx) =>
      ctx.urls
        .filter((u) => APK_PATTERN.test(u.span.text))
        .map((u) => u.span),
  ),
  urlRule(
    {
      id: "url.lookalike-domain",
      category: "url",
      weight: 70,
      reasonKey: "reasons.url.lookalikeDomain",
    },
    (ctx) =>
      ctx.urls
        .filter((u) => isLookalike(u.hostname, u.registrable))
        .map((u) => u.span),
  ),
  urlRule(
    {
      id: "url.punycode-homoglyph",
      category: "url",
      weight: 60,
      reasonKey: "reasons.url.punycodeHomoglyph",
    },
    (ctx) =>
      ctx.urls
        .filter(
          (u) =>
            u.hostname.includes("xn--") ||
            [...u.hostname].some((ch) => (ch.codePointAt(0) ?? 0) > 127),
        )
        .map((u) => u.span),
  ),
  urlRule(
    {
      id: "url.shortener",
      category: "url",
      weight: 35,
      reasonKey: "reasons.url.shortener",
    },
    (ctx) =>
      ctx.urls
        .filter((u) => SHORTENER_DOMAINS.has(u.registrable))
        .map((u) => u.span),
  ),
  urlRule(
    {
      id: "url.ip-address",
      category: "url",
      weight: 45,
      reasonKey: "reasons.url.ipAddress",
    },
    (ctx) =>
      ctx.urls
        .filter((u) => IP_HOSTNAME_PATTERN.test(u.hostname))
        .map((u) => u.span),
  ),
  urlRule(
    {
      id: "url.suspicious-tld",
      category: "url",
      weight: 30,
      reasonKey: "reasons.url.suspiciousTld",
    },
    (ctx) =>
      ctx.urls
        .filter((u) => SUSPICIOUS_TLDS.some((tld) => u.hostname.endsWith(tld)))
        .map((u) => u.span),
  ),
  urlRule(
    {
      id: "url.http-bank",
      category: "url",
      weight: 40,
      reasonKey: "reasons.url.httpBank",
    },
    (ctx) =>
      BANK_CONTEXT_PATTERN.test(ctx.raw)
        ? ctx.urls.filter((u) => u.insecureScheme).map((u) => u.span)
        : [],
  ),
  urlRule(
    {
      id: "url.gov-claim-non-gov",
      category: "url",
      weight: 45,
      reasonKey: "reasons.url.govClaimNonGov",
    },
    (ctx) => {
      const claims = findAll(GOV_CLAIM_PATTERN, ctx.raw);
      if (claims.length === 0) return [];
      return ctx.urls
        .filter(
          (u) =>
            !u.registrable.endsWith("gov.in") &&
            !u.registrable.endsWith("nic.in"),
        )
        .map((u) => u.span);
    },
  ),
  urlRule(
    {
      id: "url.excessive-subdomains",
      category: "url",
      weight: 25,
      reasonKey: "reasons.url.excessiveSubdomains",
    },
    (ctx) =>
      ctx.urls
        .filter((u) => u.hostname.split(".").length >= 5)
        .map((u) => u.span),
  ),
];
