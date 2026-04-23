// Anime GIF fetcher. Uses keyless public APIs (waifu.pics + nekos.best) as
// primary sources, and Tenor (if TENOR_API_KEY is set) as a query-based fallback
// for commands without a dedicated anime endpoint. A small per-key cache prevents
// repeated identical GIFs back-to-back.

const FALLBACK_GIF =
  "https://media.tenor.com/MQXzqVqXl0wAAAAC/anime-girl.gif";

const cache = new Map<string, string[]>();

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function fetchJson(url: string, timeoutMs = 4000): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

// ─── waifu.pics ────────────────────────────────────────────────────────────────
const WAIFU_ENDPOINTS = new Set([
  "bully","cuddle","cry","hug","awoo","kiss","lick","pat","smug","bonk",
  "yeet","blush","smile","wave","highfive","handhold","nom","bite","glomp",
  "slap","kill","kick","happy","wink","poke","dance","cringe",
]);

async function fromWaifu(endpoint: string): Promise<string | null> {
  if (!WAIFU_ENDPOINTS.has(endpoint)) return null;
  try {
    const data = await fetchJson(`https://api.waifu.pics/sfw/${endpoint}`) as { url?: string };
    return data?.url ?? null;
  } catch { return null; }
}

// ─── nekos.best ────────────────────────────────────────────────────────────────
const NEKOS_ENDPOINTS = new Set([
  "baka","bite","blush","bored","cry","cuddle","dance","facepalm","feed",
  "handhold","happy","highfive","hug","kick","kiss","laugh","lurk","nod",
  "nom","nope","pat","peck","poke","pout","punch","shoot","shrug","slap",
  "sleep","smile","smug","stare","think","thumbsup","tickle","wave","wink",
  "yawn","yeet",
]);

async function fromNekos(endpoint: string): Promise<string | null> {
  if (!NEKOS_ENDPOINTS.has(endpoint)) return null;
  try {
    const data = await fetchJson(`https://nekos.best/api/v2/${endpoint}`) as
      { results?: { url?: string }[] };
    return data?.results?.[0]?.url ?? null;
  } catch { return null; }
}

// ─── Tenor (optional, keyless attempt then keyed) ──────────────────────────────
async function fromTenor(query: string): Promise<string | null> {
  const key = process.env.TENOR_API_KEY;
  if (!key) return null;
  try {
    const url =
      `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}` +
      `&key=${key}&limit=20&media_filter=gif&random=true`;
    const data = await fetchJson(url) as
      { results?: { media_formats?: { gif?: { url?: string } } }[] };
    const list = (data?.results ?? [])
      .map((r) => r?.media_formats?.gif?.url)
      .filter((u): u is string => typeof u === "string");
    if (list.length === 0) return null;
    return pick(list);
  } catch { return null; }
}

// ─── Public API ────────────────────────────────────────────────────────────────
export interface GifLookup {
  /** Anime endpoints to try (waifu.pics / nekos.best names). */
  endpoints?: string[];
  /** Text queries for Tenor fallback. */
  queries?: string[];
}

export async function getAnimeGif(key: string, lookup: GifLookup): Promise<string> {
  const tries: Promise<string | null>[] = [];
  const endpoints = (lookup.endpoints ?? []).slice();
  const queries   = (lookup.queries   ?? []).slice();

  // Shuffle to vary results
  endpoints.sort(() => Math.random() - 0.5);
  queries.sort(() => Math.random() - 0.5);

  // Pick up to 3 endpoints in parallel for speed + variety
  for (const ep of endpoints.slice(0, 3)) {
    tries.push(fromWaifu(ep));
    tries.push(fromNekos(ep));
  }
  for (const q of queries.slice(0, 2)) {
    tries.push(fromTenor(q));
  }

  const results = (await Promise.all(tries)).filter((u): u is string => !!u);

  // Avoid repeating the most recent GIF for this key
  const recent = cache.get(key) ?? [];
  let chosen: string | null = null;
  const fresh = results.filter((u) => !recent.includes(u));
  if (fresh.length > 0)        chosen = pick(fresh);
  else if (results.length > 0) chosen = pick(results);
  else                         chosen = FALLBACK_GIF;

  // Update cache (keep last 5)
  const next = [chosen, ...recent].slice(0, 5);
  cache.set(key, next);

  return chosen;
}
