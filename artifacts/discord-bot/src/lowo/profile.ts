import type { Message } from "discord.js";
import { AttachmentBuilder } from "discord.js";
import { getUser, allUsers } from "./storage.js";
import { ANIMAL_BY_ID, PITY_THRESHOLD, BACKGROUND_BY_ID } from "./data.js";
import { generateProfileCard } from "./profileCard.js";
import { isCensored } from "./censor.js";

export async function cmdProfile(message: Message): Promise<void> {
  const target = message.mentions.users.first() ?? message.author;
  const u = getUser(target.id);
  const animals = Object.values(u.zoo).reduce((a, b) => a + b, 0);
  const married = u.marriedTo ? `<@${u.marriedTo}>` : "single";
  const bg = BACKGROUND_BY_ID[u.background ?? "bg_dark"]?.name ?? "Midnight";
  const pityPct = Math.min(100, Math.floor(((u.pity ?? 0) / PITY_THRESHOLD) * 100));
  await message.reply([
    `👤 **${target.username}'s Lowo Profile**`,
    u.tag ? `*"${u.tag}"*` : null,
    `💰 Cowoncy: **${u.cowoncy.toLocaleString()}**  •  ✨ Essence: **${u.essence.toLocaleString()}**`,
    `🐾 Animals: **${animals}** (${u.dex.length} unique)  •  🗡️ Weapons: **${u.weapons.length}**`,
    `🦊 Pet streak: **${u.pet.streak}**  •  🥕 Garden: **${u.piku.harvested}**  •  🎟️ Tickets: **${u.lotteryTickets}**`,
    `🔥 Daily streak: **${u.dailyStreak}**  •  ⭐ Rep: **${u.rep}**`,
    `🌟 Pity: **${u.pity}/${PITY_THRESHOLD}** (${pityPct}%)  •  🖼️ BG: **${bg}**`,
    `💍 Married to: ${married}`,
    `\n_Try \`lowo card\` for the visual version._`,
  ].filter(Boolean).join("\n"));
}

export async function cmdCard(message: Message): Promise<void> {
  const target = message.mentions.users.first() ?? message.author;
  try {
    const buf = await generateProfileCard(target);
    const file = new AttachmentBuilder(buf, { name: `lowo-card-${target.id}.png` });
    const ch = message.channel;
    if ("send" in ch) {
      await ch.send({ content: `🪪 **${target.username}'s Lowo Card**`, files: [file] });
    } else {
      await message.reply({ files: [file] });
    }
  } catch (err) {
    console.error("[LOWO CARD]", err);
    await message.reply("⚠️ Couldn't render card right now — try again in a sec.");
  }
}

export async function cmdLevel(message: Message): Promise<void> {
  const target = message.mentions.users.first() ?? message.author;
  const u = getUser(target.id);
  const xp = u.cowoncy + u.essence * 10 + Object.values(u.zoo).reduce((a, b) => a + b, 0) * 5;
  const level = Math.floor(Math.sqrt(xp / 100));
  const nextXp = Math.pow(level + 1, 2) * 100;
  await message.reply(`📈 **${target.username}** — Lowo Level **${level}**\nXP: ${xp.toLocaleString()} / ${nextXp.toLocaleString()}`);
}

export async function cmdAvatar(message: Message): Promise<void> {
  const target = message.mentions.users.first() ?? message.author;
  await message.reply(target.displayAvatarURL({ size: 512 }));
}

export async function cmdWallpaper(message: Message): Promise<void> {
  await message.reply("🖼️ Buy a background from `lowo shop`, then apply it with `lowo setbg <id>`. View card with `lowo card`.");
}

export async function cmdEmoji(message: Message, args: string[]): Promise<void> {
  const e = args[0];
  if (!e) { await message.reply("Usage: `lowo emoji <emoji>`"); return; }
  await message.reply(e);
}

export async function cmdCookie(message: Message): Promise<void> {
  const target = message.mentions.users.first();
  if (target && target.id !== message.author.id) {
    await message.reply(`🍪 **${message.author.username}** gives **${target.username}** a cookie!`);
  } else {
    await message.reply(`🍪 **${message.author.username}** has a cookie!`);
  }
}

export async function cmdPray(message: Message): Promise<void> {
  const target = message.mentions.users.first();
  const blessed = Math.random() < 0.5;
  if (blessed && target) await message.reply(`🙏 **${message.author.username}** prays for **${target.username}** — they feel blessed! ✨`);
  else if (target) await message.reply(`🙏 **${message.author.username}** prays for **${target.username}** — but the gods are silent...`);
  else await message.reply(`🙏 **${message.author.username}** prays — ${blessed ? "blessed!" : "the gods are silent..."}`);
}

export async function cmdCurse(message: Message): Promise<void> {
  if (isCensored(message.guildId)) {
    await message.reply("🤫 `lowo curse` is censored on this server.");
    return;
  }
  const target = message.mentions.users.first();
  if (!target) { await message.reply("Usage: `lowo curse @user`"); return; }
  const cursed = Math.random() < 0.5;
  await message.reply(`😈 **${message.author.username}** curses **${target.username}** — ${cursed ? "they are cursed! 💀" : "the curse fizzles."}`);
}

// Rankings — now with rep and tag display
export async function cmdTop(message: Message, args: string[]): Promise<void> {
  const users = allUsers();
  const kind = (args[0] ?? "cowoncy").toLowerCase();
  const sorter: Record<string, (u: ReturnType<typeof getUser>) => number> = {
    cowoncy: (u) => u.cowoncy,
    essence: (u) => u.essence,
    dex:     (u) => u.dex.length,
    animals: (u) => Object.values(u.zoo).reduce((a, b) => a + b, 0),
    rep:     (u) => u.rep ?? 0,
    streak:  (u) => u.dailyStreak ?? 0,
  };
  const fn = sorter[kind] ?? sorter.cowoncy;
  const sorted = Object.entries(users)
    .map(([id, u]) => ({ id, score: fn(u), tag: u.tag }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  if (sorted.length === 0) { await message.reply("📊 Empty leaderboard."); return; }
  const lines = sorted.map((s, i) => `**${i + 1}.** <@${s.id}>${s.tag ? ` *"${s.tag.slice(0, 24)}"*` : ""} — ${s.score.toLocaleString()}`);
  await message.reply(`🏆 **Top Lowo (${kind})**\n${lines.join("\n")}\n\n_Try: \`cowoncy | essence | dex | animals | rep | streak\`_`);
}

export async function cmdMy(message: Message): Promise<void> {
  await cmdProfile(message);
}
