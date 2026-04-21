import {
  collapse,
  phonetic,
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
  SUBSTRING_CORES,
} from "./wordlist.js";

/**
 * Phonetic forms of SUBSTRING_CORES that are safe for substring matching.
 *
 * Computed once at module load. Only forms that are:
 *  - ≥ 5 chars in their phonetic canonical form (short forms risk false positives)
 *  - Not known to appear inside innocent English words
 *
 * Skipped: "niger" (in "nigeria"), "fagot"/"fagots" (British cooking term),
 *           "wore" (past tense of wear), "niga" (4 chars — too short),
 *           "bich" (4 chars), "pusy" (4 chars), "pis" (3 chars).
 */
const PHONETIC_SAFE_SKIP = new Set([
  "niger", "niga", "fagot", "fagots", "wore", "bich", "pusy", "pis",
  "kunt", "twat", "wank", "slut", "thot",  // 4-char forms — too short
]);

const PHONETIC_SUBSTRING_CORES: ReadonlyArray<string> = [
  ...new Set(
    SUBSTRING_CORES
      .map((c) => phonetic(c))
      .filter((p) => p.length >= 5 && !PHONETIC_SAFE_SKIP.has(p))
  ),
];

export type DetectionMethod =
  | "regex"
  | "substring"
  | "phonetic-substring"
  | "word"
  | "compound"       // a censored word found INSIDE a larger token (e.g. faceretarded)
  | "phonetic";

export interface DetectionResult {
  flagged: boolean;
  matchedTerm: string;
  method: DetectionMethod;
  /** The normalized/collapsed form that triggered the match (for mod logs). */
  normalizedForm?: string;
}

/**
 * SIX-STAGE SCANNER
 *
 * Stage 1  — Regex structural patterns (symbol/separator bypasses)
 * Stage 2  — Collapsed substring scan: HARD_SUBSTRINGS + SUBSTRING_CORES
 *              Catches spacing bypasses AND compound words in one pass.
 *              e.g. "f.u.c.k.f.a.c.e" → collapse → "fuckface" → flagged
 * Stage 3  — Phonetic collapsed substring scan (PHONETIC_HARD_SUBSTRINGS)
 *              Catches phonetic + spacing combined bypasses.
 * Stage 4  — Exact whole-word token match (EXACT_WORDS)
 *              "spicy" ≠ "spic" — word boundary is respected.
 * Stage 4b — Compound token scan (SUBSTRING_CORES inside each token)
 *              If a token CONTAINS a flagged core word it is caught here.
 *              e.g. token "faceretarded" contains "retarded" → flagged.
 *              e.g. token "dickheadlol"  contains "dickhead"  → flagged.
 * Stage 5  — Phonetic whole-word token scan (PHONETIC_WORDS)
 *              Catches leet-speak and phonetic variants: fvck→fuk, biitch→bich.
 *
 * False-positive safety:
 *   • SUBSTRING_CORES only contains words ≥ 4 chars that never appear inside
 *     innocent English compound words (excludes "cock", "dick", "ass", "arse", etc.)
 *   • SAFE_TOKENS whitelist prevents known innocent tokens from ever matching.
 *   • Stage 4 exact-match and Stage 5 require the full token to match.
 */
export function scan(rawMessage: string): DetectionResult | null {
  // ── Stage 1: Regex structural patterns ──────────────────────────────────────
  for (const { pattern, label } of REGEX_PATTERNS) {
    if (pattern.test(rawMessage)) {
      return { flagged: true, matchedTerm: label, method: "regex" };
    }
  }

  // ── Stage 2: Collapsed substring scan ───────────────────────────────────────
  // Checks the full message (all spaces/punctuation stripped) against:
  //   a) HARD_SUBSTRINGS — long compound slurs
  //   b) SUBSTRING_CORES — core profanity words (safe to substring-check)
  // This catches: spacing bypasses, punctuation bypasses, and compound words
  // where the profanity is attached to other text (facefuck, asshole123, etc.)
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

  for (const core of SUBSTRING_CORES) {
    if (collapsed.includes(core)) {
      return {
        flagged: true,
        matchedTerm: core,
        method: "substring",
        normalizedForm: collapsed,
      };
    }
  }

  // ── Stage 2b: Phonetic SUBSTRING_CORES vs phonetic-collapsed full message ────
  // Catches phonetic bypasses embedded in compound words.
  // e.g. "phuckingidiot" → phoneticCollapse → "fukingidiot" → contains "fuking" ✓
  // e.g. "motherphuker"  → phoneticCollapse → "motherfuker"  → contains "motherfuker" ✓
  // e.g. "total-phuck-up" → phoneticCollapse → "totalfukup" → contains "fuk"... but
  //       "fuk" is only 3 chars and filtered in PHONETIC_SUBSTRING_CORES (min 5). Fine.
  const pCollapsed = phoneticCollapse(rawMessage);
  for (const pCore of PHONETIC_SUBSTRING_CORES) {
    if (pCollapsed.includes(pCore)) {
      return {
        flagged: true,
        matchedTerm: pCore,
        method: "phonetic-substring",
        normalizedForm: pCollapsed,
      };
    }
  }

  // ── Stage 3: Phonetic collapsed substring scan ───────────────────────────────
  // (PHONETIC_HARD_SUBSTRINGS — manually curated phonetic compound slurs)
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

    // 4a — Exact match
    if (EXACT_WORDS.has(token)) {
      return {
        flagged: true,
        matchedTerm: token,
        method: "word",
        normalizedForm: token,
      };
    }

    // 4b — Compound match: does this token CONTAIN a flagged core word?
    // e.g. "faceretarded" contains "retarded", "yourselfisafuckingidiot" contains "fucking"
    if (token.length > 4) {
      for (const core of SUBSTRING_CORES) {
        if (token.includes(core)) {
          return {
            flagged: true,
            matchedTerm: `${core} (in "${token}")`,
            method: "compound",
            normalizedForm: token,
          };
        }
      }
    }

    // 4c — Phonetic compound: does the PHONETIC form of this token contain a phonetic core?
    // Catches leet/phonetic variants embedded inside a larger word.
    // e.g. "phuckinghell" → token "phuckinghell" → phonetic → "fukinghel" → contains "fuking" ✓
    // e.g. "totalphuck"   → token "totalphuck"   → phonetic → "totalfuk"  → contains "fuk" (skipped, 3 chars)
    // e.g. "wankerfest"   → token "wankerfest"   → phonetic → "wankerfest" → contains "wanker" ✓
    if (token.length > 4) {
      const pToken = phonetic(token);
      for (const pCore of PHONETIC_SUBSTRING_CORES) {
        if (pToken.includes(pCore)) {
          return {
            flagged: true,
            matchedTerm: `${pCore} (phonetic in "${token}")`,
            method: "compound",
            normalizedForm: pToken,
          };
        }
      }
    }
  }

  // ── Stage 5: Phonetic whole-word token scan ───────────────────────────────────
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
