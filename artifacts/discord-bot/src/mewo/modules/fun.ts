import type { Message } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { evaluate } from "mathjs";

type Handler = (msg: Message, args: string[]) => Promise<void>;

function err(text: string): EmbedBuilder {
  return new EmbedBuilder().setColor(0xED4245).setDescription(`❌ ${text}`);
}

function pct(seed: string): number {
  let h = 5381;
  for (const c of seed) h = ((h << 5) + h) ^ c.charCodeAt(0);
  return Math.abs(h) % 101;
}

const EIGHTBALL = [
  "It is certain.", "It is decidedly so.", "Without a doubt.", "Yes, definitely.",
  "You may rely on it.", "As I see it, yes.", "Most likely.", "Outlook good.",
  "Yes.", "Signs point to yes.", "Reply hazy, try again.", "Ask again later.",
  "Better not tell you now.", "Cannot predict now.", "Concentrate and ask again.",
  "Don't count on it.", "My reply is no.", "My sources say no.",
  "Outlook not so good.", "Very doubtful.",
];

export const cmd8ball: Handler = async (msg, args) => {
  if (!args.length) {
    await msg.reply({ embeds: [err("Provide a question. Usage: `mewo 8ball <question>`")] });
    return;
  }
  const idx = Math.floor(Math.random() * EIGHTBALL.length);
  const response = EIGHTBALL[idx];
  const color = idx < 10 ? 0x57F287 : idx < 15 ? 0xFEE75C : 0xED4245;
  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(color)
      .setAuthor({ name: "Magic 8Ball", iconURL: msg.client.user.displayAvatarURL() })
      .setDescription(`**Question:** ${args.join(" ")}\n\n🎱 **${response}**`)
      .setFooter({ text: "mewo • fun" })
    ],
  });
};

export const cmdCoinflip: Handler = async (msg, args) => {
  const rounds = Math.min(parseInt(args[0] ?? "1") || 1, 10);
  let heads = 0, tails = 0;
  const results: string[] = [];
  for (let i = 0; i < rounds; i++) {
    const flip = Math.random() < 0.5;
    if (flip) heads++; else tails++;
    results.push(flip ? "Heads" : "Tails");
  }
  const embed = new EmbedBuilder()
    .setColor(0xFEE75C)
    .setTitle("Coin Flip")
    .setDescription(rounds === 1 ? `Result: **${results[0]}**` : results.map((r, i) => `Round ${i + 1}: **${r}**`).join("\n"))
    .setFooter({ text: "mewo • fun" });
  if (rounds > 1) embed.addFields({ name: "Summary", value: `Heads: **${heads}** | Tails: **${tails}**`, inline: false });
  await msg.reply({ embeds: [embed] });
};

export const cmdRate: Handler = async (msg, args) => {
  if (!args.length) {
    await msg.reply({ embeds: [err("Provide something to rate. Usage: `mewo rate <thing>`")] });
    return;
  }
  const thing = args.join(" ");
  const score = pct(msg.author.id + thing);
  const bar = "█".repeat(Math.floor(score / 10)) + "░".repeat(10 - Math.floor(score / 10));
  const color = score > 70 ? 0x57F287 : score > 40 ? 0xFEE75C : 0xED4245;
  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(color)
      .setTitle("Rating")
      .setDescription(`**${thing}**\n\n\`${bar}\` **${score}/100**`)
      .setFooter({ text: "mewo • fun" })
    ],
  });
};

async function howCmd(msg: Message, label: string, emoji: string): Promise<void> {
  const target = msg.mentions.users.first() ?? msg.author;
  const score = pct(target.id + label);
  const bar = "█".repeat(Math.floor(score / 10)) + "░".repeat(10 - Math.floor(score / 10));
  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(0xFF73FA)
      .setTitle(`${emoji} How ${label} is ${target.username}?`)
      .setDescription(`\`${bar}\` **${score}%**`)
      .setThumbnail(target.displayAvatarURL())
      .setFooter({ text: "mewo • fun" })
    ],
  });
}

export const cmdHotcalc: Handler = (msg) => howCmd(msg, "hot", "🌶️");
export const cmdHowgay: Handler = (msg) => howCmd(msg, "gay", "🏳️‍🌈");
export const cmdHowautistic: Handler = (msg) => howCmd(msg, "autistic", "🧩");

export const cmdPpsize: Handler = async (msg) => {
  const target = msg.mentions.users.first() ?? msg.author;
  const size = pct(target.id + "ppsize") % 30;
  const bar = "8" + "=".repeat(size) + "D";
  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(0xFF73FA)
      .setTitle(`PP Size — ${target.username}`)
      .setDescription(`\`${bar}\`\n**${size} cm**`)
      .setThumbnail(target.displayAvatarURL())
      .setFooter({ text: "mewo • fun" })
    ],
  });
};

export const cmdShip: Handler = async (msg) => {
  const users = msg.mentions.users;
  if (users.size < 2) {
    await msg.reply({ embeds: [err("Mention two users. Usage: `mewo ship @user1 @user2`")] });
    return;
  }
  const [u1, u2] = [...users.values()];
  const ids = [u1.id, u2.id].sort().join("");
  const score = pct(ids);
  const hearts = Math.floor(score / 20);
  const bar = "❤️".repeat(hearts) + "🖤".repeat(5 - hearts);
  const label = score >= 80 ? "Soulmates!" : score >= 60 ? "Great match!" : score >= 40 ? "Decent" : score >= 20 ? "Unlikely" : "No chemistry";
  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(0xFF0080)
      .setTitle("💞 Ship")
      .setDescription(`**${u1.username}** 💞 **${u2.username}**\n\n${bar} **${score}%** — ${label}`)
      .setFooter({ text: "mewo • fun" })
    ],
  });
};

export const cmdSay: Handler = async (msg, args) => {
  if (!args.length) {
    await msg.reply({ embeds: [err("Provide a message. Usage: `mewo say <message>`")] });
    return;
  }
  const flags = new Set(args.filter(a => a.startsWith("--")).map(a => a.slice(2)));
  let text = args.filter(a => !a.startsWith("--")).join(" ");
  if (flags.has("uwu")) {
    text = text
      .replace(/[rl]/g, "w").replace(/[RL]/g, "W")
      .replace(/n([aeiou])/g, "ny$1").replace(/N([aeiou])/g, "Ny$1")
      .replace(/ove/g, "uv");
  }
  if (flags.has("reverse")) text = text.split("").reverse().join("");
  if (!msg.channel.isSendable()) {
    await msg.reply({ embeds: [err("I can't send messages in this channel type.")] });
    return;
  }
  await msg.channel.send({ content: text.slice(0, 2000) });
  await msg.delete().catch(() => {});
};

const RIZZ_LINES = [
  "Are you a magnet? Because I'm attracted to you.",
  "Do you have a map? I keep getting lost in your eyes.",
  "Is your name Google? Because you have everything I've been searching for.",
  "Are you French? Because Eiffel for you.",
  "Are you a bank loan? Because you have my interest.",
  "Is your name WiFi? Because I'm feeling a connection.",
  "I must be a snowflake, because I've fallen for you.",
  "Are you a campfire? Because you're hot and I want s'more.",
  "Do you believe in love at first sight, or should I walk by again?",
  "Are you a parking ticket? Because you've got 'fine' written all over you.",
  "Are you a camera? Because every time I look at you, I smile.",
  "Is your name Art? Because I want to put you on my wall.",
  "Are you a dictionary? Because you add meaning to my life.",
  "Do you have sunscreen? Because you're burning me up.",
];

const ROAST_LINES = [
  "I'd roast you, but my mom said I'm not allowed to burn trash.",
  "You're like a cloud. When you disappear, it's a beautiful day.",
  "I'd agree with you, but then we'd both be wrong.",
  "You bring everyone so much joy when you leave the room.",
  "I'd explain it to you but I don't have crayons.",
  "You're proof that even evolution makes mistakes.",
  "Your secrets are safe with me. I never listen anyway.",
  "You are the human equivalent of a participation trophy.",
  "If laughter is the best medicine, your face must be curing diseases.",
  "I'm not saying I hate you, but I would unplug your life support to charge my phone.",
  "You're not stupid; you just have bad luck thinking.",
  "You're like a software update. Whenever I see you, I think 'not now'.",
];

export const cmdRizz: Handler = async (msg) => {
  const target = msg.mentions.users.first();
  const line = RIZZ_LINES[Math.floor(Math.random() * RIZZ_LINES.length)];
  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(0xFF73FA)
      .setTitle("💫 Rizz")
      .setDescription(target ? `*To **${target.username}**:*\n\n"${line}"` : `"${line}"`)
      .setFooter({ text: "mewo • fun" })
    ],
  });
};

export const cmdRoast: Handler = async (msg) => {
  const target = msg.mentions.users.first() ?? msg.author;
  const line = ROAST_LINES[Math.floor(Math.random() * ROAST_LINES.length)];
  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle(`🔥 Roast — ${target.username}`)
      .setDescription(`"${line}"`)
      .setThumbnail(target.displayAvatarURL())
      .setFooter({ text: "mewo • fun" })
    ],
  });
};

export const cmdMath: Handler = async (msg, args) => {
  if (!args.length) {
    await msg.reply({ embeds: [err("Provide an expression. Usage: `mewo math <expression>`")] });
    return;
  }
  const rawExpr = args.join(" ");
  try {
    const result = evaluate(rawExpr) as unknown;
    if (typeof result !== "number" || !isFinite(result as number)) {
      throw new Error("Not a finite number");
    }
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("Math")
        .addFields(
          { name: "Expression", value: `\`${rawExpr}\``, inline: false },
          { name: "Result", value: `\`${result}\``, inline: false }
        )
        .setFooter({ text: "mewo • fun" })
      ],
    });
  } catch {
    await msg.reply({ embeds: [err("Invalid expression. Supports `+` `-` `*` `/` `^` `sqrt()` `sin()` etc.")] });
  }
};

export const cmdAsciify: Handler = async (msg, args) => {
  if (!args.length) {
    await msg.reply({ embeds: [err("Provide text. Usage: `mewo asciify <text>`")] });
    return;
  }
  const text = args.join(" ").slice(0, 20);
  try {
    const res = await fetch(`https://artii.herokuapp.com/make?text=${encodeURIComponent(text)}&font=standard`);
    if (!res.ok) throw new Error("API error");
    const art = (await res.text()).slice(0, 1900);
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("ASCII Art")
        .setDescription(`\`\`\`\n${art}\n\`\`\``)
        .setFooter({ text: "mewo • fun" })
      ],
    });
  } catch {
    await msg.reply({ embeds: [err("Could not generate ASCII art. Try shorter text.")] });
  }
};

export const cmdUrban: Handler = async (msg, args) => {
  if (!args.length) {
    await msg.reply({ embeds: [err("Provide a query. Usage: `mewo urban <query>`")] });
    return;
  }
  const query = args.join(" ");
  try {
    const res = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(query)}`);
    const data = await res.json() as {
      list?: Array<{ word: string; definition: string; example: string; thumbs_up: number; thumbs_down: number; author: string }>;
    };
    if (!data.list?.length) {
      await msg.reply({ embeds: [err("No definitions found.")] });
      return;
    }
    const entry = data.list[0];
    const def = entry.definition.replace(/\[|\]/g, "").slice(0, 1024);
    const ex = entry.example.replace(/\[|\]/g, "").slice(0, 512) || "N/A";
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x1D82B6)
        .setTitle(entry.word)
        .setURL(`https://www.urbandictionary.com/define.php?term=${encodeURIComponent(query)}`)
        .setDescription(def)
        .addFields(
          { name: "Example", value: ex, inline: false },
          { name: "👍", value: `${entry.thumbs_up}`, inline: true },
          { name: "👎", value: `${entry.thumbs_down}`, inline: true },
          { name: "Author", value: entry.author, inline: true }
        )
        .setFooter({ text: "mewo • fun • Urban Dictionary" })
      ],
    });
  } catch {
    await msg.reply({ embeds: [err("Could not reach Urban Dictionary.")] });
  }
};

export const cmdLyrics: Handler = async (msg, args) => {
  if (!args.length) {
    await msg.reply({ embeds: [err("Provide a song name. Usage: `mewo lyrics <song>`")] });
    return;
  }
  const query = args.join(" ");
  try {
    const res = await fetch(`https://lyrist.vercel.app/api/${encodeURIComponent(query)}`);
    const data = await res.json() as { title?: string; artist?: string; lyrics?: string; image?: string };
    if (!data.lyrics) {
      await msg.reply({ embeds: [err("No lyrics found. Try `Artist Name - Song Title` format.")] });
      return;
    }
    const lyrics = data.lyrics.slice(0, 2048);
    const embed = new EmbedBuilder()
      .setColor(0x1DB954)
      .setTitle(data.title ?? query)
      .setDescription(lyrics)
      .setFooter({ text: `mewo • fun${data.artist ? ` • ${data.artist}` : ""}` });
    if (data.image) embed.setThumbnail(data.image);
    await msg.reply({ embeds: [embed] });
  } catch {
    await msg.reply({ embeds: [err("Could not fetch lyrics. Try `Artist - Song Title` format.")] });
  }
};

export const cmdNitro: Handler = async (msg) => {
  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle("A wild gift appeared!")
      .setDescription("**Discord Nitro** — 1 Month Gift\n\nSomeone just sent you a Nitro subscription!")
      .setImage("https://i.imgur.com/w9aiD6F.png")
      .setFooter({ text: "mewo • fun • Expires in 48 hours" })
    ],
  });
};

export const cmdBadtranslate: Handler = async (msg, args) => {
  if (!args.length) {
    await msg.reply({ embeds: [err("Provide text. Usage: `mewo badtranslate <text>`")] });
    return;
  }
  const original = args.join(" ");
  const langChain = ["fr", "de", "ja", "ko", "ar", "ru", "es"].sort(() => Math.random() - 0.5).slice(0, 4);
  langChain.push("en");
  let text = original;
  let prev = "en";
  const steps: string[] = [];
  try {
    for (const lang of langChain) {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${prev}|${lang}`);
      const d = await res.json() as { responseData?: { translatedText?: string }; responseStatus?: number };
      if (d.responseData?.translatedText) text = d.responseData.translatedText;
      if (lang !== "en") steps.push(lang.toUpperCase());
      prev = lang;
    }
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xFF73FA)
        .setTitle("Bad Translate")
        .addFields(
          { name: "Original", value: original.slice(0, 1024), inline: false },
          { name: `Chain: EN → ${steps.join(" → ")} → EN`, value: text.slice(0, 1024), inline: false }
        )
        .setFooter({ text: "mewo • fun" })
      ],
    });
  } catch {
    await msg.reply({ embeds: [err("Translation chain failed. Try shorter text.")] });
  }
};

function emojiToHex(emoji: string): string | null {
  const codePoints = [...emoji].map(c => c.codePointAt(0)?.toString(16)).filter(Boolean);
  if (!codePoints.length) return null;
  return codePoints.join("-").replace(/-fe0f/g, "");
}

const EMOJI_KITCHEN_DATES = [
  "20230803", "20230301", "20220815", "20220406", "20210831", "20210521",
];

async function findEmojiKitchenUrl(hex1: string, hex2: string): Promise<string | null> {
  for (const date of EMOJI_KITCHEN_DATES) {
    const urlA = `https://www.gstatic.com/android/keyboard/emojikitchen/${date}/u${hex1}/u${hex1}_u${hex2}.png`;
    try {
      const r = await fetch(urlA, { method: "HEAD" });
      if (r.ok) return urlA;
    } catch { /* continue */ }
    const urlB = `https://www.gstatic.com/android/keyboard/emojikitchen/${date}/u${hex2}/u${hex2}_u${hex1}.png`;
    try {
      const r = await fetch(urlB, { method: "HEAD" });
      if (r.ok) return urlB;
    } catch { /* continue */ }
  }
  return null;
}

export const cmdEmojimix: Handler = async (msg, args) => {
  if (args.length < 2) {
    await msg.reply({ embeds: [err("Provide two emojis. Usage: `mewo emojimix <emoji1> <emoji2>`")] });
    return;
  }
  const e1 = args[0];
  const e2 = args[1];
  const hex1 = emojiToHex(e1);
  const hex2 = emojiToHex(e2);
  if (!hex1 || !hex2) {
    await msg.reply({ embeds: [err("Could not parse one or both emojis. Use standard Unicode emojis.")] });
    return;
  }
  const imageUrl = await findEmojiKitchenUrl(hex1, hex2);
  if (!imageUrl) {
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xFF73FA)
        .setTitle("Emoji Mix")
        .setDescription(`No mix found for ${e1} + ${e2}.\n\nTry different emojis, or visit [Emoji Kitchen](https://emojikitchen.dev/) to explore combos.`)
        .setFooter({ text: "mewo • fun • Google Emoji Kitchen" })
      ],
    });
    return;
  }
  await msg.reply({
    embeds: [new EmbedBuilder()
      .setColor(0xFF73FA)
      .setTitle(`Emoji Mix — ${e1} + ${e2}`)
      .setImage(imageUrl)
      .setFooter({ text: "mewo • fun • Google Emoji Kitchen" })
    ],
  });
};
