/**
 * ADVANCED TEXT NORMALIZER — v4
 *
 * Two normalization modes:
 *
 *  normalize()       — Standard form. Strips invisible/zero-width chars, decodes
 *                      leet, diacritics, unicode confusables, fullwidth, Cyrillic,
 *                      Greek. Collapses runs of 3+ identical chars → 2.
 *
 *  phonetic()        — Extended form. Runs normalize() then additionally applies
 *                      phonetic simplifications (ck→k, tch→ch, ph→f, wh→w, gh→g,
 *                      qu→k, x→ks) and collapses ALL remaining consecutive repeats → 1.
 *
 *  collapse()        — normalize() → strip all non-alpha. Spacing/punct bypass check.
 *
 *  phoneticCollapse()— phonetic() → strip all non-alpha. Phonetic spacing bypass check.
 */

// ── Invisible / zero-width characters that people insert to break detection ────
const INVISIBLE_PATTERN = /[\u0000-\u001F\u007F\u00AD\u034F\u115F\u1160\u17B4\u17B5\u180B-\u180E\u200B-\u200F\u202A-\u202F\u2060-\u2064\u206A-\u206F\uFEFF\uFFF0-\uFFFB]|[\uE0000-\uE007F]/gu;

const LEET_MAP: Record<string, string> = {
  // ── Classic leet / symbol substitutions ──────────────────────────────────────
  "@": "a", "4": "a", "^": "a",
  "3": "e", "€": "e",
  "1": "i", "!": "i", "|": "i",
  "0": "o", "°": "o",
  "$": "s", "5": "s",
  "+": "t", "7": "t",
  "#": "h",
  "*": "u",   // f*ck → fuck
  "%": "o",   // p%rn → porn
  "v": "u",   // fvck → fuck  (most common single-char bypass for u)
  "2": "z",   // rarely used but present in some bypasses
  "9": "g",   // 9 looks like g in some fonts
  "6": "b",   // 6 ≈ b visually
  "8": "b",   // 8 ≈ B visually
  "q": "k",   // niqqer bypass

  // ── Cyrillic look-alikes (visually identical to Latin) ────────────────────────
  "\u0430": "a", "\u0435": "e", "\u043E": "o", "\u0440": "p", "\u0441": "c",
  "\u0445": "x", "\u0456": "i", "\u0457": "i", "\u0451": "e",
  "\u0432": "b", "\u043D": "h", "\u0442": "t", "\u043A": "k",
  "\u0443": "u", "\u0421": "c", "\u0410": "a", "\u0412": "b",
  "\u0415": "e", "\u041A": "k", "\u041C": "m", "\u041D": "h",
  "\u041E": "o", "\u0420": "p", "\u0422": "t", "\u0425": "x",
  // Cyrillic п/П (pe) — looks exactly like Latin "n" — key n-word bypass vector
  "\u043F": "n", "\u041F": "n",
  // Cyrillic д/Д (de) → d
  "\u0434": "d", "\u0414": "d",
  // Cyrillic л/Л (el) → l
  "\u043B": "l", "\u041B": "l",
  // Cyrillic й/Й (short i) → i
  "\u0439": "i", "\u0419": "i",
  // Cyrillic ч/Ч (che) → ch (approximation: output 'c')
  "\u0447": "c", "\u0427": "c",

  // ── Greek look-alikes ──────────────────────────────────────────────────────────
  "\u03B1": "a", "\u03B5": "e", "\u03B9": "i", "\u03BF": "o",
  "\u03BD": "v", "\u03C1": "p", "\u03C4": "t", "\u03BA": "k",
  "\u0391": "a", "\u0395": "e", "\u0399": "i", "\u039F": "o",
  // Greek eta (η/Η) visually resembles "n" — primary n-word bypass vector
  "\u03B7": "n", "\u0397": "n",
  // Greek sigma (σ/Σ/ς) → s
  "\u03C3": "s", "\u03C2": "s", "\u03A3": "s",
  // Greek mu (μ) → m; nu (ν already mapped → v → u via second pass, intentional)
  "\u03BC": "m",
  // Greek upsilon variants
  "\u03C5": "u", "\u03A5": "u",

  // ── Fullwidth Latin (East-Asian input bypass) ─────────────────────────────────
  "\uFF41": "a", "\uFF42": "b", "\uFF43": "c", "\uFF44": "d", "\uFF45": "e",
  "\uFF46": "f", "\uFF47": "g", "\uFF48": "h", "\uFF49": "i", "\uFF4A": "j",
  "\uFF4B": "k", "\uFF4C": "l", "\uFF4D": "m", "\uFF4E": "n", "\uFF4F": "o",
  "\uFF50": "p", "\uFF51": "q", "\uFF52": "r", "\uFF53": "s", "\uFF54": "t",
  "\uFF55": "u", "\uFF56": "v", "\uFF57": "w", "\uFF58": "x", "\uFF59": "y",
  "\uFF5A": "z",
  // Fullwidth uppercase
  "\uFF21": "a", "\uFF22": "b", "\uFF23": "c", "\uFF24": "d", "\uFF25": "e",
  "\uFF26": "f", "\uFF27": "g", "\uFF28": "h", "\uFF29": "i", "\uFF2A": "j",
  "\uFF2B": "k", "\uFF2C": "l", "\uFF2D": "m", "\uFF2E": "n", "\uFF2F": "o",
  "\uFF30": "p", "\uFF31": "q", "\uFF32": "r", "\uFF33": "s", "\uFF34": "t",
  "\uFF35": "u", "\uFF36": "v", "\uFF37": "w", "\uFF38": "x", "\uFF39": "y",
  "\uFF3A": "z",

  // ── Superscript / subscript digits & letters ──────────────────────────────────
  "\u00B9": "1", "\u00B2": "2", "\u00B3": "3",
  "\u2070": "0", "\u2074": "4", "\u2075": "5", "\u2076": "6",
  "\u2077": "7", "\u2078": "8", "\u2079": "9",

  // ── Special Latin extensions ────────────────────────────────────────────────────
  "\u00DF": "ss",  // ß → ss
  "\u00E6": "ae",  // æ → ae
  "\u0153": "oe",  // œ → oe
  "\u00F8": "o",   // ø → o
  "\u00FE": "th",  // þ → th
  "\u00F0": "d",   // ð → d
  "\u0142": "l",   // ł → l
};

function stripInvisible(raw: string): string {
  return raw.replace(INVISIBLE_PATTERN, "");
}

function mapChar(c: string): string {
  return LEET_MAP[c] ?? c;
}

/**
 * Standard normalization:
 * 1. Strip invisible/zero-width characters
 * 2. Unicode NFD → strip combining diacritics
 * 3. Lowercase
 * 4. Map leet/confusable chars (single-char then multi-char expansions)
 * 5. Collapse runs of 3+ identical chars → 2
 */
export function normalize(raw: string): string {
  const noInvisible = stripInvisible(raw);
  const decomposed = noInvisible.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const lower = decomposed.toLowerCase();
  // First pass: single-char leet substitution
  const pass1 = lower.split("").map(mapChar).join("");
  // Second pass: re-apply leet map so multi-level substitutions resolve
  // e.g. Greek ν (U+03BD) → "v" (pass 1) → "u" (pass 2)
  //      Cyrillic В (U+0412) → "b" (pass 1) → "b" (no change, stable)
  const mapped = pass1.split("").map(mapChar).join("");
  // Collapse runs of 3+ same chars → 2
  return mapped.replace(/(.)\1{2,}/g, "$1$1");
}

/**
 * Phonetic normalization (bypass-hardened):
 * Runs normalize() then applies phonetic simplifications and
 * collapses ALL remaining consecutive repeats → 1.
 *
 * "fuuuuck"  → normalize → "fuuck"  → ck→k → "fuuk" → collapse → "fuk"
 * "bitch"    → normalize → "bitch"  → tch→ch         → collapse → "bich"
 * "phuck"    → normalize → "phuck"  → ph→f → ck→k    → collapse → "fuk"
 * "whore"    → normalize → "whore"  → wh→w            → collapse → "wore"
 * "queer"    → normalize → "queer"  → qu→k            → collapse → "ker"  (actually: ku→ker)
 */
export function phonetic(raw: string): string {
  return normalize(raw)
    .replace(/tch/g, "ch")    // bitch→bich
    .replace(/ck/g, "k")      // fuck→fuk, cock→cok
    .replace(/ph/g, "f")      // phuck→fuk
    .replace(/wh/g, "w")      // whore→wore, what→wat
    .replace(/gh/g, "g")      // ghetto→geto (avoids gh being silent)
    .replace(/qu/g, "k")      // queer→ker, quick→kik
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
 * "f.u.c.k" → "fuk",  "b i t c h" → "bich",  "ph.u.c.k" → "fuk"
 */
export function phoneticCollapse(raw: string): string {
  return phonetic(raw).replace(/[^a-z]/g, "");
}

/**
 * Standard tokens: normalize + split on non-alpha boundaries.
 * Minimum token length: 2 chars.
 */
export function tokenize(raw: string): string[] {
  return normalize(raw)
    .split(/[^a-z]+/)
    .filter((t) => t.length >= 2);
}

/**
 * Phonetic tokens: phonetic() + split on non-alpha boundaries.
 * Minimum token length: 2 chars.
 */
export function phoneticTokens(raw: string): string[] {
  return phonetic(raw)
    .split(/[^a-z]+/)
    .filter((t) => t.length >= 2);
}
