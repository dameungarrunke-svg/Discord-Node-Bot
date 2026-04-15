/**
 * MODERATION WORD DATABASE — v2 (False-Positive Safe)
 *
 * Ground rules for every entry:
 *  1. It must be unambiguously offensive with no common innocent meaning.
 *  2. If a word has a legitimate everyday use ("slope", "flip", "hoe", "guinea",
 *     "cracker", "idiot", "psycho", "queer", "gimp"...) it is NOT in this list.
 *  3. Compound/joined slurs (towelhead, kukluxklan) are safer for substring
 *     matching because they cannot appear accidentally in normal text.
 *  4. Short, ambiguous terms require exact whole-word token matching only.
 *
 * All entries are stored in NORMALIZED form (as they appear after running
 * through normalize()): lowercase, leet-decoded, diacritics stripped,
 * consecutive-triple-collapsed to double (niiig → niig, not nig).
 *
 * After normalization:
 *   "nigger" → "nigger" (gg stays as gg — only 3+ collapses)
 *   "faggot" → "faggot" (gg stays)
 *   "niggga" → "nigga" (3 g's → 2 g's)
 *
 * Two detection tiers:
 *
 *  HARD_SUBSTRINGS — substring scan on collapsed (space/punct-free) text.
 *    Used ONLY for compound, multi-part slurs that cannot appear inside
 *    innocent English words. Minimum effective length: 6 characters.
 *
 *  EXACT_WORDS — exact whole-word token match. Prevents partial matches
 *    (e.g., "spic" won't match "spicy", "coon" won't match "raccoon").
 */

// ─── TIER 1 — SUBSTRING SCAN ─────────────────────────────────────────────────
// These are compound/joined slurs safe for substring match because they will
// not accidentally appear inside normal English words.
export const HARD_SUBSTRINGS: ReadonlyArray<string> = [
  // ── N-WORD FAMILY (compound/joined forms) ─────────────────────────────────
  "nigga",        // catches: n i g g a, n.i.g.g.a, n!gga, niggga (3g→2g then match)
  "nigger",       // catches: n1gg3r, n-i-g-g-e-r (spacing bypass)
  "nigglet",
  "niglet",
  "jigaboo",
  "porchmonkey",
  "junglebunny",
  "tarbaby",

  // ── COMPOUND RACIAL SLURS ──────────────────────────────────────────────────
  "sandnigger",   // cannot appear in normal text as substring
  "sandnigga",
  "towelhead",
  "raghead",
  "cameljockey",
  "goatfucker",
  "zipperhead",
  "slopehead",    // compound — "slope" alone is NOT flagged
  "wagonburner",
  "halfbreed",
  "jewboy",
  "jewbitch",
  "niggerloving",

  // ── WHITE SUPREMACIST PHRASES ─────────────────────────────────────────────
  "kukluxklan",
  "whitepower",
  "whitepride",
  "whitesupremacy",
  "siegheil",
  "heilhitler",
  "rahowa",       // racial holy war
  "peckerwood",
  "neonazi",

  // ── HOMOPHOBIC / TRANSPHOBIC COMPOUND ────────────────────────────────────
  "faggot",       // f-a-g-g-o-t stays as "faggot" after normalize (gg stays)
  "shemale",
  "tranny",
  "fagboy",

  // ── ABLEIST COMPOUND ─────────────────────────────────────────────────────
  "retardo",
  "mongoloid",

  // ── SEXIST COMPOUND ──────────────────────────────────────────────────────
  "slutbag",
  "slutface",
  "whoreslut",
  "cuntface",
  "cunthole",
  "bitchslut",
  "skankwhore",

  // ── TARGETED HATE COMPOUND ────────────────────────────────────────────────
  "killyourself",
  "killallfags",
  "killallniggers",
  "deathtoniggers",
  "lynchnigger",

  // ── ANTISEMITIC COMPOUND ──────────────────────────────────────────────────
  "kikejew",
  "jewkike",
  "hebrewkike",
];

// ─── TIER 2 — EXACT WHOLE-WORD TOKEN MATCH ───────────────────────────────────
// Each entry matches only if it is a standalone word token, NOT a substring.
// "coon" will NOT trigger on "raccoon". "spic" will NOT trigger on "spicy".
export const EXACT_WORDS: ReadonlySet<string> = new Set([
  // ── N-WORD VARIANTS ────────────────────────────────────────────────────────
  "nigga", "nigger", "nigg", "nig",
  "niggaz", "niggas", "niggers",
  "niglet", "nigglet",
  "nigguh",
  "niqqer", "niqqa",   // q-based bypass
  "nigro",
  "wigger", "wigga",   // white + n-word hybrid slur

  // ── RACIAL SLURS ──────────────────────────────────────────────────────────
  "chink", "chinks",
  "gook", "gooks",
  "spic", "spick",
  "wetback", "wetbacks",
  "beaner", "beaners",
  "darkie", "darky",
  "paki", "pakis",
  "polack",
  "wop", "wops",
  "dago", "dagos",
  "jap", "japs",
  "chinaman",
  "injun",
  "squaw",
  "redskin",
  "sambo",
  "jigaboo",
  "schvartze",        // Yiddish-origin anti-Black term
  "dindu",            // "dindu nuffin" — racist dog whistle
  "sheboon",          // anti-Black racial slur
  "kike", "kikes",
  "heeb",
  "hymie",
  "sheeny",
  "yid", "yids",
  "muzzie",
  "muzzies",
  "raghead",
  "towelhead",

  // ── HOMOPHOBIC / TRANSPHOBIC ──────────────────────────────────────────────
  "fag", "fags",
  "faggot", "faggots",
  "fagot",            // alternate spelling used as slur
  "dyke", "dykes",
  "tranny",
  "shemale",
  "sodomite",
  "poofter",
  "batyman",          // Caribbean anti-gay slur

  // ── ABLEIST SLURS ─────────────────────────────────────────────────────────
  "retard", "retards",
  "retarded",
  "tard",
  "spaz",
  "spastic",
  "mongoloid",

  // ── SEXIST / MISOGYNISTIC SLURS ───────────────────────────────────────────
  "slut", "sluts",
  "skank", "skanks",
  "whore", "whores",
  "cunt", "cunts",
  "twat", "twats",
  "thot",
  "sloot",

  // ── ANTISEMITIC SLURS ─────────────────────────────────────────────────────
  "kike",
  "yid",
  "heeb",
  "hymie",
  "sheeny",
  "jewbag",

  // ── ISLAMOPHOBIC SLURS ────────────────────────────────────────────────────
  "muzzie",

  // ── WHITE SUPREMACIST TERMS ───────────────────────────────────────────────
  "rahowa",
  "groyper",     // white nationalist self-identifier
  "zog",         // "Zionist Occupational Government" — antisemitic code

  // ── SELF-HARM ENCOURAGEMENT ───────────────────────────────────────────────
  "kys",         // "kill yourself"
]);

// ─── TIER 3 — REGEX PATTERNS ─────────────────────────────────────────────────
// For structural bypasses where someone spaces/symbols out each letter.
// These patterns require a minimum word-context to fire.
export const REGEX_PATTERNS: ReadonlyArray<{ pattern: RegExp; label: string }> = [
  // N-word with separator characters between each letter
  // Must be anchored at a word boundary or non-alpha on both sides
  {
    pattern: /(?<![a-z])n[\W_]{0,2}[i1!][\W_]{0,2}g[\W_]{0,2}g[\W_]{0,2}[ae@4](?![a-z])/i,
    label: "n-word (letter-separator bypass)",
  },
  // "Kill yourself" spelled with separators
  {
    pattern: /k[\W_]{0,2}[i1][\W_]{0,2}l[\W_]{0,2}l[\W_]{0,2}y[\W_]{0,2}[o0][\W_]{0,2}u[\W_]{0,2}r[\W_]{0,2}s[\W_]{0,2}e[\W_]{0,2}l[\W_]{0,2}f/i,
    label: "self-harm encouragement (bypass)",
  },
  // Heil Hitler with separators
  {
    pattern: /h[\W_]{0,2}e[\W_]{0,2}[i1][\W_]{0,2}l[\W_]{0,3}h[\W_]{0,2}[i1][\W_]{0,2}t[\W_]{0,2}l[\W_]{0,2}e[\W_]{0,2}r/i,
    label: "nazi salute (bypass)",
  },
  // White power / white pride with separators
  {
    pattern: /w[\W_]{0,2}h[\W_]{0,2}[i1][\W_]{0,2}t[\W_]{0,2}e[\W_]{0,3}(p[\W_]{0,2}[o0][\W_]{0,2}w[\W_]{0,2}e[\W_]{0,2}r|p[\W_]{0,2}r[\W_]{0,2}[i1][\W_]{0,2}d[\W_]{0,2}e)/i,
    label: "white supremacist phrase (bypass)",
  },
  // 1488 or 14/88 white supremacist numeric codes
  {
    pattern: /\b(14\s*[\/\-]?\s*88|88\s*[\/\-]?\s*14|1488)\b/,
    label: "white supremacist code (14/88)",
  },
];

// ─── SAFE WORD WHITELIST ──────────────────────────────────────────────────────
// Normalized tokens that should NEVER trigger the filter regardless of list
// matches. Prevents false positives for names, places, and common words that
// overlap with slur forms after normalization.
export const SAFE_TOKENS: ReadonlySet<string> = new Set([
  // Geographic names
  "nigeria", "nigerian", "nigerien",    // Niger the country → token "niger" is edge case
  "niger",                               // When typed as country name (will still match exact word "niger" — acceptable edge case for a moderation bot)

  // Common words that share normalized form with items above
  // (None needed right now because we removed all ambiguous terms)
]);
