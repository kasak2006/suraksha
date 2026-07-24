/*
 * Corpus validator (Phase 2, PHASE2_PROMPT §1). Run: `npm run corpus:validate`.
 *
 * Mirrors the checks in notebooks/train.ipynb cell 3 so the corpus that trains
 * the classifier is the same corpus this repo vouches for. Exits non-zero on any
 * hard error, so it can gate CI or a pre-training check.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const CORPUS_PATH = resolve(process.cwd(), "data/corpus.jsonl");

// Kept identical to the notebook's ARCHETYPES / TACTICS and data/LABELLING.md.
const ARCHETYPES = new Set([
  "kyc-expiry", "upi-collect", "refund-reversal", "digital-arrest",
  "courier-parcel", "electricity-bill", "army-officer", "loan-advance-fee",
  "job-task", "lottery-prize", "sim-swap", "card-upgrade",
  "investment-trading", "qr-receive", "phishing-link", "other",
]);
const TACTICS = new Set([
  "urgency", "authority", "fear", "reward",
  "secrecy", "credential", "trust", "irreversibility",
]);
const LANGS = new Set(["gu", "hi", "en", "mixed"]);

interface Row {
  id?: string;
  text?: string;
  lang?: string;
  label?: string;
  archetype?: string | null;
  tactics?: string[];
  source?: string;
  notes?: string;
}

function normaliseText(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function main(): void {
  let raw: string;
  try {
    raw = readFileSync(CORPUS_PATH, "utf8");
  } catch {
    console.error(`Cannot read ${CORPUS_PATH}. Create data/corpus.jsonl first.`);
    process.exit(1);
    return;
  }

  const errors: string[] = [];
  const seenIds = new Set<string>();
  const seenText = new Map<string, string>();
  const rows: Row[] = [];

  const lines = raw.split(/\r?\n/);
  lines.forEach((line, i) => {
    const n = i + 1;
    const trimmed = line.trim();
    if (trimmed.length === 0) return;

    let row: Row;
    try {
      row = JSON.parse(trimmed) as Row;
    } catch (e) {
      errors.push(`line ${n}: bad JSON (${(e as Error).message})`);
      return;
    }

    for (const key of ["id", "text", "lang", "label", "source"] as const) {
      if (row[key] === undefined) errors.push(`line ${n}: missing '${key}'`);
    }

    const id = row.id ?? `line-${n}`;
    if (row.id !== undefined) {
      if (seenIds.has(row.id)) errors.push(`line ${n}: duplicate id ${row.id}`);
      seenIds.add(row.id);
    }

    const text = row.text ?? "";
    const norm = normaliseText(text);
    if (norm.length > 0) {
      const prior = seenText.get(norm);
      if (prior !== undefined) {
        errors.push(`line ${n}: duplicate/near-duplicate text (${id}, matches ${prior})`);
      } else {
        seenText.set(norm, id);
      }
    }
    if (text.length < 20) errors.push(`line ${n}: text under 20 chars (${id})`);

    if (row.lang !== undefined && !LANGS.has(row.lang)) {
      errors.push(`line ${n}: bad lang ${row.lang} (${id})`);
    }

    if (row.label === "scam") {
      if (!ARCHETYPES.has(row.archetype ?? "")) {
        errors.push(`line ${n}: bad archetype ${String(row.archetype)} (${id})`);
      }
      const badTactics = (row.tactics ?? []).filter((t) => !TACTICS.has(t));
      if (badTactics.length > 0) {
        errors.push(`line ${n}: bad tactics ${badTactics.join(",")} (${id})`);
      }
    } else if (row.label === "legit") {
      if (row.archetype !== null && row.archetype !== undefined) {
        errors.push(`line ${n}: legit row has archetype (${id})`);
      }
      if ((row.tactics ?? []).length > 0) {
        errors.push(`line ${n}: legit row has tactics (${id})`);
      }
    } else {
      errors.push(`line ${n}: bad label ${String(row.label)} (${id})`);
    }

    rows.push(row);
  });

  // Per-language / per-label count table.
  const counts = new Map<string, { scam: number; legit: number }>();
  for (const row of rows) {
    const lang = row.lang ?? "?";
    const cell = counts.get(lang) ?? { scam: 0, legit: 0 };
    if (row.label === "scam") cell.scam += 1;
    else if (row.label === "legit") cell.legit += 1;
    counts.set(lang, cell);
  }

  console.log(`\nCorpus: ${rows.length} rows, ${errors.length} problems\n`);
  console.log("lang    scam   legit   total");
  console.log("-------------------------------");
  let totalScam = 0;
  let totalLegit = 0;
  for (const lang of [...counts.keys()].sort()) {
    const c = counts.get(lang) ?? { scam: 0, legit: 0 };
    totalScam += c.scam;
    totalLegit += c.legit;
    console.log(
      `${lang.padEnd(6)}  ${String(c.scam).padStart(4)}   ${String(c.legit).padStart(5)}   ${String(c.scam + c.legit).padStart(5)}`,
    );
  }
  console.log("-------------------------------");
  console.log(
    `${"all".padEnd(6)}  ${String(totalScam).padStart(4)}   ${String(totalLegit).padStart(5)}   ${String(totalScam + totalLegit).padStart(5)}\n`,
  );

  if (errors.length > 0) {
    console.error(`${errors.length} hard error(s):`);
    for (const e of errors.slice(0, 50)) console.error(`  ${e}`);
    if (errors.length > 50) console.error(`  ... and ${errors.length - 50} more`);
    process.exit(1);
  }

  console.log("OK — corpus is valid.");
}

main();
