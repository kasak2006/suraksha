import type { EvidenceSpan, Rule, RuleContext } from "../types";
import { findAll } from "./helpers";

/*
 * §4.2 "Textual tells". Obfuscation signatures that survive across languages:
 * shouting, digit/symbol substitution in trigger words, and homoglyph letters
 * used to disguise words. Low individual weight — these corroborate, they
 * don't convict on their own.
 */

/** Trigger words in leet/substituted form — a letter replaced by a look-alike
 *  digit or symbol. Clean spellings never match; the detect() guard also
 *  requires a real digit/symbol to be present in the token. */
const LEET_IN_TRIGGER =
  /\b[a-z]*(?:acc0unt|0tp|susp3nd(?:ed)?|ver1fy|verlfy|bl0ck(?:ed)?|passw0rd|p4ssword)[a-z0-9]*\b/giu;

const CAPS_WORD = /\b[A-Z][A-Z]{3,}\b/gu;
const WORD = /\b[A-Za-z]{2,}\b/gu;

const excessiveCaps: Rule = {
  id: "textual.excessive-caps",
  category: "textual",
  weight: 15,
  reasonKey: "reasons.textual.excessiveCaps",
  detect: (ctx: RuleContext) => {
    const capsWords = findAll(CAPS_WORD, ctx.raw);
    const allWords = findAll(WORD, ctx.raw);
    // Need real volume of shouting, not one or two acronyms.
    if (capsWords.length < 4) return [];
    if (allWords.length === 0) return [];
    const ratio = capsWords.length / allWords.length;
    return ratio >= 0.5 ? capsWords : [];
  },
};

const charSubstitution: Rule = {
  id: "textual.char-substitution",
  category: "textual",
  weight: 30,
  reasonKey: "reasons.textual.charSubstitution",
  detect: (ctx: RuleContext) => {
    const spans = findAll(LEET_IN_TRIGGER, ctx.raw);
    // Guard: require an actual digit/symbol in the matched token.
    return spans.filter((s) => /[0-9@$3]/u.test(s.text));
  },
};

// Latin block and the confusable Cyrillic/Greek homoglyph letters.
const LATIN = /[A-Za-z]/u;
const CONFUSABLE = /[Ѐ-ӿͰ-Ͽ]/u; // Cyrillic + Greek

const homoglyphWord: Rule = {
  id: "textual.homoglyph-word",
  category: "textual",
  weight: 35,
  reasonKey: "reasons.textual.homoglyphWord",
  detect: (ctx: RuleContext) => {
    const spans: EvidenceSpan[] = [];
    // Split into whitespace-delimited tokens, tracking offsets.
    const tokenPattern = /\S+/gu;
    for (const match of ctx.raw.matchAll(tokenPattern)) {
      if (match.index === undefined) continue;
      const token = match[0];
      // Suspicious only when Latin and a confusable script mix in ONE word.
      if (LATIN.test(token) && CONFUSABLE.test(token)) {
        spans.push({
          start: match.index,
          end: match.index + token.length,
          text: token,
        });
      }
    }
    return spans;
  },
};

export const textualRules: readonly Rule[] = [
  excessiveCaps,
  charSubstitution,
  homoglyphWord,
];
