/*
 * Cheap, language-agnostic metadata features — the "M" block the classifier
 * fuses with the embedding and rule-group scores.
 *
 * This MUST stay byte-for-byte equivalent to the notebook's `meta_vector`
 * (notebooks/train.ipynb cell 8). Any drift between Python and TS here silently
 * corrupts every classifier score, so:
 *   - lengths and per-character loops count Unicode CODE POINTS (Python's len /
 *     `for c in text`), via [...text] — not UTF-16 code units;
 *   - digits use \p{Nd} to mirror Python's Unicode-aware \d (Devanagari/Gujarati
 *     digits count too), not JS's ASCII-only \d;
 *   - uppercase uses a case-fold test equivalent to Python's str.isupper().
 * The URL regex mirrors the notebook's; JS \b is ASCII-only where Python's is
 * Unicode-aware, a negligible difference on realistic messages. tests/engine/
 * meta.test.ts pins three probes as the cross-runtime contract.
 */

/** Order is fixed and must match the notebook's META_NAMES exactly. */
export const META_NAMES = [
  "len",
  "url_count",
  "digit_ratio",
  "amount_count",
  "upper_ratio",
  "exclam",
] as const;

// Notebook: (?:https?://|www\.)\S+ | \b[a-z0-9-]+\.(com|in|xyz|top|buzz|click|ly|net|org)\b
const URL_RE =
  /(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|in|xyz|top|buzz|click|ly|net|org)\b/gi;
// Notebook: \d  (Unicode-aware in Python 3) → \p{Nd}
const DIGIT_RE = /\p{Nd}/gu;
// Notebook: (?:₹|rs\.?|inr|રૂ|रु)\s?[\d,]+  → [\p{Nd},] for the Unicode digits
const AMOUNT_RE = /(?:₹|rs\.?|inr|રૂ|रु)\s?[\p{Nd},]+/giu;

function countMatches(text: string, re: RegExp): number {
  const m = text.match(re);
  return m ? m.length : 0;
}

/** True iff `c` is a cased character in its uppercase form — mirrors str.isupper(). */
function isUpper(c: string): boolean {
  const lower = c.toLowerCase();
  const upper = c.toUpperCase();
  return lower !== upper && c === upper;
}

/** The six metadata features for `text`, in META_NAMES order. */
export function metaVector(text: string): number[] {
  const chars = [...text];
  const len = chars.length;
  const n = Math.max(len, 1);

  let upper = 0;
  for (const c of chars) {
    if (isUpper(c)) upper += 1;
  }
  const exclam = chars.filter((c) => c === "!").length;

  return [
    Math.min(len / 300, 2),
    Math.min(countMatches(text, URL_RE) / 3, 1),
    countMatches(text, DIGIT_RE) / n,
    Math.min(countMatches(text, AMOUNT_RE) / 3, 1),
    upper / n,
    Math.min(exclam / 3, 1),
  ];
}
