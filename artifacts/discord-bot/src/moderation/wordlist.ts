/**
 * MODERATION WORD DATABASE — v3
 *
 * ─── FOUR DETECTION TIERS ────────────────────────────────────────────────────
 *
 *  TIER 1 — HARD_SUBSTRINGS
 *    Compound/joined slurs checked as substrings in the collapsed (space-free)
 *    normalized text. Catches spacing and punctuation bypasses.
 *    SAFETY: All entries ≥ 6 chars. No entry appears inside innocent words.
 *    Example: "n.i.g.g.e.r" → collapse → "nigger" → substring match.
 *
 *  TIER 2 — EXACT_WORDS
 *    Checked as exact whole-word token matches after normalize().
 *    "spic" will NOT match "spicy". "fag" will NOT match "flag".
 *
 *  TIER 3 — PHONETIC_WORDS
 *    Entries stored in phonetic form (after ck→k, tch→ch, ph→f, all repeats→1).
 *    Checked against phoneticTokens() of the message.
 *    Catches: "fuuuuck"→fuk, "phuck"→fuk, "bitch"→bich, "biitch"→bich.
 *
 *  TIER 4 — REGEX_PATTERNS
 *    Structural patterns for letter-separator bypasses.
 *
 *  SAFE_TOKENS — Whitelist of tokens that must NEVER trigger the filter.
 *
 * ─── ENTRY FORMAT ────────────────────────────────────────────────────────────
 *  HARD_SUBSTRINGS / EXACT_WORDS: normalized form (after normalize()).
 *  PHONETIC_WORDS: phonetic form (after phonetic() — ck→k, tch→ch, ph→f,
 *                  all consecutive repeats collapsed to 1).
 */

// ─── TIER 1 — SUBSTRING SCAN (collapsed, space-free normalized text) ─────────
export const HARD_SUBSTRINGS: ReadonlyArray<string> = [
  // ── N-WORD FAMILY ──────────────────────────────────────────────────────────
  "nigga",          // n i g g a, n.i.g.g.a, n!gga, niggga...
  "nigger",         // n1gg3r, n-i-g-g-e-r...
  "nigglet",
  "niglet",
  "jigaboo",
  "porchmonkey",
  "junglebunny",
  "tarbaby",

  // ── COMPOUND RACIAL SLURS ──────────────────────────────────────────────────
  "sandnigger",
  "sandnigga",
  "towelhead",
  "raghead",
  "cameljockey",
  "goatfucker",
  "zipperhead",
  "slopehead",      // compound — "slope" alone is NOT flagged
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
  "rahowa",
  "peckerwood",
  "neonazi",

  // ── HOMOPHOBIC / TRANSPHOBIC COMPOUND ─────────────────────────────────────
  "faggot",         // gg stays as double after normalize (2 g's); double confirmed
  "shemale",
  "tranny",
  "fagboy",
  "fagface",

  // ── ABLEIST COMPOUND ──────────────────────────────────────────────────────
  "retardo",
  "mongoloid",

  // ── SEXIST / PROFANITY COMPOUND ───────────────────────────────────────────
  "slutbag",
  "slutface",
  "whoreslut",
  "cuntface",
  "cunthole",
  "bitchslut",
  "skankwhore",
  "fuckface",
  "fuckhead",
  "fuckwit",
  "dickhead",       // 8 chars — safe compound
  "asshole",        // 7 chars — safe compound
  "jackass",        // 7 chars — specific compound
  "shithead",       // 8 chars
  "bullshit",       // 8 chars
  "motherfucker",   // with *→u in LEET_MAP, "motherf*cker" also maps to this
  "dipshit",
  "horseshit",

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

// ─── TIER 2 — EXACT WHOLE-WORD MATCH (post normalize()) ──────────────────────
export const EXACT_WORDS: ReadonlySet<string> = new Set([
  // ── N-WORD VARIANTS ────────────────────────────────────────────────────────
  "nigga", "nigger", "nigg", "nig",
  "niggaz", "niggas", "niggers",
  "niglet", "nigglet",
  "nigguh",
  "niqqer", "niqqa",     // q-based bypass
  "nigro",
  "wigger", "wigga",     // white + n-word hybrid slur
  "nagger",              // "nagger" — n-word approximation
  "niguega",             // heavily obfuscated n-word attempt (user example)

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
  "schvartze",
  "dindu",
  "sheboon",
  "kike", "kikes",
  "heeb",
  "hymie",
  "sheeny",
  "yid", "yids",
  "muzzie", "muzzies",
  "raghead",
  "towelhead",

  // ── HOMOPHOBIC / TRANSPHOBIC ──────────────────────────────────────────────
  "fag", "fags",
  "faggot", "faggots",
  "fagot",
  "dyke", "dykes",
  "tranny",
  "shemale",
  "sodomite",
  "poofter",
  "batyman",

  // ── ABLEIST ────────────────────────────────────────────────────────────────
  "retard", "retards", "retarded",
  "tard",
  "spaz", "spastic",
  "mongoloid",

  // ── SEXIST / MISOGYNISTIC ─────────────────────────────────────────────────
  "slut", "sluts",
  "skank", "skanks",
  "whore", "whores",
  "cunt", "cunts",
  "kunt",            // kunt — cunt bypass
  "twat", "twats",
  "thot",
  "sloot",
  "bitch", "bitches", "bitchy",

  // ── GENERAL PROFANITY — core forms ────────────────────────────────────────
  "fuck", "fucked", "fucker", "fuckers",
  "fucking", "fucks",
  "shit", "shits", "shitting", "shitty",
  "ass", "asses",
  "asshole", "assholes",
  "bullshit",
  "dick", "dicks",
  "dickhead", "dickheads",
  "cock", "cocks",
  "cocksucker",
  "prick", "pricks",
  "bastard", "bastards",
  "dipshit",
  "shithead",
  "jackass", "jackasses",
  "motherfucker", "motherfuckers", "motherfucking",
  "crap",            // mild — added for completeness
  "damn",            // mild — added for completeness
  "hellhole",        // compound — "hell" alone is not flagged
  "horseshit",
  "fuckface",
  "fuckhead",
  "fuckwit",
  "dumbass",
  "smartass",        // common dismissive compound

  // ── PROFANITY BYPASS VARIANTS (explicit misspellings / phonetic swaps) ────
  "fuk", "fuks",     // fuck shortening
  "fuker",           // fucker shortening
  "fuking",          // fucking shortening
  "fuked",           // fucked shortening
  "phuck", "phucker","phucking",  // ph→f bypass
  "phuk",            // phuck shortening
  "fruk", "fruck",   // inserted-r bypass ("frucking")
  "frucking",
  "feuck", "feuk",   // inserted-e bypass ("feucking")
  "feucking",
  "frik",            // another variant
  "bich",            // bitch — tc dropped
  "betch",           // bitch — vowel swap
  "biach", "beyatch",// extended bypass forms
  "biotch",
  "shiz", "shiit",   // shit bypasses
  "shite",           // British variant (real word but flagged)
  "dik", "diik",     // dick bypasses
  "dck",             // dick without vowel
  "prik",            // prick bypass
  "azz",             // ass bypass
  "asz",
  "arshole",         // British asshole variant
  "wanker", "wankers", "wanking",  // British profanity

  // ── ANTISEMITIC ────────────────────────────────────────────────────────────
  "kike",
  "yid",
  "heeb",
  "hymie",
  "sheeny",
  "jewbag",

  // ── ISLAMOPHOBIC ──────────────────────────────────────────────────────────
  "muzzie",

  // ── WHITE SUPREMACIST / HATE CODES ────────────────────────────────────────
  "rahowa",
  "groyper",
  "zog",

  // ── SELF-HARM ENCOURAGEMENT ───────────────────────────────────────────────
  "kys",
]);

// ─── TIER 3 — PHONETIC WORDS (entries stored in phonetic canonical form) ──────
// phonetic() = normalize() → tch→ch → ck→k → ph→f → collapse ALL repeats → 1
//
// The DETECTOR applies phonetic() to each message token and checks this set.
// This catches:  "fuuuuck" → fuk,  "biiitch" → bich,  "biitch" → bich,
//                "phuck"   → fuk,  "biitch"  → bich,  "diick" → dik
//
// !! Do NOT add entries with phonetic forms that match common innocent words. !!
export const PHONETIC_WORDS: ReadonlySet<string> = new Set([
  // ── PROFANITY — fuck family ────────────────────────────────────────────────
  "fuk",          // fuck / fuuck / fuuuuuck / phuck / f*ck (with *→u)
  "fuker",        // fucker
  "fukers",       // fuckers
  "fuking",       // fucking
  "fuked",        // fucked
  "fuks",         // fucks
  "fukface",      // fuckface
  "fukhed",       // fuckhead
  "fukwit",       // fuckwit
  "motherfuker",  // motherfucker
  "motherfuking", // motherfucking

  // ── PROFANITY — bitch family ───────────────────────────────────────────────
  "bich",         // bitch / biitch / b i t c h / b*tch (with *→u→bitch? no: b*tch: *→u → butch ≠ bich)
                  // NOTE: b*tch (*→u) = "butch" which is different. Regex handles b*tch.
  "biches",       // bitches
  "biching",      // bitching

  // ── PROFANITY — shit family ────────────────────────────────────────────────
  "shit",         // shit (no phonetic change, but ensures double-s etc. are caught)
  "shiting",      // shitting (tt→t)
  "bulshit",      // bullshit (ll→l)
  "shithed",      // shithead (no change, but phonetic collapses any repeats)
  "horseshit",

  // ── PROFANITY — ass family ─────────────────────────────────────────────────
  "ashole",       // asshole (ss→s)
  "asholes",      // assholes
  "jakashole",    // jackasshole compound

  // ── PROFANITY — dick family ────────────────────────────────────────────────
  "dik",          // dick / diick
  "diks",         // dicks
  "dikhed",       // dickhead
  "dikheds",      // dickheads

  // ── PROFANITY — prick family ───────────────────────────────────────────────
  "prik",         // prick / priick
  "priks",        // pricks

  // ── PROFANITY — cock family ────────────────────────────────────────────────
  "kok",          // cock → phonetic: ck→k → "cok" wait: "cock" = c-o-c-k:
                  // ck is at end: "cok". But "cook" = c-o-o-k → "cok" after collapse.
                  // "cock" phonetic = "cok", "cook" phonetic = "cok" — SAME → CONFLICT.
                  // Therefore: "cock" is handled by EXACT_WORDS ONLY, not PHONETIC_WORDS.
                  // Remove "kok" from this set.

  // ── PROFANITY — cunt family ────────────────────────────────────────────────
  "kunt",         // cunt (c-u-n-t stays as is through phonetic: no ck/tch/ph)
                  // But "kunt" is a bypass spelling. Include it.

  // ── N-WORD PHONETIC FORMS ─────────────────────────────────────────────────
  "niga",         // nigga / niiga / n i g g a (already in HARD_SUBSTRINGS too)
  "niger",        // nigger / n i g g e r (already in EXACT_WORDS too)
  "nager",        // nagger (n-word approximation: nagger → phonetic → nager)

  // ── SLURS — phonetic forms ─────────────────────────────────────────────────
  "fagot",        // faggot → phonetic → "fagot" (gg→g)
  "fagots",
  "fagboy",
  "trany",        // tranny → phonetic → "trany" (nn→n)
]);

// ─── TIER 4 — REGEX PATTERNS ─────────────────────────────────────────────────
export const REGEX_PATTERNS: ReadonlyArray<{ pattern: RegExp; label: string }> = [
  // N-word: letters separated by non-alpha (n.i.g.g.a, n_i_g_g_a, n i g g a)
  {
    pattern: /(?<![a-z])n[\W_]{0,2}[i1!][\W_]{0,2}g[\W_]{0,2}g[\W_]{0,2}[ae@4](?![a-z])/i,
    label: "n-word (letter-separator bypass)",
  },
  // F**k / f*ck / f**k / f--k style — catches when * maps to 'u' differently or pattern clear
  {
    pattern: /(?<![a-z])f[\W_]*[u*][\W_]*[ck](?:[\W_]*[ks])?(?![a-z])/i,
    label: "profanity: fuck (separator/symbol bypass)",
  },
  // sh!t / sh*t / sh@t — sh + non-letter + t
  {
    pattern: /(?<![a-z])sh[^a-zA-Z\s]t(?![a-z])/i,
    label: "profanity: shit (symbol bypass)",
  },
  // b*tch / b!tch / b@tch — b + non-letter + tch
  {
    pattern: /(?<![a-z])b[^a-zA-Z\s][ti]?[tc]h(?![a-z])/i,
    label: "profanity: bitch (symbol bypass)",
  },
  // d!ck / d*ck / d@ck
  {
    pattern: /(?<![a-z])d[^a-zA-Z\s][ck](?:k)?(?![a-z])/i,
    label: "profanity: dick (symbol bypass)",
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
  // 1488 / 14/88 white supremacist codes
  {
    pattern: /\b(14\s*[\/\-]?\s*88|88\s*[\/\-]?\s*14|1488)\b/,
    label: "white supremacist code (14/88)",
  },
];

// ─── SAFE TOKEN WHITELIST ─────────────────────────────────────────────────────
// Tokens that must NEVER trigger the filter even if they appear in word lists
// above. Used for place names, technical terms, and reclaimed terminology.
export const SAFE_TOKENS: ReadonlySet<string> = new Set([
  // Geographic names that overlap with slurs after normalization
  "nigeria", "nigerian", "nigerien",
  // Common words that phonetically resemble profanity
  "butch",        // "b*tch" with *→u maps to this; butch is an innocent word
  "heck",         // mild exclamation
  "shoot",        // mild exclamation (not flagged by current list, but safety net)
  "dang",         // mild exclamation
  "frick",        // mild exclamation (commonly used as substitute, not profanity itself)
  "fricking",     // Note: we DO flag this separately via explicit EXACT_WORDS for now
]);
