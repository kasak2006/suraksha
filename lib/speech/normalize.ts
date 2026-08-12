/*
 * Speech-transcript normalization for the security terms that decide a verdict.
 *
 * Whisper (and live Web-Speech STT) reliably mangle spelled-out acronyms in
 * accented speech — "OTP" comes back as "UTP", "UPI PIN" as "UPIP" — so the
 * deterministic rule engine never sees the keyword and under-scores a real
 * scam. This maps the common mishears back to the canonical term BEFORE
 * analysis, restoring the credential/UPI signals (an OTP/UPI-PIN ask is the
 * hard-DANGER override in lib/engine/rules/credential.ts).
 *
 * Deliberately conservative, to avoid turning a safe message into a false
 * alarm: every source is a token that is NOT an ordinary English/Hindi word and
 * is a near-unmistakable mishear of a high-value term. Matched on word
 * boundaries, case-insensitively; the replacement uses the exact casing the
 * rule regexes expect (all-caps). Extend the table as new mishears show up in
 * testing — keep entries nonsense-only so ordinary speech is never rewritten.
 */

// [mishear, canonical]. Order matters only where one output could feed another;
// here they are independent.
const CORRECTIONS: ReadonlyArray<readonly [RegExp, string]> = [
  // OTP — heard as "UTP", "OTB", or spaced single letters ("O T P", "U T P").
  [/\bU\.?T\.?P\b/giu, "OTP"],
  [/\bOTB\b/giu, "OTP"],
  [/\b[OU]\s+T\s+P\b/giu, "OTP"],
  // UPI PIN — heard as one run-on token "UPIP", or "UPI P".
  [/\bUPIP\b/giu, "UPI PIN"],
  [/\bUPI\s+P\b/giu, "UPI PIN"],
  // UPI — spaced single letters.
  [/\bU\s+P\s+I\b/giu, "UPI"],
];

/**
 * Return `text` with known security-acronym mishears corrected. Pure and
 * idempotent; safe to run on any transcript (live or file) before analyze().
 */
export function normalizeTranscript(text: string): string {
  return CORRECTIONS.reduce((out, [pattern, canonical]) => {
    // RegExp is stateful with the /g flag; each replace call resets lastIndex,
    // so reusing the module-level pattern here is safe.
    return out.replace(pattern, canonical);
  }, text);
}
