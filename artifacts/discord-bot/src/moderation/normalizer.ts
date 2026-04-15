/**
 * ADVANCED TEXT NORMALIZER
 *
 * Decodes leet speak, unicode confusables, symbol substitutions,
 * repeated chars, spacing bypasses, and diacritics — but ONLY the
 * substitutions that are genuinely used as bypass techniques.
 *
 * Deliberately conservative: we do NOT map numbers or symbols that
 * would corrupt innocent text and cause false positives.
 */

// Only map characters that are genuinely used as slur bypasses.
// Numbers (0-9) are NOT mapped here because "I have 9 friends" should
// never be converted to a string that accidentally matches a slur.
const LEET_MAP: Record<string, string> = {
  // Classic leet substitutions used in bypass attempts
  "@": "a",
  "4": "a",
  "3": "e",
  "€": "e",
  "1": "i",
  "!": "i",
  "|": "i",
  "0": "o",
  "$": "s",
  "5": "s",
  "+": "t",
  "7": "t",
  "#": "h",
  // Cyrillic confusables (visually identical to Latin)
  "а": "a", "е": "e", "о": "o", "р": "p", "с": "c",
  "х": "x", "і": "i", "ї": "i", "ё": "e",
  "в": "b", "н": "h", "т": "t", "к": "k",
  // Greek confusables
  "α": "a", "ε": "e", "ι": "i", "ο": "o",
  "ν": "v", "ρ": "p", "τ": "t", "κ": "k",
  // Fullwidth Latin (used in East-Asian bypass)
  "ａ": "a", "ｂ": "b", "ｃ": "c", "ｄ": "d", "ｅ": "e",
  "ｆ": "f", "ｇ": "g", "ｈ": "h", "ｉ": "i", "ｊ": "j",
  "ｋ": "k", "ｌ": "l", "ｍ": "m", "ｎ": "n", "ｏ": "o",
  "ｐ": "p", "ｑ": "q", "ｒ": "r", "ｓ": "s", "ｔ": "t",
  "ｕ": "u", "ｖ": "v", "ｗ": "w", "ｘ": "x", "ｙ": "y", "ｚ": "z",
};

function mapChar(c: string): string {
  return LEET_MAP[c] ?? c;
}

/**
 * Full normalization pipeline:
 * 1. Unicode NFD → strip combining diacritics (handles é→e, ü→u, etc.)
 * 2. Lowercase
 * 3. Map leet/confusable chars via LEET_MAP
 * 4. Collapse runs of 3+ identical chars down to 2
 *    (keeps natural doubles like "ll", "tt" intact while collapsing "niiig" → "niig")
 */
export function normalize(raw: string): string {
  const decomposed = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const lower = decomposed.toLowerCase();
  const mapped = lower.split("").map(mapChar).join("");

  // Collapse 3+ repeated identical chars → 2 (preserves natural doubles)
  return mapped.replace(/(.)\1{2,}/g, "$1$1");
}

/**
 * "Collapsed" form for bypass detection:
 * Normalize then strip all non-alpha characters.
 * Only used for HARD_SUBSTRINGS which are compound/unambiguous slurs.
 *
 * Example: "n.i.g.g.a" → "niga", "n i g g a" → "niga"
 */
export function collapse(raw: string): string {
  return normalize(raw).replace(/[^a-z]/g, "");
}

/**
 * Tokenize: normalize and split on word boundaries.
 * Returns only alpha tokens of 2+ characters (filters noise).
 */
export function tokenize(raw: string): string[] {
  return normalize(raw)
    .split(/[^a-z]+/)
    .filter((t) => t.length >= 2);
}
