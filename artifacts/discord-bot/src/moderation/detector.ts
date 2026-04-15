import { collapse, tokenize } from "./normalizer.js";
import { HARD_SUBSTRINGS, EXACT_WORDS, REGEX_PATTERNS, SAFE_TOKENS } from "./wordlist.js";

export interface DetectionResult {
  flagged: boolean;
  matchedTerm: string;
  method: "substring" | "word" | "regex";
}

/**
 * Scans a raw Discord message for hate speech, slurs, and bypasses.
 * Returns null if clean, DetectionResult if a violation is found.
 *
 * Detection pipeline (ordered by specificity):
 *  1. Regex structural patterns   — catches explicit letter-separator bypasses
 *  2. Collapsed substring scan    — catches spacing/punctuation bypasses for
 *                                   compound, unambiguous slurs only
 *  3. Exact whole-word token scan — catches standalone slur words with
 *                                   proper word-boundary enforcement
 *
 * Safety guarantees:
 *  • Tier 2 (substring) only matches entries ≥ 5 chars to prevent short
 *    patterns from matching inside innocent words
 *  • Tier 3 (word) requires the full token to equal the slur — "raccoon" will
 *    NOT trigger "coon", "spicy" will NOT trigger "spic"
 *  • SAFE_TOKENS whitelist exempts known false-positive tokens
 */
export function scan(rawMessage: string): DetectionResult | null {
  // ── STAGE 1: Regex structural patterns ────────────────────────────────────
  // These patterns already include their own boundary/context logic.
  for (const { pattern, label } of REGEX_PATTERNS) {
    if (pattern.test(rawMessage)) {
      return { flagged: true, matchedTerm: label, method: "regex" };
    }
  }

  // ── STAGE 2: Collapsed substring scan ─────────────────────────────────────
  // Only applied to compound/joined slurs from HARD_SUBSTRINGS.
  // Only match terms ≥ 5 chars to avoid accidental fragment matches.
  const collapsed = collapse(rawMessage);
  for (const slur of HARD_SUBSTRINGS) {
    if (slur.length >= 5 && collapsed.includes(slur)) {
      return { flagged: true, matchedTerm: slur, method: "substring" };
    }
  }

  // ── STAGE 3: Exact whole-word token scan ──────────────────────────────────
  const tokens = tokenize(rawMessage);
  for (const token of tokens) {
    // Skip if the token is on the safe whitelist
    if (SAFE_TOKENS.has(token)) continue;

    if (EXACT_WORDS.has(token)) {
      return { flagged: true, matchedTerm: token, method: "word" };
    }
  }

  return null;
}
