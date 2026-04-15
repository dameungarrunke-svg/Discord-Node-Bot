/**
 * MODERATION WORD DATABASE
 *
 * All entries are stored in NORMALIZED form — as they appear AFTER running
 * through the normalization pipeline (lowercase, leet-decoded, diacritics
 * stripped, consecutive-repeat-collapsed).
 *
 * Example: "nigger" → normalizes to "niger", "faggot" → "fagot"
 *
 * Two detection tiers:
 *
 *  HARD_SUBSTRINGS — checked as substrings inside the fully collapsed
 *    (space-free) normalized text. Catches spacing/punctuation bypasses.
 *    Only terms that cannot appear inside innocent English words.
 *
 *  EXACT_WORDS — checked as exact whole-word token matches. Used for
 *    shorter or more ambiguous terms to prevent false positives.
 */

// ─── TIER 1 — SUBSTRING SCAN (collapsed, space-free text) ────────────────────
export const HARD_SUBSTRINGS: ReadonlyArray<string> = [
  // ── N-WORD FAMILY ──────────────────────────────────────────────────────────
  "niga",          // nigga / n!gga / n i g g a → all collapse to niga
  "niger",         // nigger normalized (handled separately from country Niger)
  "nigle",         // niglet
  "jigabo",        // jigaboo
  "jiggabo",
  "pickaniny",     // pickaninny
  "porchmonkey",
  "junglebuniy",
  "junglebunny",
  "tarbaby",
  "knigar",        // phonetic variant

  // ── COMPOUND RACIAL SLURS ──────────────────────────────────────────────────
  "sandniger",     // sand + n-word
  "sandnigar",
  "prairienigar",  // prairie + n-word
  "prairienigr",
  "towelhead",
  "raghead",
  "cameljockey",
  "goatfuker",     // goatfucker normalized
  "zipperhead",
  "slopehead",
  "wagonburner",
  "halfbreed",
  "jewboy",
  "jewbitch",
  "jewfag",
  "kukluxklan",    // KKK full form
  "whitepower",
  "whitepride",
  "whitesupremacy",
  "siegheil",      // sieg heil
  "heilhitler",
  "rahowa",        // racial holy war (white supremacist term)
  "peckerwood",
  "trany",         // tranny normalized (tr-a-n-n-y → trany)
  "shemale",
  "motherfuker",   // motherfucker normalized
  "muthafuka",

  // ── HOMOPHOBIC / TRANSPHOBIC COMPOUNDS ────────────────────────────────────
  "fagot",         // faggot normalized (f-a-g-g-o-t → fagot)
  "fagboy",
  "fagit",
  "fagio",

  // ── ABLEIST COMPOUNDS ─────────────────────────────────────────────────────
  "retardo",
  "retardet",
  "mongoloid",
  "spasic",        // spastic normalized

  // ── SEXIST COMPOUNDS ──────────────────────────────────────────────────────
  "slutbag",
  "slutface",
  "whoreslut",
  "cuntface",
  "cunthol",       // cunthole
  "bitchslut",
  "skankwhore",

  // ── ISLAMOPHOBIC COMPOUNDS ────────────────────────────────────────────────
  "moslimterror",
  "muzziedog",

  // ── ANTI-SEMITIC COMPOUNDS ────────────────────────────────────────────────
  "kikejew",
  "jewkike",
  "hebrewkike",

  // ── VIOLENT / TARGETED HATE ───────────────────────────────────────────────
  "lynchnigar",
  "lynchnigar",
  "ropeanigar",
  "killalfags",
  "kilalnigas",
  "deathtonigars",

  // ── WHITE SUPREMACIST CODES ───────────────────────────────────────────────
  "1488",          // 14 words + H(8)H(8) — white supremacist code
  "h8h8",          // HH (Heil Hitler)
  "hh",            // very short but in compound context
  "borealisfreedom",
];

// ─── TIER 2 — EXACT WHOLE-WORD MATCH ─────────────────────────────────────────
export const EXACT_WORDS: ReadonlySet<string> = new Set([
  // ── N-WORD VARIANTS ────────────────────────────────────────────────────────
  "niger", "niga", "nig", "nigas", "nigers", "nigaz",
  "nigaros", "nigskin",

  // ── OTHER RACIAL SLURS ────────────────────────────────────────────────────
  "chink", "chinks",
  "gook", "gooks",
  "spic", "spick", "spics", "spicks",
  "wetback", "wetbacks",
  "beaner", "beaners",
  "coon", "coons",
  "sambo", "sambos",
  "darkie", "darky",
  "paki", "pakis",
  "chinaman",
  "slope", "slant",
  "greaseball", "greaser",
  "craker",       // cracker normalized
  "honky", "honkey",
  "polack",
  "bohunk",
  "wop", "wops",
  "dago", "dagos",
  "guinea",
  "mick", "micks",
  "paddy",
  "limey",
  "kraut", "krauts",
  "hun",
  "nip", "nips",
  "jap", "japs",
  "cholo", "cholos",
  "injun", "injuns",
  "squaw",
  "redskin", "redskins",
  "flip",         // Filipino slur
  "spade",        // racial slur
  "sambo",
  "mulato",       // mulatto normalized
  "octoroon",
  "quadroon",
  "kike", "kikes",
  "heeb", "heebs",
  "hymie", "hymies",
  "sheeny",
  "yid", "yids",
  "muzzie", "muzzies",
  "raghead",
  "towelhead",
  "habibi",       // sometimes used as racial slur in context
  "whitey",
  "cracker",
  "redneck",
  "peckerwood",
  "schvartze",    // Yiddish-origin anti-Black term
  "jigaboo",

  // ── HOMOPHOBIC / TRANSPHOBIC ──────────────────────────────────────────────
  "fag", "fags",
  "fagot", "fagots",
  "faggot", "faggots",
  "dyke", "dykes",
  "homo", "homos",
  "trany", "tranys",
  "shemale",
  "sodomite",
  "queer",        // context-dependent; flagged then logged
  "pilowbiter",   // pillowbiter normalized
  "poofter",
  "pouf",
  "nance",
  "pansy",
  "limp wrist",
  "lavender",     // historically used derogatory code
  "bugger",
  "batty",        // Caribbean homophobic slur
  "batyman",

  // ── ABLEIST SLURS ─────────────────────────────────────────────────────────
  "retard", "retards", "retarded",
  "spaz", "spastic",
  "tard", "tards",
  "idiot", "idiots",  // clinical term weaponized
  "moron", "morons",
  "imbecile",
  "cretin", "cretins",
  "schizo",
  "psycho",
  "maniac",
  "lunatic",
  "cripple", "criple",  // cripple normalized
  "gimp",

  // ── SEXIST / MISOGYNISTIC ─────────────────────────────────────────────────
  "bitch", "bitches",
  "slut", "sluts",
  "whore", "whores",
  "cunt", "cunts",
  "twat", "twats",
  "skank", "skanks",
  "thot", "thots",
  "harlot",
  "wench",
  "slag",
  "hoe",
  "hoes",
  "skanky",
  "sloot",        // slut variant

  // ── ANTI-SEMITIC ──────────────────────────────────────────────────────────
  "kike", "kikes",
  "yid", "yids",
  "heeb",
  "hymie",
  "sheeny",
  "jewbag",
  "kyke",         // kike variant normalized

  // ── ISLAMOPHOBIC ──────────────────────────────────────────────────────────
  "muzzie",
  "mussie",
  "goatfuker",

  // ── WHITE SUPREMACIST / HATE SYMBOLS ─────────────────────────────────────
  "nazi", "nazis",
  "heil",
  "fuhrer",       // führer normalized
  "kkk",
  "neonazi",
  "skinhead",
  "rahowa",

  // ── DEROGATORY GENERAL ───────────────────────────────────────────────────
  "bastard",
  "dumbas",       // dumbass normalized
  "ashole",       // asshole normalized
  "dipshit",
  "shithead",
  "shitheads",
  "jackass",
  "jackases",

  // ── SELF-HARM ENCOURAGEMENT (protect vulnerable members) ─────────────────
  "kys",          // kill yourself
  "kys",
  "kilurself",
  "enditall",

  // ── ADDITIONAL PHONETIC / INTERNET VARIANTS ──────────────────────────────
  "niqqer",       // q-based bypass (not caught by leet map)
  "niqqa",
  "niqqaz",
  "niqqas",
  "nigro",
  "negr",
  "negra",
  "negro",
  "wigger",       // white + n-word
  "wigga",
  "wiger",
  "chigger",      // bypass variant
  "cigger",
  "ciggar",
  "tyrone",       // sometimes used as anti-Black code
  "dindu",        // "dindu nuffin" — racist dog whistle
  "nuffin",       // part of above
  "sheboon",      // racist anti-Black slur
  "jaboo",
  "skrrrr",       // sometimes used in racist coding — context-monitored
  "googoo",       // anti-Korean
  "zog",          // Zionist Occupational Government — antisemitic
  "globalist",    // antisemitic dog whistle in context
  "cultmarx",     // cultural marxism — antisemitic dog whistle
  "soros",        // used as antisemitic dog whistle
  "kalergi",      // Kalergi plan — antisemitic conspiracy
  "groyper",      // white nationalist self-identifier
  "based",        // sometimes used as white nationalist code
  "redpil",       // redpill — white nationalist radicalization term
  "bluecheck",    // antisemitic dog whistle
  "clownworld",   // white nationalist code
  "honkhonk",     // clown world white nationalist code
]);

// ─── TIER 3 — REGEX PATTERNS (complex / structural detection) ─────────────────
export const REGEX_PATTERNS: ReadonlyArray<{ pattern: RegExp; label: string }> = [
  // N-word with any non-alpha char padding between letters
  {
    pattern: /n[\W_]*[i1!|][\W_]*[g69][\W_]*[g69][\W_]*[ae@4]/i,
    label: "n-word (structured bypass)",
  },
  // "kys" spelled out with separators
  {
    pattern: /k[\W_]*[i1!][\W_]*l[\W_]*[l1][\W_]*[u]+[\W_]*r[\W_]*s[\W_]*e[\W_]*l[\W_]*f/i,
    label: "self-harm encouragement",
  },
  // Heil Hitler with separators
  {
    pattern: /h[\W_]*e[\W_]*[i1][\W_]*l[\W_]*[\W_]*h[\W_]*[i1][\W_]*t[\W_]*l[\W_]*e[\W_]*r/i,
    label: "nazi salute (bypass)",
  },
  // White power / white pride with separators
  {
    pattern: /w[\W_]*h[\W_]*[i1][\W_]*t[\W_]*e[\W_]*[\W_]*(p[\W_]*[0o][\W_]*w[\W_]*e[\W_]*r|p[\W_]*r[\W_]*[i1][\W_]*d[\W_]*e)/i,
    label: "white supremacist phrase (bypass)",
  },
  // 1488 or 14/88 codes
  {
    pattern: /\b(14\s*\/?\s*88|88\s*\/?\s*14|1488|8888)\b/,
    label: "white supremacist code (14/88)",
  },
];
