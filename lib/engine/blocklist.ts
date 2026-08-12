import blocklist from "../../data/blocklist.json";

/*
 * Tier-1 known-phishing blocklist (§4.2, offline). We ship a snapshot of
 * confirmed scam/phishing URLs from public threat feeds (URLhaus, OpenPhish)
 * inside the PWA and match links against it entirely on-device — no network
 * request, nothing about the message leaves the phone. This turns a structural
 * "this LOOKS like phishing" guess into "this exact link WAS reported as
 * phishing". `scripts/build-blocklist.ts` regenerates data/blocklist.json.
 *
 * Two match granularities, both precomputed by the build:
 *  - `urls`  a full normalized URL (path-level) — used when a feed flags a
 *            single page on an otherwise-shared or compromised-but-legit host.
 *  - `hosts` a whole hostname — used only when a feed flagged the site root, so
 *            we never blanket-block a legitimate site that merely hosts one
 *            hacked page.
 *
 * Scale note: a large live feed belongs behind a lazily-loaded, hash-prefixed
 * store (the Tier-2 / Safe Browsing path). The synchronous in-bundle Set here
 * keeps the <300ms rules path (§10) intact for a seed-sized snapshot.
 */

interface BlocklistData {
  hosts?: readonly string[];
  urls?: readonly string[];
}

const data = blocklist as BlocklistData;

/** Lowercase and drop a leading "www." so "www.Evil.COM" == "evil.com". */
export function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/^www\./u, "");
}

/**
 * Canonical form used to match a URL against the feed on BOTH sides (build and
 * runtime), so equal links always collide: scheme + leading "www." + fragment +
 * trailing slashes stripped, host lowercased, path left untouched (paths can be
 * case-sensitive). A URL with no path collapses to a bare host.
 */
export function normalizeUrl(raw: string): string {
  let s = raw.trim().replace(/^https?:\/\//iu, "").replace(/^www\./iu, "");
  const hash = s.indexOf("#");
  if (hash !== -1) s = s.slice(0, hash);
  s = s.replace(/\/+$/u, "");
  const slash = s.indexOf("/");
  if (slash === -1) return s.toLowerCase();
  return s.slice(0, slash).toLowerCase() + s.slice(slash);
}

const BLOCKED_HOSTS: ReadonlySet<string> = new Set(
  (data.hosts ?? []).map(normalizeHost),
);
const BLOCKED_URLS: ReadonlySet<string> = new Set(
  (data.urls ?? []).map(normalizeUrl),
);

/** True when the whole hostname is a known-phishing site. */
export function isBlockedHost(hostname: string): boolean {
  return BLOCKED_HOSTS.has(normalizeHost(hostname));
}

/** True when this exact URL (path-level) was reported as phishing. */
export function isBlockedUrl(url: string): boolean {
  return BLOCKED_URLS.has(normalizeUrl(url));
}

/** Snapshot sizes, for the build script and diagnostics. */
export const blocklistSize = {
  hosts: BLOCKED_HOSTS.size,
  urls: BLOCKED_URLS.size,
} as const;
