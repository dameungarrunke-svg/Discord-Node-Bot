/**
 * ADVANCED TEXT NORMALIZER
 * Decodes leet speak, unicode confusables, symbol substitutions,
 * repeated chars, spacing bypasses, and diacritics so every message
 * is reduced to a canonical ASCII form before scanning.
 */

const CHAR_MAP: Record<string, string> = {
  // Number substitutions
  "0": "o", "1": "i", "2": "z", "3": "e", "4": "a",
  "5": "s", "6": "g", "7": "t", "8": "b", "9": "g",
  // Symbol substitutions
  "@": "a", "$": "s", "!": "i", "|": "l", "+": "t",
  "#": "h", "€": "e", "£": "e", "¥": "y", "©": "c",
  "®": "r", "ß": "s", "µ": "u", "×": "x", "÷": "d",
  // Cyrillic confusables (look like Latin letters)
  "а": "a", "е": "e", "о": "o", "р": "p", "с": "c",
  "х": "x", "і": "i", "ї": "i", "ё": "e", "у": "u",
  "в": "b", "н": "h", "т": "t", "к": "k", "м": "m",
  // Greek confusables
  "α": "a", "ε": "e", "ι": "i", "ο": "o", "υ": "u",
  "ν": "v", "η": "n", "ρ": "p", "τ": "t", "κ": "k",
  "β": "b", "γ": "g", "δ": "d", "ζ": "z", "θ": "th",
  "λ": "l", "ξ": "x", "π": "p", "σ": "s", "φ": "f",
  "χ": "x", "ψ": "ps", "ω": "o",
  // Extended Latin look-alikes
  "ä": "a", "á": "a", "â": "a", "à": "a", "ã": "a", "å": "a",
  "æ": "ae", "ç": "c", "é": "e", "è": "e", "ê": "e", "ë": "e",
  "í": "i", "ì": "i", "î": "i", "ï": "i", "ð": "d",
  "ñ": "n", "ó": "o", "ò": "o", "ô": "o", "õ": "o",
  "ö": "o", "ø": "o", "ú": "u", "ù": "u", "û": "u",
  "ü": "u", "ý": "y", "þ": "th", "ÿ": "y",
  // Fullwidth chars (common in East-Asian bypass attempts)
  "ａ": "a", "ｂ": "b", "ｃ": "c", "ｄ": "d", "ｅ": "e",
  "ｆ": "f", "ｇ": "g", "ｈ": "h", "ｉ": "i", "ｊ": "j",
  "ｋ": "k", "ｌ": "l", "ｍ": "m", "ｎ": "n", "ｏ": "o",
  "ｐ": "p", "ｑ": "q", "ｒ": "r", "ｓ": "s", "ｔ": "t",
  "ｕ": "u", "ｖ": "v", "ｗ": "w", "ｘ": "x", "ｙ": "y", "ｚ": "z",
};

/** Apply the character map to a single character */
function mapChar(c: string): string {
  return CHAR_MAP[c] ?? c;
}

/**
 * Full normalization pipeline:
 * 1. Unicode NFD decomposition → strip combining diacritics
 * 2. Lowercase
 * 3. Map confusable / leet / symbol chars
 * 4. Collapse consecutive identical chars (niiigga → niga)
 */
export function normalize(raw: string): string {
  const decomposed = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // strip combining diacritics

  const lower = decomposed.toLowerCase();

  const mapped = lower.split("").map(mapChar).join("");

  // Collapse runs of 3+ identical chars to 1 (niiig → nig)
  // Keeps natural doubles intact unless they run to 3+ (ll is fine, lll → l)
  return mapped.replace(/(.)\1{2,}/g, "$1");
}

/**
 * "Collapsed" form: normalize + remove every non-alpha character.
 * Catches spacing bypass (n i g g a → niga), punctuation bypass (n.i.g.g.a → niga).
 */
export function collapse(raw: string): string {
  return normalize(raw).replace(/[^a-z]/g, "");
}

/**
 * Tokenize: normalize and split on non-alpha boundaries.
 * Returns array of alpha-only tokens.
 */
export function tokenize(raw: string): string[] {
  return normalize(raw)
    .split(/[^a-z]+/)
    .filter((t) => t.length > 0);
}
