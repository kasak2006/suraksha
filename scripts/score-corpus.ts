/*
 * Rule-feature exporter (Phase 2, PHASE2_PROMPT §2). Run: `npm run corpus:features`.
 *
 * Runs the deterministic rule engine over every corpus row and writes
 * data/rule-features.json shaped { "<id>": { credential, upi, url, ... } }.
 * This file is uploaded to the Colab notebook (cell 6) as the "R" feature block.
 * It must be deterministic and reproducible — same corpus in, same features out.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { RULE_GROUPS, ruleGroupScores } from "../lib/engine/features";

const CORPUS_PATH = resolve(process.cwd(), "data/corpus.jsonl");
const OUT_PATH = resolve(process.cwd(), "data/rule-features.json");

interface Row {
  id: string;
  text: string;
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

  const features: Record<string, Record<string, number>> = {};
  let count = 0;

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    const row = JSON.parse(trimmed) as Row;
    if (!row.id || typeof row.text !== "string") continue;
    features[row.id] = ruleGroupScores(row.text);
    count += 1;
  }

  // Stable key order (row order preserved by insertion; groups already fixed).
  writeFileSync(OUT_PATH, `${JSON.stringify(features, null, 2)}\n`, "utf8");
  console.log(
    `Wrote ${OUT_PATH}\n  ${count} rows, ${RULE_GROUPS.length} groups per row: ${RULE_GROUPS.join(", ")}`,
  );
}

main();
