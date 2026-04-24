import type { Message } from "discord.js";

const EIGHTBALL = [
  "Yes.", "No.", "Definitely.", "Absolutely not.", "Ask again later.",
  "It is certain.", "Without a doubt.", "Very doubtful.", "Outlook good.",
  "Don't count on it.", "Most likely.", "Cannot predict now.", "Signs point to yes.",
  "My sources say no.", "Probably.", "Better not tell you now.",
];

export async function cmd8ball(m: Message, args: string[]): Promise<void> {
  if (args.length === 0) { await m.reply("Usage: `lowo 8b <question>`"); return; }
  await m.reply(`🎱 ${EIGHTBALL[Math.floor(Math.random() * EIGHTBALL.length)]}`);
}

export async function cmdRoll(m: Message, args: string[]): Promise<void> {
  const arg = args[0] ?? "100";
  const dice = arg.match(/^(\d+)d(\d+)$/i);
  if (dice) {
    const n = Math.min(20, parseInt(dice[1], 10));
    const sides = Math.min(1000, parseInt(dice[2], 10));
    const rolls = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * sides));
    await m.reply(`🎲 ${arg} → [${rolls.join(", ")}] = **${rolls.reduce((a,b)=>a+b,0)}**`);
    return;
  }
  const max = Math.max(1, parseInt(arg, 10) || 100);
  await m.reply(`🎲 You rolled **${1 + Math.floor(Math.random() * max)}** (1-${max})`);
}

export async function cmdChoose(m: Message, args: string[]): Promise<void> {
  const text = args.join(" ");
  const opts = text.split(/[,|]/).map(s => s.trim()).filter(Boolean);
  if (opts.length < 2) { await m.reply("Usage: `lowo choose a, b, c`"); return; }
  await m.reply(`🤔 I choose: **${opts[Math.floor(Math.random() * opts.length)]}**`);
}

export async function cmdDefine(m: Message, args: string[]): Promise<void> {
  const word = args.join(" ").trim();
  if (!word) { await m.reply("Usage: `lowo define <word>`"); return; }
  try {
    const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!r.ok) { await m.reply(`📖 No definition found for **${word}**.`); return; }
    const data = await r.json() as Array<{ meanings: Array<{ partOfSpeech: string; definitions: Array<{ definition: string }> }> }>;
    const first = data?.[0]?.meanings?.[0];
    if (!first) { await m.reply(`📖 No definition found for **${word}**.`); return; }
    await m.reply(`📖 **${word}** *(${first.partOfSpeech})*\n${first.definitions[0].definition}`);
  } catch { await m.reply(`📖 Couldn't fetch a definition right now.`); }
}

export async function cmdGif(m: Message, args: string[]): Promise<void> {
  const q = args.join(" ").trim() || "cute";
  const key = process.env.TENOR_API_KEY;
  if (!key) { await m.reply(`🖼️ GIF search needs \`TENOR_API_KEY\`. Try \`lowo pic\` for animal pics.`); return; }
  try {
    const r = await fetch(`https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q)}&key=${key}&limit=20&random=true`);
    const data = await r.json() as { results?: Array<{ media_formats?: { gif?: { url: string } } }> };
    const url = data.results?.[Math.floor(Math.random() * (data.results?.length || 1))]?.media_formats?.gif?.url;
    if (!url) { await m.reply(`🖼️ No GIF found for "${q}".`); return; }
    await m.reply(url);
  } catch { await m.reply("🖼️ GIF lookup failed."); }
}

export async function cmdPic(m: Message, args: string[]): Promise<void> {
  const kind = (args[0] ?? "cat").toLowerCase();
  try {
    if (kind === "dog") {
      const r = await fetch("https://dog.ceo/api/breeds/image/random");
      const d = await r.json() as { message: string };
      await m.reply(d.message); return;
    }
    const r = await fetch("https://api.thecatapi.com/v1/images/search");
    const d = await r.json() as Array<{ url: string }>;
    await m.reply(d[0].url);
  } catch { await m.reply("🖼️ Failed to fetch a picture."); }
}

export async function cmdTranslate(m: Message, args: string[]): Promise<void> {
  await m.reply(`🌐 Translation needs an external API key. Try \`lowo lowoify <text>\` for the OwO translator!`);
}

export async function cmdBell(m: Message): Promise<void> {
  await m.reply("🔔 *DING DING DING!* 🔔");
}

export async function cmdMath(m: Message, args: string[]): Promise<void> {
  const expr = args.join(" ").trim();
  if (!expr) { await m.reply("Usage: `lowo math <expression>` e.g. `lowo math 5*(3+2)`"); return; }
  if (!/^[\d\s+\-*/().%]+$/.test(expr)) { await m.reply("❌ Only numbers and `+ - * / ( ) %` allowed."); return; }
  try {
    const result = Function(`"use strict"; return (${expr});`)();
    await m.reply(`🧮 \`${expr}\` = **${result}**`);
  } catch { await m.reply("❌ Invalid expression."); }
}

export async function cmdColor(m: Message, args: string[]): Promise<void> {
  const input = args[0]?.replace("#", "");
  let hex: string;
  if (input && /^[0-9a-f]{6}$/i.test(input)) hex = input.toLowerCase();
  else hex = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
  const url = `https://singlecolorimage.com/get/${hex}/200x200`;
  await m.reply(`🎨 \`#${hex.toUpperCase()}\`\n${url}`);
}

export async function cmdPing(m: Message): Promise<void> {
  const sent = await m.reply("🏓 Pinging...");
  const lat = sent.createdTimestamp - m.createdTimestamp;
  await sent.edit(`🏓 Pong! Latency: **${lat}ms**`);
}

export async function cmdStats(m: Message): Promise<void> {
  const u = process.uptime();
  const days = Math.floor(u / 86400), h = Math.floor((u % 86400) / 3600), min = Math.floor((u % 3600) / 60);
  const mem = Math.round(process.memoryUsage().rss / 1024 / 1024);
  await m.reply(`📊 **Bot Stats**\nUptime: **${days}d ${h}h ${min}m**\nMemory: **${mem} MB**\nServers: **${m.client.guilds.cache.size}**`);
}
