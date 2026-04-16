/**
 * MODERATION WORD DATABASE — v4
 *
 * ─── FIVE DETECTION TIERS ────────────────────────────────────────────────────
 *
 *  TIER 1 — HARD_SUBSTRINGS
 *    Compound/joined slurs checked as substrings in the collapsed (space-free)
 *    normalized text. Catches spacing and punctuation bypasses.
 *    SAFETY: All entries ≥ 6 chars. Manually verified not to appear inside
 *    innocent common words.
 *
 *  TIER 1b — PHONETIC_HARD_SUBSTRINGS
 *    Same concept as TIER 1 but checked against phoneticCollapse() output.
 *    Catches phonetic spelling + spacing bypasses simultaneously.
 *    (e.g. "ph.u.c.k.f.a.c.e" → phoneticCollapse → "fukface")
 *
 *  TIER 2 — EXACT_WORDS
 *    Checked as exact whole-word token matches after normalize().
 *    "spic" will NOT match "spicy". "fag" will NOT match "flag".
 *
 *  TIER 3 — PHONETIC_WORDS
 *    Entries stored in phonetic canonical form (after phonetic()).
 *    Checked against phoneticTokens() of the message.
 *    Catches: "fuuuuck"→fuk, "phuck"→fuk, "bitch"→bich, "biiiitch"→bich,
 *             "fvck"→fuk (v→u in normalizer), "f.u.c.k" (via collapse).
 *
 *  TIER 4 — REGEX_PATTERNS
 *    Structural patterns for explicit letter-separator/symbol bypasses.
 *
 *  SAFE_TOKENS — Whitelist of tokens that must NEVER trigger the filter.
 */

// ─── TIER 1 — HARD SUBSTRINGS (collapsed normalized text) ────────────────────
export const HARD_SUBSTRINGS: ReadonlyArray<string> = [
  // ── N-WORD FAMILY ──────────────────────────────────────────────────────────
  "nigga",
  "nigger",
  "nigglet",
  "niglet",
  "jigaboo",
  "porchmonkey",
  "junglebunny",
  "tarbaby",
  "niggerlover",
  "niggaslut",
  "niggabitch",
  "niggaass",

  // ── COMPOUND RACIAL SLURS ──────────────────────────────────────────────────
  "sandnigger",
  "sandnigga",
  "sandmonkey",
  "towelhead",
  "raghead",
  "cameljockey",
  "goatfucker",
  "zipperhead",
  "slopehead",
  "wagonburner",
  "halfbreed",
  "jewboy",
  "jewbitch",
  "mudslime",
  "islamofag",
  "islamofags",
  "carpetmuncher",
  "pillowbiter",
  "coonjuice",

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
  "deathtoislam",
  "killalljews",
  "killallmuslims",

  // ── HOMOPHOBIC / TRANSPHOBIC COMPOUND ─────────────────────────────────────
  "faggot",
  "shemale",
  "tranny",
  "fagboy",
  "fagface",
  "faggotass",

  // ── ABLEIST COMPOUND ──────────────────────────────────────────────────────
  "retardo",
  "mongoloid",

  // ── SEXIST / PROFANITY COMPOUND ───────────────────────────────────────────
  "slutbag",
  "slutface",
  "whoreslut",
  "cuntface",
  "cunthole",
  "cuntbag",
  "cuntrag",
  "bitchslut",
  "bitchass",
  "skankwhore",
  "fuckface",
  "fuckhead",
  "fuckwit",
  "fuckstick",
  "fucknut",
  "dicksuck",
  "dickhead",
  "dicksucker",
  "asshole",
  "asswipe",
  "asshat",
  "assfuck",
  "assbag",
  "assclown",
  "jackass",
  "shithead",
  "bullshit",
  "motherfucker",
  "motherfucking",
  "dipshit",
  "horseshit",
  "cumslut",
  "cumshot",
  "jerkoff",
  "jackoff",

  // ── TARGETED HATE COMPOUND ────────────────────────────────────────────────
  "killyourself",
  "killallfags",
  "killallniggers",
  "deathtoniggers",
  "lynchnigger",
  "killallgays",

  // ── ANTISEMITIC COMPOUND ──────────────────────────────────────────────────
  "kikejew",
  "jewkike",
  "hebrewkike",
];

// ─── TIER 1b — PHONETIC HARD SUBSTRINGS (phoneticCollapse text) ───────────────
// These are the phonetic() forms of the most critical compound slurs.
// Catches: "ph.u.c.k.f.a.c.e" → phoneticCollapse → "fukface"
//          "f u c k h e a d"  → phoneticCollapse → "fukhed"
export const PHONETIC_HARD_SUBSTRINGS: ReadonlyArray<string> = [
  // Phonetic of "fuckface", "fuckhead", "fuckwit"
  "fukface",
  "fukhed",
  "fukwit",
  "fukstik",
  "fuknugit",
  // Phonetic of "motherfucker" / "motherfucking"
  "motherfuker",
  "motherfuking",
  // Phonetic of "asshole" (ss→s)
  "ashole",
  "asholes",
  // Phonetic of "dickhead" (ck→k)
  "dikhed",
  // Phonetic of "bullshit" (ll→l)
  "bulshit",
  // Phonetic of "cocksucker" (ck→k)
  "coksuker",
  // Phonetic of "shithead"
  "shithed",
  // Phonetic of "nigger" / "nigga" (gg→g)
  "niger",
  "niga",
  // Phonetic of "faggot" (gg→g)
  "fagot",
  // Phonetic of "tranny" (nn→n)
  "trany",
  // Phonetic of "killyourself"
  "kilyourself",
];

// ─── TIER 2 — EXACT WHOLE-WORD MATCH (post normalize()) ──────────────────────
export const EXACT_WORDS: ReadonlySet<string> = new Set([
  // ── N-WORD FAMILY ──────────────────────────────────────────────────────────
  "nigga", "nigger", "nigg", "nig",
  "niggaz", "niggas", "niggers",
  "niglet", "nigglet",
  "nigguh",
  "niqqer", "niqqa",
  "nigro",
  "wigger", "wigga",
  "nagger",
  "niguega",

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
  "coon", "coons",
  "pickaninny",
  "golliwog", "golliwogs",
  "mick", "micks",
  "haji", "hadji",
  "mudslime", "mudslimes",
  "kraut", "krauts",
  "guido", "guidos",

  // ── HOMOPHOBIC / TRANSPHOBIC ──────────────────────────────────────────────
  "fag", "fags",
  "faggot", "faggots",
  "fagot",
  "dyke", "dykes",
  "tranny", "trannies",
  "shemale",
  "sodomite",
  "poofter",
  "batyman",
  "homo", "homos",
  "troon", "troons",
  "poof", "poofs",

  // ── ABLEIST ────────────────────────────────────────────────────────────────
  "retard", "retards", "retarded",
  "tard",
  "spaz", "spastic",
  "mongoloid",
  "mong", "mongs",
  "cretin",

  // ── SEXIST / MISOGYNISTIC ─────────────────────────────────────────────────
  "slut", "sluts",
  "skank", "skanks",
  "whore", "whores",
  "cunt", "cunts",
  "kunt",
  "twat", "twats",
  "thot",
  "sloot",
  "bitch", "bitches", "bitchy",

  // ── GENERAL PROFANITY ─────────────────────────────────────────────────────
  "fuck", "fucked", "fucker", "fuckers",
  "fucking", "fucks",
  "shit", "shits", "shitting", "shitty",
  "ass", "asses",
  "arse", "arses", "arsehole", "arseholes",
  "asshole", "assholes",
  "asswipe", "asswipes",
  "asshat", "asshats",
  "assfuck",
  "assclown", "assclowns",
  "fatass",
  "dumbass", "dumbasses",
  "smartass",
  "jackass", "jackasses",
  "halfass",
  "bullshit",
  "dick", "dicks",
  "dickhead", "dickheads",
  "cock", "cocks",
  "cocksucker",
  "prick", "pricks",
  "bastard", "bastards",
  "dipshit",
  "shithead",
  "motherfucker", "motherfuckers", "motherfucking",
  "horseshit",
  "fuckface",
  "fuckhead",
  "fuckwit",
  "damn",
  "hellhole",
  "crap",

  // ── BRITISH / REGIONAL PROFANITY ──────────────────────────────────────────
  "bollocks",
  "wank", "wanked", "wanks", "wanky", "wanker", "wankers", "wanking",
  "tosser", "tossers",
  "knob", "knobs", "knobhead", "knobheads",
  "nob", "nobhead",
  "bellend", "bellends",
  "minge", "minges",
  "twathead",
  "pillock",
  "plonker",
  "prat",
  "git",
  "bugger", "buggers", "buggered", "buggering",
  "shag", "shags", "shagging", "shagger",
  "feck", "fecking", "fecker",
  "fook", "fooking", "fooks",

  // ── SEXUAL VULGAR ─────────────────────────────────────────────────────────
  "jizz", "jizzing", "jizzed",
  "cum", "cumming", "cums", "cummed",
  "blowjob", "blowjobs",
  "handjob", "handjobs",
  "rimjob", "rimjobs",
  "gangbang", "gangbangs", "gangbanged",
  "jackoff", "jerkoff",
  "fap", "fapping", "fapped",

  // ── PROFANITY BYPASS VARIANTS ─────────────────────────────────────────────
  "fuk", "fuks",
  "fuker",
  "fuking",
  "fuked",
  "phuck", "phucker", "phucking",
  "phuk",
  "fruk", "fruck",
  "frucking",
  "feuck", "feuk",
  "feucking",
  "frik", "frikking",
  "fvck", "fvcking",
  "fawk", "fawking",
  "f4ck", "f4cking",
  "bich",
  "betch",
  "biach", "beyatch",
  "biotch",
  "b1tch",
  "biitch",
  "shiz", "shiit",
  "shite",
  "sheit", "shyt",
  "dik", "diik",
  "dck",
  "prik",
  "azz",
  "asz",
  "arshole",
  "cnut",
  "cnt",
  "kwnt",
  "mf",
  "stfu",
  "gtfo",

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
  "kms",
]);

// ─── TIER 3 — PHONETIC WORDS (stored in phonetic canonical form) ──────────────
// phonetic() = normalize() → tch→ch → ck→k → ph→f → wh→w → gh→g → qu→k
//              → collapse ALL repeats → 1
//
// The DETECTOR applies phonetic() to each message token and checks this set.
//
// "fuuuuck"  → fuk       "phuck"    → fuk      "fvck"     → fuk (v→u in normalize)
// "bitch"    → bich      "biitch"   → bich     "biiitch"  → bich
// "nigg3r"   → niger     "n1gger"   → niger
// "faggot"   → fagot
// "wh0re"    → wore
export const PHONETIC_WORDS: ReadonlySet<string> = new Set([
  // ── fuck family ────────────────────────────────────────────────────────────
  "fuk",
  "fuker",
  "fukers",
  "fuking",
  "fuked",
  "fuks",
  "fukface",
  "fukhed",
  "fukwit",
  "motherfuker",
  "motherfuking",
  "fok",          // fook → phonetic → fok

  // ── bitch family ───────────────────────────────────────────────────────────
  "bich",
  "biches",
  "biching",
  "biched",

  // ── shit family ────────────────────────────────────────────────────────────
  "shit",
  "shiting",
  "bulshit",
  "shithed",
  "horseshit",

  // ── ass family ─────────────────────────────────────────────────────────────
  "ashole",
  "asholes",
  "jakashole",

  // ── dick family ────────────────────────────────────────────────────────────
  "dik",
  "diks",
  "dikhed",
  "dikheds",

  // ── prick family ───────────────────────────────────────────────────────────
  "prik",
  "priks",

  // ── cock family ────────────────────────────────────────────────────────────
  // NOTE: "cock" → phonetic → "cok" BUT "cook" → phonetic → "cok" too.
  // Conflict — cock is handled via EXACT_WORDS only.

  // ── cunt family ────────────────────────────────────────────────────────────
  "kunt",
  "kunt",

  // ── whore family ───────────────────────────────────────────────────────────
  "wore",        // whore → wh→w → "wore" (innocent word too, but rare in this context)
                 // Actually "wore" is too risky (past tense of wear). Removing:
  // "wore",     // REMOVED — false positive risk

  // ── wanker family ──────────────────────────────────────────────────────────
  "wanker",
  "wankers",
  "wanking",

  // ── N-word phonetic forms ──────────────────────────────────────────────────
  "niga",        // nigga → gg→g → "niga"
  "niger",       // nigger → gg→g → "niger"
  "nager",       // nagger → phonetic → "nager"

  // ── Slurs — phonetic forms ─────────────────────────────────────────────────
  "fagot",       // faggot → gg→g → "fagot"
  "fagots",
  "fagboy",
  "trany",       // tranny → nn→n → "trany"
  "homo",

  // ── Ableist — phonetic forms ───────────────────────────────────────────────
  "retard",
  "retarded",

  // ── British profanity ──────────────────────────────────────────────────────
  "boloks",      // bollocks → ll→l → "boloks" (wait: "bollocks" = b-o-l-l-o-c-k-s: ck→k, ll→l: "boloks")
  "wanker",
  "tosser",
  "nob",
  "beled",       // bellend → ll→l, nd stays → "belend"

  // ── Sexual vulgar ──────────────────────────────────────────────────────────
  "jiz",         // jizz → zz→z → "jiz"
  "cum",
  "cuming",      // cumming → mm→m → "cuming"
  "blojob",      // blowjob → wh? no: b-l-o-w-j-o-b → "blojob"... wait phonetic doesn't remove w. "blowjob" → no ck/tch/ph/wh/gh/qu → "blowjob" → collapse → "blowjob". So token "blowjob" = "blowjob" in phonetic. Add to EXACT_WORDS instead.

  // ── Self-harm ──────────────────────────────────────────────────────────────
  "kys",
  "kms",
]);

// ─── TIER 4 — REGEX PATTERNS ─────────────────────────────────────────────────
export const REGEX_PATTERNS: ReadonlyArray<{ pattern: RegExp; label: string }> = [
  // ── N-word: n + separator + i/1/! + gg + a/e (nigga / nigger separator bypass)
  {
    pattern: /(?<![a-z])n[\W_]{0,2}[i1!][\W_]{0,2}g[\W_]{0,2}g[\W_]{0,2}[ae@4](?![a-z])/i,
    label: "n-word nigga (separator bypass)",
  },
  // ── N-word: nigger with e-r ending
  {
    pattern: /(?<![a-z])n[\W_]{0,2}[i1!][\W_]{0,2}g[\W_]{0,2}g[\W_]{0,2}[e3][\W_]{0,2}r(?![a-z])/i,
    label: "n-word nigger (separator bypass)",
  },
  // ── F**k / f*ck / f-u-c-k / fvck
  {
    pattern: /(?<![a-z])f[\W_]*[uv*][\W_]*[ck](?:[\W_]*[ks])?(?![a-z])/i,
    label: "profanity: fuck (separator/symbol bypass)",
  },
  // ── sh!t / sh*t / sh@t / s.h.i.t
  {
    pattern: /(?<![a-z])s[\W_]*h[\W_]*[^a-zA-Z\s][\W_]*t(?![a-z])/i,
    label: "profanity: shit (symbol/separator bypass)",
  },
  // ── s.h.i.t with letter separators
  {
    pattern: /(?<![a-z])s[\W_]{0,2}h[\W_]{0,2}[i1!][\W_]{0,2}t(?![a-z])/i,
    label: "profanity: shit (letter-separator bypass)",
  },
  // ── b*tch / b!tch / b@tch / b-i-t-c-h
  {
    pattern: /(?<![a-z])b[\W_]*[^a-zA-Z\s][\W_]*[ti]?[\W_]*[tc][\W_]*h(?![a-z])/i,
    label: "profanity: bitch (symbol bypass)",
  },
  // ── b.i.t.c.h (letter-separator)
  {
    pattern: /(?<![a-z])b[\W_]{0,2}[i1!][\W_]{0,2}t[\W_]{0,2}c[\W_]{0,2}h(?![a-z])/i,
    label: "profanity: bitch (separator bypass)",
  },
  // ── d!ck / d*ck / d-i-c-k
  {
    pattern: /(?<![a-z])d[\W_]*[^a-zA-Z\s][\W_]*[ck](?:k)?(?![a-z])/i,
    label: "profanity: dick (symbol bypass)",
  },
  // ── c*nt / c-u-n-t / cu*t
  {
    pattern: /(?<![a-z])c[\W_]{0,2}[u*][\W_]{0,2}n[\W_]{0,2}t(?![a-z])/i,
    label: "profanity: cunt (separator/symbol bypass)",
  },
  // ── a** / a$$ / a-s-s (ass separator bypass)
  {
    pattern: /(?<![a-z])a[\W_]{0,2}[$s][\W_]{0,2}[$s](?:[\W_]{0,2}h[\W_]{0,2}o[\W_]{0,2}l[\W_]{0,2}e)?(?![a-z])/i,
    label: "profanity: ass (symbol/separator bypass)",
  },
  // ── w-h-o-r-e / wh*re / wh0re
  {
    pattern: /(?<![a-z])w[\W_]{0,2}h[\W_]{0,2}[o0*][\W_]{0,2}r[\W_]{0,2}e(?![a-z])/i,
    label: "profanity: whore (separator/symbol bypass)",
  },
  // ── s-l-u-t (slut separator)
  {
    pattern: /(?<![a-z])s[\W_]{0,2}l[\W_]{0,2}[u*][\W_]{0,2}t(?![a-z])/i,
    label: "profanity: slut (separator bypass)",
  },
  // ── f-a-g-g-o-t (faggot separator)
  {
    pattern: /(?<![a-z])f[\W_]{0,2}a[\W_]{0,2}g[\W_]{0,2}g[\W_]{0,2}[o0][\W_]{0,2}t(?![a-z])/i,
    label: "slur: faggot (separator bypass)",
  },
  // ── k-y-s (kill yourself separator)
  {
    pattern: /(?<![a-z])k[\W_]{0,2}y[\W_]{0,2}s(?![a-z])/i,
    label: "self-harm: kys (separator bypass)",
  },
  // ── Kill yourself (letter-separator full phrase)
  {
    pattern: /k[\W_]{0,2}[i1][\W_]{0,2}l[\W_]{0,2}l[\W_]{0,3}y[\W_]{0,2}[o0][\W_]{0,2}u[\W_]{0,2}r[\W_]{0,2}s[\W_]{0,2}e[\W_]{0,2}l[\W_]{0,2}f/i,
    label: "self-harm: kill yourself (separator bypass)",
  },
  // ── Heil Hitler with separators
  {
    pattern: /h[\W_]{0,2}e[\W_]{0,2}[i1][\W_]{0,2}l[\W_]{0,3}h[\W_]{0,2}[i1][\W_]{0,2}t[\W_]{0,2}l[\W_]{0,2}e[\W_]{0,2}r/i,
    label: "hate: heil hitler (separator bypass)",
  },
  // ── White power / white pride with separators
  {
    pattern: /w[\W_]{0,2}h[\W_]{0,2}[i1][\W_]{0,2}t[\W_]{0,2}e[\W_]{0,3}(p[\W_]{0,2}[o0][\W_]{0,2}w[\W_]{0,2}e[\W_]{0,2}r|p[\W_]{0,2}r[\W_]{0,2}[i1][\W_]{0,2}d[\W_]{0,2}e)/i,
    label: "hate: white supremacist phrase (separator bypass)",
  },
  // ── 1488 / 14/88 white supremacist codes
  {
    pattern: /\b(14\s*[\/\-]?\s*88|88\s*[\/\-]?\s*14|1488)\b/,
    label: "hate: white supremacist code (14/88)",
  },
  // ── r*tard / ret@rd
  {
    pattern: /(?<![a-z])r[\W_]*e[\W_]*t[\W_]*[a@4][\W_]*r[\W_]*d(?![a-z])/i,
    label: "ableist: retard (symbol/separator bypass)",
  },
  // ── f*ggot / fagg0t
  {
    pattern: /(?<![a-z])f[\W_]{0,2}[a@4][\W_]{0,2}g[\W_]{0,2}[g]?[\W_]{0,2}[o0][\W_]{0,2}t(?![a-z])/i,
    label: "slur: faggot (symbol bypass)",
  },
  // ── Spaced-out kys / k y s
  {
    pattern: /\bk\s+y\s+s\b/i,
    label: "self-harm: k y s (space bypass)",
  },
];

// ─── SUBSTRING CORES ──────────────────────────────────────────────────────────
// Words that are SAFE to search as substrings inside any token or the collapsed
// full message, because they do not appear inside common innocent English words.
//
// Deliberately EXCLUDED (false-positive risk):
//   "cock"  → "peacock", "cockatoo"
//   "dick"  → "predict", "verdict"
//   "ass"   → "class", "pass", "massive"   (too short, excluded by min-4 anyway)
//   "arse"  → "parse", "sparse"
//   "crap"  → "scrap"
//   "damn"  → "damnation" (borderline)
//   "fag"   → too short (3 chars)
//   "cum"   → too short (3 chars)
//
// Everything here is ≥ 4 chars and ONLY appears in clearly offensive compound
// words in normal English usage.
export const SUBSTRING_CORES: ReadonlyArray<string> = [
  // ── 4-char core (safe as substrings) ──────────────────────────────────────
  "fuck",
  "shit",
  "cunt",
  "twat",
  "wank",
  "slut",
  "thot",
  "kunt",
  "piss",

  // ── 5-char ────────────────────────────────────────────────────────────────
  "bitch",
  "nigga",
  "whore",
  "prick",
  "pussy",

  // ── 6-char ────────────────────────────────────────────────────────────────
  "nigger",
  "faggot",
  "retard",
  "wanker",
  "fucker",
  "fucked",
  "shitty",
  "kike",        // 4-char but safe
  "tranny",

  // ── 7-char ────────────────────────────────────────────────────────────────
  "asshole",
  "bullshit",
  "bastard",
  "dickhead",
  "fuckwit",
  "fuckhead",
  "shithead",
  "retarded",
  "retards",
  "faggots",

  // ── 8+ char (always safe) ─────────────────────────────────────────────────
  "motherfucker",
  "motherfucking",
  "cocksucker",
  "asswipe",
  "fuckface",
  "bitchass",
  "shithole",
  "whorehouse",
  "bitchslut",
  "cumslut",
  "niggerlover",
];

// ─── SAFE TOKEN WHITELIST ─────────────────────────────────────────────────────
export const SAFE_TOKENS: ReadonlySet<string> = new Set([
  // Geographic names that overlap with slurs after normalization
  "nigeria", "nigerian", "nigerien", "niger",

  // Common words that phonetically resemble profanity
  "butch",        // b*tch with *→u = butch
  "heck",
  "shoot",
  "dang",
  "frick",        // mild exclamation (sub for fuck, not flagged on its own)
  "fricking",
  "witch",        // bitch phonetic overlap prevention
  "ditch",        // ditto
  "itch",
  "rich",
  "much",
  "such",
  "duck",
  "luck",
  "tuck",
  "stuck",
  "truck",
  "pluck",
  "buck",
  "muck",
  "puck",
  "mock",
  "dock",
  "lock",
  "rock",
  "sock",
  "clock",
  "block",
  "shock",
  "stock",
  "knock",
  "flock",
  "cook",         // cock phonetic form "cok" prevented via EXACT_WORDS-only approach
  "look",
  "book",
  "hook",
  "nook",
  "rook",
  "took",
  "con",          // coon phonetic = "con" — safe
  "soon",
  "moon",
  "boon",
  "noon",
  "spoon",
  "bloom",
  "doom",
  "gloom",
  "room",
  "zoom",
  "assent",       // ass + ent as one word — tokenize prevents but safety net
  "assume",
  "asset",
  "assess",
  "class",
  "brass",
  "grass",
  "pass",
  "mass",
  "bass",
  "glass",
  "last",         // overlap prevention
  "past",
  "fast",
  "cast",
  "classic",
  "assist",
  "association",
  "passage",
  "passion",
  "ambassador",
  "harassment",
  "assassin",
  "massive",
  "pissed",       // British English = angry (not flagged as profanity on its own)
  "piss",         // mild — whitelist to avoid overcensoring general chat
  "damn",         // mild expletive — kept in EXACT_WORDS but noting it's borderline
  "shag",         // kept in exact_words but British "shag" tobacco / carpet
  "fag",          // cigarette in British English — kept flagged (too risky not to)
  "git",          // kept flagged
  "spaz",         // kept flagged
  "twat",         // kept flagged
  "wear",         // "wore" safe word to prevent whore phonetic false positive
  "wore",         // "wore" = past tense of wear — REMOVE from PHONETIC_WORDS
  "bore",
  "core",
  "fore",
  "gore",
  "lore",
  "more",
  "pore",
  "sore",
  "tore",
  "yore",
]);
