// Robust anime GIF fetcher with multi-layer fallback chain.
//
// Order of attempts per request:
//   1) TENOR        (if TENOR_API_KEY env var is set)
//   2) WAIFU.PICS   (no key)
//   3) NEKOS.LIFE   (no key)
//   4) STATIC LIST  (bundled URLs, always available)
//
// Each network call has a 2s timeout. Anti-repetition cache keeps the last 10
// served URLs per command key and avoids reusing them when fresh options exist.
// All errors are swallowed silently — a valid GIF URL is ALWAYS returned.

const TIMEOUT_MS = 2000;
const RECENT_CACHE = 10;

const recent = new Map<string, string[]>();

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function fetchJson(url: string): Promise<unknown | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// ─── 1) TENOR ──────────────────────────────────────────────────────────────────
async function fromTenor(query: string): Promise<string[]> {
  const key = process.env.TENOR_API_KEY;
  if (!key) return [];
  const url =
    `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}` +
    `&key=${key}&limit=20&media_filter=gif&random=true`;
  const data = await fetchJson(url) as
    { results?: { media_formats?: { gif?: { url?: string } } }[] } | null;
  if (!data?.results) return [];
  return data.results
    .map((r) => r?.media_formats?.gif?.url)
    .filter((u): u is string => typeof u === "string");
}

// ─── 2) WAIFU.PICS ─────────────────────────────────────────────────────────────
const WAIFU_ENDPOINTS = new Set([
  "bully","cuddle","cry","hug","awoo","kiss","lick","pat","smug","bonk",
  "yeet","blush","smile","wave","highfive","handhold","nom","bite","glomp",
  "slap","kill","kick","happy","wink","poke","dance","cringe",
]);

async function fromWaifu(endpoint: string): Promise<string[]> {
  if (!WAIFU_ENDPOINTS.has(endpoint)) return [];
  const data = await fetchJson(`https://api.waifu.pics/sfw/${endpoint}`) as
    { url?: string } | null;
  return data?.url ? [data.url] : [];
}

// ─── 3) NEKOS.LIFE ─────────────────────────────────────────────────────────────
// nekos.life endpoint mapping (some are aliases on the legacy API)
const NEKOS_LIFE_MAP: Record<string, string> = {
  hug: "hug", kiss: "kiss", slap: "slap", pat: "pat", cuddle: "cuddle",
  poke: "poke", smug: "smug", tickle: "tickle", feed: "feed", wave: "wave",
  lick: "lick", baka: "baka", cry: "cry", dance: "dance", kill: "Kill",
  spank: "spank",
};

// Modern nekos.best as additional safety net (no key, returns results array)
const NEKOS_BEST_ENDPOINTS = new Set([
  "baka","bite","blush","bored","cry","cuddle","dance","facepalm","feed",
  "handhold","happy","highfive","hug","kick","kiss","laugh","lurk","nod",
  "nom","nope","pat","peck","poke","pout","punch","shoot","shrug","slap",
  "sleep","smile","smug","stare","think","thumbsup","tickle","wave","wink",
  "yawn","yeet",
]);

async function fromNekosLife(endpoint: string): Promise<string[]> {
  const mapped = NEKOS_LIFE_MAP[endpoint];
  const out: string[] = [];

  if (mapped) {
    const data = await fetchJson(`https://nekos.life/api/v2/img/${mapped}`) as
      { url?: string } | null;
    if (data?.url) out.push(data.url);
  }

  if (NEKOS_BEST_ENDPOINTS.has(endpoint)) {
    const data = await fetchJson(`https://nekos.best/api/v2/${endpoint}`) as
      { results?: { url?: string }[] } | null;
    const urls = (data?.results ?? [])
      .map((r) => r?.url)
      .filter((u): u is string => typeof u === "string");
    out.push(...urls);
  }

  return out;
}

// ─── 4) STATIC FALLBACK ────────────────────────────────────────────────────────
// Stable Tenor CDN URLs. Always available even if every API fails.
const STATIC_FALLBACK: Record<string, string[]> = {
  hug: [
    "https://media.tenor.com/kCZjTqCKiggAAAAC/hug-anime.gif",
    "https://media.tenor.com/qosOH1jY1xUAAAAC/anime-hug-anime-love.gif",
    "https://media.tenor.com/gN-Q4RpsKKkAAAAC/hugs-hug.gif",
    "https://media.tenor.com/PYM1g4xhIWkAAAAC/anime-hug-jujutsu-kaisen.gif",
    "https://media.tenor.com/RngEGz97IcgAAAAC/anime-hug.gif",
    "https://media.tenor.com/0vlcXyP5KZ0AAAAC/anime-hug.gif",
  ],
  kiss: [
    "https://media.tenor.com/JNh-OB3KvkkAAAAC/anime-kiss.gif",
    "https://media.tenor.com/eRfLP8I-rTcAAAAC/anime-kiss.gif",
    "https://media.tenor.com/_VmEjGYYLBkAAAAC/anime-kiss.gif",
    "https://media.tenor.com/u8hTFjdcJ8gAAAAC/anime-kiss.gif",
    "https://media.tenor.com/p6S-80HRsRcAAAAC/anime-anime-kiss.gif",
  ],
  slap: [
    "https://media.tenor.com/8jDIO20NUF8AAAAC/anime-slap.gif",
    "https://media.tenor.com/Ws6Dm1ZW_vMAAAAC/girl-slap-anime-slap.gif",
    "https://media.tenor.com/3y9-iJ0IahkAAAAC/anime-slap.gif",
    "https://media.tenor.com/jmdgGjU5fXMAAAAC/anime-slap.gif",
    "https://media.tenor.com/fQGd1q_5HhAAAAAC/anime-fight.gif",
  ],
  pat: [
    "https://media.tenor.com/N5Ddt2wqsLkAAAAC/anime-pat.gif",
    "https://media.tenor.com/E2dGXFwBqHwAAAAC/anime-head-pat.gif",
    "https://media.tenor.com/dQE2qaztOIkAAAAC/anime-pat.gif",
    "https://media.tenor.com/iD9fzwt7k5cAAAAC/head-pat-anime-pat.gif",
    "https://media.tenor.com/5o6jCfgmaOoAAAAC/headpat.gif",
  ],
  cuddle: [
    "https://media.tenor.com/zJyd6dPVTr8AAAAC/anime-cuddle.gif",
    "https://media.tenor.com/4Y_GLyNcxQ4AAAAC/anime-cuddle.gif",
    "https://media.tenor.com/aOYLT6m8WXYAAAAC/anime-snuggle.gif",
    "https://media.tenor.com/u3Tf9LD7Yv4AAAAC/anime-couple-cuddle.gif",
    "https://media.tenor.com/9YyJK2UPnK4AAAAC/anime-cuddle.gif",
  ],
  poke: [
    "https://media.tenor.com/9cTFE8XdmM0AAAAC/anime-poke.gif",
    "https://media.tenor.com/NPbAOjC8DzwAAAAC/anime-poke.gif",
    "https://media.tenor.com/gWbUSTxBu4UAAAAC/anime-poke.gif",
    "https://media.tenor.com/0V2eRibZbtwAAAAC/anime-girl-poke.gif",
    "https://media.tenor.com/Pkun_OruwiwAAAAC/anime-poke.gif",
  ],
  bite: [
    "https://media.tenor.com/oxbtoMx5CTEAAAAC/anime-bite.gif",
    "https://media.tenor.com/N0cAcoHhBOgAAAAC/anime-bite.gif",
    "https://media.tenor.com/IMsj0BKgC0sAAAAC/anime-bite.gif",
    "https://media.tenor.com/Yw5wHs_aJlkAAAAC/anime-bite.gif",
    "https://media.tenor.com/yc8xwgFqQqMAAAAC/anime-bite.gif",
  ],
  highfive: [
    "https://media.tenor.com/_PnUQq2CpGoAAAAC/anime-high-five.gif",
    "https://media.tenor.com/IB6t_6yBE9UAAAAC/anime-high-five.gif",
    "https://media.tenor.com/ZCk2_7ipy_QAAAAC/high-five-anime.gif",
    "https://media.tenor.com/gsR4iEh-UmwAAAAC/anime-high-five.gif",
    "https://media.tenor.com/u5pYvOmRFmwAAAAC/anime-high-five.gif",
  ],
  handhold: [
    "https://media.tenor.com/uG_QTrAr3w4AAAAC/anime-hand-hold.gif",
    "https://media.tenor.com/ojN5rBpgWkAAAAAC/anime-hold-hands.gif",
    "https://media.tenor.com/oMsEqlPqVtgAAAAC/anime-hand-holding.gif",
    "https://media.tenor.com/bk2Y75-FwzgAAAAC/anime-hand-hold.gif",
    "https://media.tenor.com/1KvAsDg_Yw4AAAAC/anime-hand-hold.gif",
  ],
  stare: [
    "https://media.tenor.com/jCYqynnzgCcAAAAC/anime-stare.gif",
    "https://media.tenor.com/CeSBHTaNxMQAAAAC/anime-stare.gif",
    "https://media.tenor.com/9-wMNvKVSWMAAAAC/anime-stare.gif",
    "https://media.tenor.com/3vWp4FFOXjwAAAAC/anime-stare.gif",
    "https://media.tenor.com/F8KS3pjQq6MAAAAC/anime-glare.gif",
  ],
  smug: [
    "https://media.tenor.com/HrnH3HPncJgAAAAC/anime-smug.gif",
    "https://media.tenor.com/gnBRifvKrtsAAAAC/anime-smug.gif",
    "https://media.tenor.com/3T7K3SfQqDsAAAAC/anime-smug.gif",
    "https://media.tenor.com/35HzBprGsOIAAAAC/smug-smug-anime.gif",
    "https://media.tenor.com/MM0Yj4SyDPYAAAAC/anime-smug.gif",
  ],
  laugh: [
    "https://media.tenor.com/8KngRvLN-VEAAAAC/anime-laugh.gif",
    "https://media.tenor.com/dcr9FWHWlzgAAAAC/anime-laugh.gif",
    "https://media.tenor.com/kqsvDHr0M4UAAAAC/anime-laugh.gif",
    "https://media.tenor.com/aDQaEkWXvqsAAAAC/anime-laugh.gif",
    "https://media.tenor.com/nFwvnL_a4nMAAAAC/anime-laugh.gif",
  ],
  blush: [
    "https://media.tenor.com/lVTBOOC_SVIAAAAC/anime-blush.gif",
    "https://media.tenor.com/nWRvBEMu1bIAAAAC/anime-blush.gif",
    "https://media.tenor.com/_HfETjfBhmwAAAAC/anime-blush.gif",
    "https://media.tenor.com/xEYtXl4q0DEAAAAC/anime-blush.gif",
    "https://media.tenor.com/HzhCgtEXs7gAAAAC/anime-blush.gif",
  ],
  cry: [
    "https://media.tenor.com/MaCs3onIDPwAAAAC/anime-cry.gif",
    "https://media.tenor.com/-hKv_xhQbQkAAAAC/anime-cry.gif",
    "https://media.tenor.com/oIDt2cYWGvQAAAAC/anime-cry.gif",
    "https://media.tenor.com/fyGVfzBMrcwAAAAC/anime-sad.gif",
    "https://media.tenor.com/W4-LR2EzAJsAAAAC/anime-cry.gif",
  ],
  happy: [
    "https://media.tenor.com/JZ8oUS0pIeIAAAAC/anime-happy.gif",
    "https://media.tenor.com/5l0wb6cjHEMAAAAC/anime-happy.gif",
    "https://media.tenor.com/TdBhtxhNNhAAAAAC/anime-happy.gif",
    "https://media.tenor.com/HsoY2mACOwoAAAAC/anime-happy.gif",
    "https://media.tenor.com/YCKWg88V0HwAAAAC/anime-happy.gif",
  ],
  dance: [
    "https://media.tenor.com/7pOSwdoHB44AAAAC/anime-dance.gif",
    "https://media.tenor.com/Iu4S37Lc3oUAAAAC/anime-dance.gif",
    "https://media.tenor.com/X-mvLtcmnSkAAAAC/anime-dance.gif",
    "https://media.tenor.com/N5lJL7Q4fJgAAAAC/anime-dance.gif",
    "https://media.tenor.com/Ge5J7E5Q-PwAAAAC/anime-dance.gif",
  ],
  wave: [
    "https://media.tenor.com/PJxPOBdksvUAAAAC/anime-wave.gif",
    "https://media.tenor.com/kPbjxXP5-CIAAAAC/anime-wave.gif",
    "https://media.tenor.com/QPrDdl9EEkkAAAAC/anime-wave.gif",
    "https://media.tenor.com/PVKnqxjRfcoAAAAC/anime-wave.gif",
    "https://media.tenor.com/I2HbHrxKRrkAAAAC/anime-wave.gif",
  ],
  wink: [
    "https://media.tenor.com/3DxCl_v0X5gAAAAC/anime-wink.gif",
    "https://media.tenor.com/EnscC23QJL4AAAAC/anime-wink.gif",
    "https://media.tenor.com/xbDxZRPGZUEAAAAC/anime-wink.gif",
    "https://media.tenor.com/r1HyJV5sJ7gAAAAC/anime-wink.gif",
    "https://media.tenor.com/AGm4ucxzZeIAAAAC/anime-wink.gif",
  ],
  punch: [
    "https://media.tenor.com/hbEhXM0PV4QAAAAC/anime-punch.gif",
    "https://media.tenor.com/IldsoFhlxF4AAAAC/anime-punch.gif",
    "https://media.tenor.com/LkpYcLM2GwUAAAAC/anime-punch.gif",
    "https://media.tenor.com/9KK6Y2tMa0EAAAAC/anime-punch.gif",
    "https://media.tenor.com/4Hrz3VyfgmwAAAAC/anime-punch.gif",
  ],
  kick: [
    "https://media.tenor.com/MCp3tg8S6XwAAAAC/anime-kick.gif",
    "https://media.tenor.com/W6PQ9zVCmzgAAAAC/anime-kick.gif",
    "https://media.tenor.com/XlrojQQYdQwAAAAC/anime-kick.gif",
    "https://media.tenor.com/nN0Q4o4mEIIAAAAC/anime-kick.gif",
    "https://media.tenor.com/hO_OpwO3ekgAAAAC/anime-kick.gif",
  ],
  bonk: [
    "https://media.tenor.com/5gRn8E_2gJEAAAAC/anime-bonk.gif",
    "https://media.tenor.com/SoO4Q1iUQbsAAAAC/anime-bonk.gif",
    "https://media.tenor.com/55v3KhEPAQQAAAAC/anime-bonk.gif",
    "https://media.tenor.com/V8nKi1m9NyMAAAAC/anime-bonk.gif",
    "https://media.tenor.com/jHtkAo7H-uYAAAAC/anime-bonk.gif",
  ],
  cringe: [
    "https://media.tenor.com/v2OKqV-Q0QQAAAAC/anime-cringe.gif",
    "https://media.tenor.com/Z2qLW-TPemMAAAAC/anime-cringe.gif",
    "https://media.tenor.com/JQfRkJ6e3CkAAAAC/anime-cringe.gif",
    "https://media.tenor.com/dEHL3sM1aD8AAAAC/anime-cringe.gif",
    "https://media.tenor.com/jPGS-yI4QgsAAAAC/anime-cringe.gif",
  ],
  facepalm: [
    "https://media.tenor.com/jpwxeOrpgvAAAAAC/anime-facepalm.gif",
    "https://media.tenor.com/W7tOYyOCFGsAAAAC/anime-facepalm.gif",
    "https://media.tenor.com/PIDG-OqDD7UAAAAC/anime-facepalm.gif",
    "https://media.tenor.com/Wxg0fJWoxMcAAAAC/anime-facepalm.gif",
    "https://media.tenor.com/3GwL5xC4qgsAAAAC/anime-facepalm.gif",
  ],
  think: [
    "https://media.tenor.com/Wp1WX2k_WCUAAAAC/anime-think.gif",
    "https://media.tenor.com/m1KQjT3lnHQAAAAC/anime-thinking.gif",
    "https://media.tenor.com/6jQVUuBzCqUAAAAC/anime-think.gif",
    "https://media.tenor.com/HDB6c5oqsX0AAAAC/anime-thinking.gif",
    "https://media.tenor.com/QfFNphcuPnQAAAAC/anime-think.gif",
  ],
  smile: [
    "https://media.tenor.com/dlpcoTUmoFYAAAAC/anime-smile.gif",
    "https://media.tenor.com/tyV6FWcxL6gAAAAC/anime-smile.gif",
    "https://media.tenor.com/2C2g0XBlRkAAAAAC/anime-smile.gif",
    "https://media.tenor.com/r_Yu5l3AVSEAAAAC/anime-smile.gif",
    "https://media.tenor.com/0F_PJqcvtlwAAAAC/anime-smile.gif",
  ],
  shoot: [
    "https://media.tenor.com/8eg5T4ZAh1AAAAAC/anime-gun.gif",
    "https://media.tenor.com/Fu2ZPe_aeWMAAAAC/anime-gun.gif",
    "https://media.tenor.com/Kp4f9b_8gQ0AAAAC/anime-gun.gif",
    "https://media.tenor.com/3OjlXLO9j2UAAAAC/anime-shoot.gif",
    "https://media.tenor.com/Rgg5cWTH3-QAAAAC/anime-gun.gif",
  ],
  bully: [
    "https://media.tenor.com/3lwHl4DMyMUAAAAC/anime-bully.gif",
    "https://media.tenor.com/8WL84JsNVscAAAAC/anime-tease.gif",
    "https://media.tenor.com/yEozLeJoXVIAAAAC/anime-tease.gif",
    "https://media.tenor.com/kjGjKsmwfpkAAAAC/anime-bully.gif",
    "https://media.tenor.com/L8GxZqYqpvgAAAAC/anime-tease.gif",
  ],
  nom: [
    "https://media.tenor.com/k0M0v3pUg8YAAAAC/anime-nom.gif",
    "https://media.tenor.com/B3RkKQuk9TIAAAAC/anime-eat.gif",
    "https://media.tenor.com/M_Bo_K9Q4ScAAAAC/anime-nom.gif",
    "https://media.tenor.com/RGOtQHcxGtAAAAAC/anime-eating.gif",
    "https://media.tenor.com/qdyC9Cmgv0kAAAAC/anime-eat.gif",
  ],
  yeet: [
    "https://media.tenor.com/0jEnJZbpBzEAAAAC/anime-throw.gif",
    "https://media.tenor.com/gLsnEFRdJX8AAAAC/anime-throw.gif",
    "https://media.tenor.com/qrUv38h2QHEAAAAC/anime-throw.gif",
    "https://media.tenor.com/QmTaT0R3iRYAAAAC/anime-yeet.gif",
    "https://media.tenor.com/h6lJzlGmqAYAAAAC/anime-throw.gif",
  ],
};

// Generic anime-girl fallback used when we have no themed list
const GENERIC_FALLBACK: string[] = [
  "https://media.tenor.com/tIRiwHdgu7AAAAAC/anime-girl.gif",
  "https://media.tenor.com/ECwdNcVlOWQAAAAC/anime-girl-cute.gif",
  "https://media.tenor.com/0nq3CK6QjvgAAAAC/anime-girl.gif",
  "https://media.tenor.com/jOKDJZksOQEAAAAC/anime-girl.gif",
  "https://media.tenor.com/JmnUgORK4mwAAAAC/anime-girl.gif",
  "https://media.tenor.com/sVbgFBlqOZcAAAAC/anime-girl.gif",
];

function staticPool(endpoints: string[]): string[] {
  const out: string[] = [];
  for (const ep of endpoints) {
    const list = STATIC_FALLBACK[ep];
    if (list) out.push(...list);
  }
  if (out.length === 0) out.push(...GENERIC_FALLBACK);
  return out;
}

// ─── Public API ────────────────────────────────────────────────────────────────
export interface GifLookup {
  endpoints?: string[];
  queries?: string[];
}

function chooseFresh(key: string, pool: string[]): string {
  if (pool.length === 0) return GENERIC_FALLBACK[0];
  const used = recent.get(key) ?? [];
  const fresh = pool.filter((u) => !used.includes(u));
  const chosen = pick(fresh.length > 0 ? fresh : pool);
  const next = [chosen, ...used].slice(0, RECENT_CACHE);
  recent.set(key, next);
  return chosen;
}

export async function getAnimeGif(key: string, lookup: GifLookup): Promise<string> {
  const endpoints = shuffle(lookup.endpoints ?? []);
  const queries   = shuffle(lookup.queries   ?? []);

  // 1) TENOR
  if (process.env.TENOR_API_KEY && queries.length > 0) {
    for (const q of queries.slice(0, 2)) {
      const urls = await fromTenor(q);
      if (urls.length > 0) return chooseFresh(key, urls);
    }
  }

  // 2) WAIFU.PICS — try each endpoint in parallel for speed
  if (endpoints.length > 0) {
    const tries = endpoints.slice(0, 3).map((ep) => fromWaifu(ep));
    const results = (await Promise.all(tries)).flat();
    if (results.length > 0) return chooseFresh(key, results);
  }

  // 3) NEKOS.LIFE / NEKOS.BEST
  if (endpoints.length > 0) {
    const tries = endpoints.slice(0, 3).map((ep) => fromNekosLife(ep));
    const results = (await Promise.all(tries)).flat();
    if (results.length > 0) return chooseFresh(key, results);
  }

  // 4) STATIC FALLBACK — always available
  return chooseFresh(key, staticPool(endpoints));
}

// Spec-compatible alias: `await fetchAnimeGif(type)`
export async function fetchAnimeGif(type: string): Promise<string> {
  return getAnimeGif(type, {
    endpoints: [type],
    queries: [`anime ${type}`, `anime girl ${type}`, `kawaii ${type}`],
  });
}
