/**
 * ADVANCED TEXT NORMALIZER — v3
 *
 * Two normalization modes:
 *
 *  normalize()  — Standard form. Decodes leet, diacritics, unicode confusables.
 *                 Collapses runs of 3+ identical chars to 2 (preserves natural
 *                 doubles like "ll", "tt" while shrinking "fuuuuu" to "fuu").
 *                 Used for exact-word and spacing-bypass detection.
 *
 *  phonetic()   — Extended form. Runs normalize() then additionally applies
 *                 phonetic simplifications (ck→k, tch→ch, ph→f) and collapses
 *                 ALL remaining consecutive repeats to 1.
 *                 "fuuuuck" → "fuuck" → "fuuk" → "fuk"
 *                 "bitch"  → "bich"  (tch→ch)
 *                 "phuck"  → "fuk"   (ph→f, ck→k)
 *                 Used for phonetic-bypass detection.
 */

const LEET_MAP: Record<string, string> = {
  // Classic leet / symbol substitutions
  "@": "a", "4": "a", "^": "a",
  "3": "e", "€": "e",
  "1": "i", "!": "i", "|": "i",
  "0": "o",
  "$": "s", "5": "s",
  "+": "t", "7": "t",
  "#": "h",
  "*": "u",   // f*ck → fuck  (the most common profanity self-censor)
  "%": "o",   // p%rn → porn

  // Cyrillic confusables (visually identical to Latin)
  "а": "a", "е": "e", "о": "o", "р": "p", "с": "c",
  "х": "x", "і": "i", "ї": "i", "ё": "e",
  "в": "b", "н": "h", "т": "t", "к": "k",

  // Greek confusables
  "α": "a", "ε": "e", "ι": "i", "ο": "o",
  "ν": "v", "ρ": "p", "τ": "t", "κ": "k",

  // Fullwidth Latin (East-Asian bypass)
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
 * Standard normalization:
 * 1. Unicode NFD → strip combining diacritics
 * 2. Lowercase
 * 3. Map leet/confusable chars
 * 4. Collapse runs of 3+ identical chars to 2
 */
export function normalize(raw: string): string {
  const decomposed = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const lower = decomposed.toLowerCase();
  const mapped = lower.split("").map(mapChar).join("");
  return mapped.replace(/(.)\1{2,}/g, "$1$1");
}

/**
 * Phonetic normalization (bypass-hardened):
 * Runs normalize() then applies phonetic simplifications and
 * collapses ALL remaining consecutive repeats to 1.
 *
 * "fuuuuck"  → normalize → "fuuck"  → ck→k → "fuuk" → collapse → "fuk"
 * "bitch"    → normalize → "bitch"  → tch→ch         → collapse → "bich"
 * "phuck"    → normalize → "phuck"  → ph→f → ck→k    → collapse → "fuk"
 * "biiiitch" → normalize → "biitch" →                 → collapse → "bich"
 */
export function phonetic(raw: string): string {
  return normalize(raw)
    .replace(/tch/g, "ch")   // bitch→bich  (distinguishes from witch→wich ✓)
    .replace(/ck/g, "k")     // fuck→fuk
    .replace(/ph/g, "f")     // phuck→fuk
    .replace(/(.)\1+/g, "$1"); // collapse ALL remaining consecutive repeats → 1
}

/**
 * Collapsed form (spacing/punctuation bypass detection):
 * normalize() then remove every non-alpha character.
 * "n.i.g.g.a" → "nigga",  "f u c k" → "fuck"
 */
export function collapse(raw: string): string {
  return normalize(raw).replace(/[^a-z]/g, "");
}

/**
 * Phonetic collapsed form:
 * phonetic() then remove every non-alpha character.
 * "f.u.c.k" → "fuk",  "b i t c h" → "bich"
 */
export function phoneticCollapse(raw: string): string {
  return phonetic(raw).replace(/[^a-z]/g, "");
}

/**
 * Standard tokens: normalize + split on non-alpha boundaries.
 */
export function tokenize(raw: string): string[] {
  return normalize(raw)
    .split(/[^a-z]+/)
    .filter((t) => t.length >= 2);
}

/**
 * Phonetic tokens: phonetic() + split on non-alpha boundaries.
 */
export function phoneticTokens(raw: string): string[] {
  return phonetic(raw)
    .split(/[^a-z]+/)
    .filter((t) => t.length >= 2);
}
