import { collapse, tokenize } from "./normalizer.js";
import { HARD_SUBSTRINGS, EXACT_WORDS, REGEX_PATTERNS } from "./wordlist.js";

export interface DetectionResult {
  flagged: boolean;
  matchedTerm: string;
  method: "substring" | "word" | "regex";
}

// Pre-build structures at startup for O(1) / O(n) scanning performance
const HARD_SET = new Set(HARD_SUBSTRINGS);

/**
 * Scans a raw Discord message for hate speech, slurs, and their bypasses.
 * Returns null if clean; DetectionResult if flagged.
 *
 * Pipeline:
 *  1. Regex scan (catches complex structural bypasses first)
 *  2. Collapsed substring scan (catches spacing / punctuation bypasses)
 *  3. Token exact-word scan (catches short terms with word boundaries)
 */
export function scan(rawMessage: string): DetectionResult | null {
  // ── STAGE 1: Regex structural patterns ────────────────────────────────────
  for (const { pattern, label } of REGEX_PATTERNS) {
    if (pattern.test(rawMessage)) {
      return { flagged: true, matchedTerm: label, method: "regex" };
    }
  }

  // ── STAGE 2: Collapsed substring scan ─────────────────────────────────────
  const collapsed = collapse(rawMessage);
  for (const slur of HARD_SUBSTRINGS) {
    if (collapsed.includes(slur)) {
      return { flagged: true, matchedTerm: slur, method: "substring" };
    }
  }

  // ── STAGE 3: Token exact-word scan ────────────────────────────────────────
  const tokens = tokenize(rawMessage);
  for (const token of tokens) {
    if (EXACT_WORDS.has(token)) {
      return { flagged: true, matchedTerm: token, method: "word" };
    }
  }

  return null;
}
