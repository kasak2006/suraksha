/*
 * Tier-1 blocklist builder. Run: `npm run blocklist:build`.
 *
 * Fetches free, no-key public phishing/malware URL feeds, merges them with the
 * stable committed seed (data/blocklist.seed.json), normalizes + dedupes, and
 * writes data/blocklist.json — the on-device snapshot that lib/engine/blocklist
 * checks links against. Nothing here runs in the browser; this is a build step.
 *
 * Feeds:
 *  - URLhaus (abuse.ch)  plaintext list of online malware/phishing URLs (CC0)
 *  - OpenPhish           community phishing feed
 *
 * Network-tolerant: a feed that is unreachable is skipped with a warning; the
 * others still apply. The seed is always included, so even with every feed down
 * the output stays a valid, working (if small) blocklist. URLs on allowlisted
 * (legit) domains are dropped — the runtime rule guards against them too, but
 * there is no reason to ship them.
 *
 * A URL with no path collapses to a `hosts` entry (whole-site block); a URL
 * with a path becomes a precise `urls` entry, so a single hacked page on an
 * otherwise-legitimate host never blanket-blocks that host.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import legitDomains from "../data/legit-domains.json";
import { normalizeHost, normalizeUrl } from "../lib/engine/blocklist";
import { registrableDomain } from "../lib/engine/text";

interface Feed {
  name: string;
  url: string;
}

const FEEDS: readonly Feed[] = [
  { name: "urlhaus", url: "https://urlhaus.abuse.ch/downloads/text_online/" },
  { name: "openphish", url: "https://openphish.com/feed.txt" },
];

const SEED_PATH = resolve(process.cwd(), "data/blocklist.seed.json");
const OUT_PATH = resolve(process.cwd(), "data/blocklist.json");
const LEGIT: ReadonlySet<string> = new Set(legitDomains.domains);

interface SeedFile {
  hosts?: string[];
  urls?: string[];
}

async function fetchFeed(feed: Feed): Promise<string[]> {
  const res = await fetch(feed.url, {
    headers: { "user-agent": "suraksha-blocklist-builder" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  return text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

/** True when the normalized entry sits on an allowlisted legit domain. */
function onLegitDomain(normalized: string): boolean {
  const host = normalized.split("/")[0] ?? normalized;
  return LEGIT.has(registrableDomain(host));
}

async function main(): Promise<void> {
  const hosts = new Set<string>();
  const urls = new Set<string>();

  // 1. Seed (always present, keeps tests + the shipped snapshot deterministic).
  const seed = JSON.parse(readFileSync(SEED_PATH, "utf8")) as SeedFile;
  for (const h of seed.hosts ?? []) hosts.add(normalizeHost(h));
  for (const u of seed.urls ?? []) urls.add(normalizeUrl(u));
  console.log(`seed: ${hosts.size} hosts, ${urls.size} urls`);

  // 2. Live feeds (best-effort).
  const usedSources = ["seed"];
  for (const feed of FEEDS) {
    try {
      const lines = await fetchFeed(feed);
      let added = 0;
      for (const raw of lines) {
        if (!/^https?:\/\//iu.test(raw)) continue;
        const norm = normalizeUrl(raw);
        if (norm.length === 0 || onLegitDomain(norm)) continue;
        if (norm.includes("/")) urls.add(norm);
        else hosts.add(normalizeHost(norm));
        added += 1;
      }
      usedSources.push(feed.name);
      console.log(`${feed.name}: ${lines.length} lines, ${added} usable`);
    } catch (err) {
      console.warn(`${feed.name}: skipped (${(err as Error).message})`);
    }
  }

  // 3. Write a stable, sorted snapshot for clean diffs.
  const output = {
    _comment:
      "Tier-1 known-phishing snapshot, checked entirely on-device (lib/engine/blocklist.ts). Regenerate with `npm run blocklist:build`, which merges data/blocklist.seed.json with public feeds (URLhaus, OpenPhish). `hosts` block a whole site; `urls` block one path.",
    generatedAt: new Date().toISOString(),
    sources: usedSources,
    hosts: [...hosts].sort(),
    urls: [...urls].sort(),
  };
  writeFileSync(OUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(
    `wrote data/blocklist.json — ${output.hosts.length} hosts, ${output.urls.length} urls (sources: ${usedSources.join(", ")})`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
