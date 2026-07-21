import type { ExtractedUrl } from "./types";

/*
 * Text-level utilities shared by rule groups. Pure functions, no state.
 */

/** Indian (and common) second-level public suffixes — "sbi.co.in" is one
 *  registrable domain, not a subdomain of "co.in". */
const SECOND_LEVEL_SUFFIXES: readonly string[] = [
  "co.in", "gov.in", "nic.in", "org.in", "net.in", "ac.in",
  "res.in", "gen.in", "firm.in", "ind.in", "edu.in", "mil.in",
];

/** TLDs accepted for scheme-less bare domains ("bit.ly", "sbi-verify.xyz").
 *  Without this filter, "Mr.Patel" would parse as a hostname. URLs written
 *  with an explicit http(s):// accept any TLD. */
const BARE_DOMAIN_TLDS: ReadonlySet<string> = new Set([
  "com", "in", "org", "net", "co", "io", "me", "app", "dev", "info",
  "biz", "gov", "edu", "link", "shop", "store", "tech", "online", "site",
  "live", "cc", "tv", "ly", "gd", "gl", "ml", "tk", "ga", "cf", "id",
  "xyz", "top", "buzz", "click", "rest", "icu", "vip", "at", "sbi", "bank",
]);

const URL_PATTERN =
  /(https?:\/\/)?(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?\.)+(\p{L}{2,})(?::\d{2,5})?(?:\/[^\s<>"'()]*)?/giu;

/** Raw-IP URLs ("http://192.168.4.2/login") — no alphabetic TLD, so the main
 *  pattern never sees them. Only matched with an explicit scheme. */
const IP_URL_PATTERN =
  /(https?:\/\/)(\d{1,3}(?:\.\d{1,3}){3})(?::\d{2,5})?(?:\/[^\s<>"'()]*)?/giu;

const TRAILING_PUNCTUATION = /[.,;:!?'"’]+$/u;

export function extractUrls(text: string): ExtractedUrl[] {
  const urls: ExtractedUrl[] = [];
  for (const match of text.matchAll(IP_URL_PATTERN)) {
    if (match.index === undefined) continue;
    const trimmed = match[0].replace(TRAILING_PUNCTUATION, "");
    const hostname = match[2] ?? "";
    if (hostname.length === 0) continue;
    urls.push({
      span: {
        start: match.index,
        end: match.index + trimmed.length,
        text: trimmed,
      },
      hostname,
      registrable: hostname,
      insecureScheme: match[1] === "http://",
    });
  }
  for (const match of text.matchAll(URL_PATTERN)) {
    if (match.index === undefined) continue;
    const scheme = match[1];
    const tld = match[2];

    // Emails and VPAs: the char immediately before the candidate is "@".
    const before = match.index > 0 ? text[match.index - 1] : "";
    if (before === "@") continue;

    // Scheme-less candidates must end in a plausible TLD.
    if (scheme === undefined && !BARE_DOMAIN_TLDS.has((tld ?? "").toLowerCase()))
      continue;

    const trimmed = match[0].replace(TRAILING_PUNCTUATION, "");
    if (trimmed.length === 0) continue;

    const withoutScheme = scheme ? trimmed.slice(scheme.length) : trimmed;
    const hostPort = withoutScheme.split("/")[0] ?? "";
    const hostname = (hostPort.split(":")[0] ?? "").toLowerCase();
    if (hostname.length === 0) continue;

    urls.push({
      span: {
        start: match.index,
        end: match.index + trimmed.length,
        text: trimmed,
      },
      hostname,
      registrable: registrableDomain(hostname),
      insecureScheme: scheme === "http://",
    });
  }
  return urls.sort((a, b) => a.span.start - b.span.start);
}

export function registrableDomain(hostname: string): string {
  const labels = hostname.split(".");
  const lastTwo = labels.slice(-2).join(".");
  const take = SECOND_LEVEL_SUFFIXES.includes(lastTwo) ? 3 : 2;
  return labels.slice(-take).join(".");
}

const AMOUNT_PATTERN =
  /(?:₹|rs\.?|inr|રૂ\.?|रु\.?|रुपये|રૂપિયા)\s?([\d,]+(?:\.\d+)?)/giu;

/** Rupee amounts in the text, in order, as plain numbers (commas stripped). */
export function extractAmounts(text: string): number[] {
  const amounts: number[] = [];
  for (const match of text.matchAll(AMOUNT_PATTERN)) {
    const digits = (match[1] ?? "").replace(/,/g, "");
    if (digits.length === 0) continue;
    const value = Number.parseFloat(digits);
    if (!Number.isNaN(value)) amounts.push(value);
  }
  return amounts;
}

/** Classic edit distance (single-row DP); inputs are short domain strings. */
export function levenshtein(a: string, b: string): number {
  const row: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0] ?? 0;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = row[j] ?? 0;
      const left = row[j - 1] ?? 0;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(above + 1, left + 1, diagonal + cost);
      diagonal = above;
    }
  }
  return row[b.length] ?? 0;
}
