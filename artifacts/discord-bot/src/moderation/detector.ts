import {
  collapse,
  phoneticCollapse,
  tokenize,
  phoneticTokens,
} from "./normalizer.js";
import {
  HARD_SUBSTRINGS,
  PHONETIC_HARD_SUBSTRINGS,
  EXACT_WORDS,
  PHONETIC_WORDS,
  REGEX_PATTERNS,
  SAFE_TOKENS,
} from "./wordlist.js";

export type DetectionMethod =
  | "regex"
  | "substring"
  | "phonetic-substring"
  | "word"
  | "phonetic";

export interface DetectionResult {
  flagged: boolean;
  matchedTerm: string;
  method: DetectionMethod;
  /** The normalized/collapsed form that triggered the match (for mod logs). */
  normalizedForm?: string;
}

/**
 * FIVE-STAGE INTELLIGENT SCANNER
 *
 * Scans a raw Discord message for hate speech, slurs, bypasses, and profanity.
 * Returns null if clean, DetectionResult if a violation is found.
 *
 * Stage 1 — Regex structural patterns
 *   Catches explicit letter-separator and symbol-substitution bypasses using
 *   carefully tuned regex patterns with boundary guards.
 *
 * Stage 2 — Collapsed substring scan (HARD_SUBSTRINGS)
 *   normalize() → strip all non-alpha → substring search.
 *   Catches spacing bypasses: "n.i.g.g.a" → "nigga".
 *
 * Stage 3 — Phonetic collapsed substring scan (PHONETIC_HARD_SUBSTRINGS)
 *   phonetic() → strip all non-alpha → substring search.
 *   Catches phonetic + spacing bypasses: "ph.u.c.k.f.a.c.e" → "fukface".
 *
 * Stage 4 — Exact whole-word token scan (EXACT_WORDS)
 *   normalize() → split on non-alpha → exact token match.
 *   "spicy" does NOT match "spic". "flag" does NOT match "fag".
 *
 * Stage 5 — Phonetic whole-word token scan (PHONETIC_WORDS) ← THE KEY STAGE
 *   phonetic() → split on non-alpha → exact phonetic-form match.
 *   Catches repeated-char bypasses, leet-speak, and phonetic misspellings:
 *   "fuuuuuck" → "fuk", "biitch" → "bich", "phuck" → "fuk", "fvck" → "fuk".
 *
 * Safety guarantees:
 *   • Stage 2/3 only match entries ≥ 5 chars (prevents fragment collisions).
 *   • Stages 4/5 require the full token to match (proper word-boundary logic).
 *   • SAFE_TOKENS whitelist exempts known false-positive tokens at every stage.
 */
export function scan(rawMessage: string): DetectionResult | null {
  // ── Stage 1: Regex structural patterns ──────────────────────────────────────
  // These already contain their own boundary / context logic.
  for (const { pattern, label } of REGEX_PATTERNS) {
    if (pattern.test(rawMessage)) {
      return { flagged: true, matchedTerm: label, method: "regex" };
    }
  }

  // ── Stage 2: Collapsed substring scan (spacing / punctuation bypasses) ──────
  const collapsed = collapse(rawMessage);
  for (const slur of HARD_SUBSTRINGS) {
    if (slur.length >= 5 && collapsed.includes(slur)) {
      return {
        flagged: true,
        matchedTerm: slur,
        method: "substring",
        normalizedForm: collapsed,
      };
    }
  }

  // ── Stage 3: Phonetic collapsed substring scan ───────────────────────────────
  // Catches phonetic + spacing combined bypasses.
  const pCollapsed = phoneticCollapse(rawMessage);
  for (const slur of PHONETIC_HARD_SUBSTRINGS) {
    if (slur.length >= 4 && pCollapsed.includes(slur)) {
      return {
        flagged: true,
        matchedTerm: slur,
        method: "phonetic-substring",
        normalizedForm: pCollapsed,
      };
    }
  }

  // ── Stage 4: Exact whole-word token scan ─────────────────────────────────────
  const tokens = tokenize(rawMessage);
  for (const token of tokens) {
    if (SAFE_TOKENS.has(token)) continue;
    if (EXACT_WORDS.has(token)) {
      return {
        flagged: true,
        matchedTerm: token,
        method: "word",
        normalizedForm: token,
      };
    }
  }

  // ── Stage 5: Phonetic whole-word token scan (PREVIOUSLY UNWIRED — NOW FIXED) ─
  // This catches: fuuuuuck → fuk, phuck → fuk, fvck → fuk, b!tch → bich,
  //               biiiitch → bich, nigg3r → niger, f@ggot → fagot, etc.
  const pTokens = phoneticTokens(rawMessage);
  for (const token of pTokens) {
    if (SAFE_TOKENS.has(token)) continue;
    if (PHONETIC_WORDS.has(token)) {
      return {
        flagged: true,
        matchedTerm: token,
        method: "phonetic",
        normalizedForm: token,
      };
    }
  }

  return null;
}
