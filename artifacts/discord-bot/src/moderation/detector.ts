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

/**
 * Dedup-normalized forms of all banned word cores.
 *
 * Computed once at module load.
 * Each word has every run of consecutive identical characters collapsed to ONE.
 *   "nigger"  → "niger"    ← catches "Niggeer", "niggger", "niGGeer"
 *   "nigga"   → "niga"     ← catches "Niggaa", "niigga"
 *   "faggot"  → "fagot"    ← catches "faggoot"
 *   "asshole" → "ashole"   ← catches "assshole"
 *   "fuck"    → "fuck"     ← no consecutive repeats, unchanged
 *
 * Used in Stage 4d (per-token dedup scan).
 * The Stage 4d guard `/(.)\1/.test(token)` ensures Stage 4d only runs on
 * tokens that actually contain repeated characters, preventing false positives
 * from innocent words like "Niger" (no consecutive repeats → guard fails → skip).
 */
const DEDUP_CORES_SET: ReadonlySet<string> = new Set([
  ...HARD_SUBSTRINGS
    .filter((w) => w.length >= 4)
    .map((w) => w.replace(/(.)\1+/g, "$1")),
  ...SUBSTRING_CORES
    .map((w) => w.replace(/(.)\1+/g, "$1")),
]);

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
  try {
    return _scan(rawMessage);
  } catch (err: any) {
    console.error(`[SCAN ERROR] scan() threw unexpectedly: ${err?.message ?? err}\nInput: ${rawMessage.slice(0, 120)}`);
    return null;
  }
}

/**
 * Inline normalization that does NOT depend on the normalizer.ts functions.
 *
 * Step 1 — lowercase
 * Step 2 — strip every non-[a-z] character
 * Step 3 — collapse ALL consecutive runs of the same char to ONE char
 *
 * This is the "user's approach": remove symbols, reduce repeated letters.
 * e.g. "Niggeer"  → "niggeer"  → "niger"
 *      "Niggerrr" → "niggerrr" → "niger"
 *      "Fuckslang"→ "fuckslang"→ "fuckslang" (no consecutive repeats)
 *      "F.u.c.k"  → "fuck"     → "fuck"
 *      "fu u c k" → "fuck"     → "fuck"
 */
function inlineNorm(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z]/g, "").replace(/(.)\1+/g, "$1");
}

/**
 * Split the lowercase message into words on non-letter boundaries.
 * Same as tokenize() but inline — does not depend on normalizer import.
 * Also applies basic single-pass phonetic substitution so that:
 *   "phuck"  → "fuck"   (ph→f bypass)
 *   "phucking"→ "fucking"
 */
function inlineWords(raw: string): string[] {
  return raw.toLowerCase()
    .replace(/ph/g, "f")   // ph→f phonetic substitution
    .split(/[^a-z]+/)
    .filter((w) => w.length >= 2);
}

function _scan(rawMessage: string): DetectionResult | null {
  // ── Stage 1: Regex structural patterns (symbol / separator bypasses) ─────────
  // These operate directly on the raw string. They work correctly regardless of
  // the normalizer state.
  for (const { pattern, label } of REGEX_PATTERNS) {
    if (pattern.test(rawMessage)) {
      return { flagged: true, matchedTerm: label, method: "regex" };
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Stage 2: Per-word dedup scan (INLINE — does NOT call normalizer functions)
  //
  // For each whitespace/punctuation-separated word in the message:
  //   1. Lowercase + strip non-alpha  →  canonical word
  //   2. If canonical word is in SAFE_TOKENS → skip (false-positive gate)
  //   3. Collapse ALL consecutive same chars to 1 (aggressive dedup)
  //   4. Check if deduped word contains any entry in DEDUP_CORES_SET
  //
  // Why per-word and not full-message?
  //   Full-message collapse of "I am from Nigeria" → "iamfromnigeria" → contains
  //   "niger" → false positive.  Per-word + SAFE_TOKENS prevents this:
  //   "nigeria" is in SAFE_TOKENS → skipped → no false positive.
  //
  // Examples:
  //   "Niggeer"   → lower+strip → "niggeer" → not SAFE → dedup → "niger"
  //                → DEDUP_CORES_SET has "niger" (from "nigger") → FLAGGED ✓
  //   "Niggerrr"  → "niggerrr" → dedup → "niger"   → FLAGGED ✓
  //   "Fuckslang" → "fuckslang" → dedup → "fuckslang" (no repeats)
  //                → "fuckslang".includes("fuck") → FLAGGED ✓
  //   "Choicefuck"→ "choicefuck" → dedup → "choicefuck"
  //                → includes "fuck" → FLAGGED ✓
  //   "Retarded"  → "retarded" → dedup → "retarded"
  //                → includes "retard" → FLAGGED ✓
  //   "Niger"     → "niger" → SAFE_TOKENS → skip ✓
  //   "Nigeria"   → "nigeria" → SAFE_TOKENS → skip ✓
  // ──────────────────────────────────────────────────────────────────────────────
  const words = inlineWords(rawMessage);
  for (const word of words) {
    if (SAFE_TOKENS.has(word)) continue;

    // Dedup: collapse ALL consecutive same chars to 1
    const deduped = word.replace(/(.)\1+/g, "$1");

    for (const dCore of DEDUP_CORES_SET) {
      if (deduped.includes(dCore)) {
        return {
          flagged: true,
          matchedTerm: `${dCore} (dedup in "${word}")`,
          method: "compound",
          normalizedForm: deduped,
        };
      }
    }
  }

  // ── Stage 3: Full-message collapsed substring scan (INLINE) ──────────────────
  // Strips ALL non-alpha characters from the entire message and checks for banned
  // words.  This catches spacing and punctuation bypasses: "f.u.c.k" → "fuck".
  // Note: does NOT dedup here because dedup on full message creates false positives
  // ("nigeria" → "niger" after dedup if typed in a sentence).
  // SUBSTRING_CORES entries are safe substring targets (they never appear inside
  // innocent compound words: see wordlist.ts).
  const stripped = rawMessage.toLowerCase().replace(/ph/g, "f").replace(/[^a-z]/g, "");

  for (const core of SUBSTRING_CORES) {
    if (stripped.includes(core)) {
      return {
        flagged: true,
        matchedTerm: core,
        method: "substring",
        normalizedForm: stripped,
      };
    }
  }

  for (const slur of HARD_SUBSTRINGS) {
    if (slur.length >= 5 && stripped.includes(slur)) {
      return {
        flagged: true,
        matchedTerm: slur,
        method: "substring",
        normalizedForm: stripped,
      };
    }
  }

  // ── Stage 4: Exact word match (INLINE) ───────────────────────────────────────
  // Per-word exact match against EXACT_WORDS set. Uses inline word splitting to
  // avoid dependency on normalizer.ts.
  for (const word of words) {
    if (SAFE_TOKENS.has(word)) continue;
    if (EXACT_WORDS.has(word)) {
      return {
        flagged: true,
        matchedTerm: word,
        method: "word",
        normalizedForm: word,
      };
    }
  }

  // ── Stage 5: Phonetic stages (wrapped in try/catch) ──────────────────────────
  // These call the normalizer functions. If the normalizer is broken, the
  // try/catch ensures we fail gracefully without losing Stages 1–4 detections.
  try {
    const pCollapsed = phoneticCollapse(rawMessage);
    if (pCollapsed.length > 0) {
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
    }

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
  } catch (err: any) {
    console.warn(`[SCAN] Phonetic stage failed (non-fatal): ${err?.message ?? err}`);
  }

  return null;
}
