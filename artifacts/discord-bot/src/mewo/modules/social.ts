import type { Message } from "discord.js";
import { EmbedBuilder } from "discord.js";

type Handler = (msg: Message, args: string[]) => Promise<void>;

function err(text: string): EmbedBuilder {
  return new EmbedBuilder().setColor(0xED4245).setDescription(`❌ ${text}`);
}

// ─── SHAZAM ──────────────────────────────────────────────────────────────────

export const cmdShazam: Handler = async (msg) => {
  const attachment = msg.attachments.first();
  if (!attachment) {
    await msg.reply({ embeds: [err("Attach an audio file to identify. Usage: `mewo shazam` + audio attachment")] });
    return;
  }
  const key = process.env.AUDD_API_KEY;
  if (!key) {
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle("Shazam / Song Identify — Setup Required")
        .setDescription(
          "Set `AUDD_API_KEY` in your Railway environment variables.\n\n" +
          "Get a free key (500 requests/month) at [audd.io](https://audd.io).\n\n" +
          "Attach an audio file (mp3, wav, etc.) to identify a song."
        )
        .setFooter({ text: "mewo • shazam" })
      ],
    });
    return;
  }
  const thinking = await msg.reply({
    embeds: [new EmbedBuilder().setColor(0x1DB954).setDescription("🎵 Identifying song...")]
  });
  try {
    const audioRes = await fetch(attachment.url);
    const audioBuf = await audioRes.arrayBuffer();
    const form = new FormData();
    form.append("api_token", key);
    form.append("return", "spotify");
    form.append("file", new Blob([audioBuf]), attachment.name ?? "audio.mp3");
    const res = await fetch("https://api.audd.io/", { method: "POST", body: form });
    const data = await res.json() as {
      status: string;
      result?: {
        title: string;
        artist: string;
        album: string;
        release_date: string;
        label: string;
        timecode: string;
        spotify?: { external_urls?: { spotify?: string }; album?: { images?: Array<{ url: string }> } };
      };
      error?: { error_code: number; error_message: string };
    };
    if (data.status !== "success" || !data.result) {
      const msg2 = data.error?.error_message ?? "No match found. Try a clearer audio clip.";
      await thinking.edit({ embeds: [err(msg2)] });
      return;
    }
    const r = data.result;
    const embed = new EmbedBuilder()
      .setColor(0x1DB954)
      .setTitle(`🎵 ${r.title}`)
      .addFields(
        { name: "Artist", value: r.artist, inline: true },
        { name: "Album", value: r.album || "N/A", inline: true },
        { name: "Released", value: r.release_date || "N/A", inline: true },
        { name: "Label", value: r.label || "N/A", inline: true },
        { name: "Matched at", value: r.timecode || "N/A", inline: true }
      )
      .setFooter({ text: "mewo • shazam • AudD" });
    const art = r.spotify?.album?.images?.[0]?.url;
    if (art) embed.setThumbnail(art);
    const spotifyUrl = r.spotify?.external_urls?.spotify;
    if (spotifyUrl) embed.addFields({ name: "Spotify", value: `[Listen on Spotify](${spotifyUrl})`, inline: false });
    await thinking.edit({ embeds: [embed] });
  } catch (e) {
    await thinking.edit({ embeds: [err(`Shazam error: ${(e as Error).message}`)] });
  }
};

// ─── BYPASS ──────────────────────────────────────────────────────────────────

export const cmdBypass: Handler = async (msg, args) => {
  if (!args.length) {
    await msg.reply({ embeds: [err("Provide a URL. Usage: `mewo bypass <url>`")] });
    return;
  }
  let url = args[0];
  if (!url.startsWith("http")) url = "https://" + url;
  const thinking = await msg.reply({
    embeds: [new EmbedBuilder().setColor(0xFEE75C).setDescription("🔓 Resolving URL...")]
  });
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MewoBot/1.0)" },
    });
    const finalUrl = res.url !== url ? res.url : url;
    const domain = new URL(finalUrl).hostname;
    const archiveUrl = `https://archive.ph/newest/${finalUrl}`;
    const twelveUrl = `https://12ft.io/proxy?q=${encodeURIComponent(finalUrl)}`;
    await thinking.edit({
      embeds: [new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle("🔓 Link Bypass")
        .addFields(
          { name: "Original URL", value: url.slice(0, 200), inline: false },
          { name: "Resolved URL", value: finalUrl !== url ? finalUrl.slice(0, 200) : "*(no redirect)*", inline: false },
          { name: "Domain", value: domain, inline: true },
          { name: "Status", value: `${res.status} ${res.statusText}`, inline: true },
          { name: "Bypass Options", value: `[archive.ph](${archiveUrl})\n[12ft.io Reader](${twelveUrl})`, inline: false }
        )
        .setFooter({ text: "mewo • bypass" })
      ],
    });
  } catch (e) {
    await thinking.edit({ embeds: [err(`Bypass failed: ${(e as Error).message}`)] });
  }
};

// ─── USERNAME CHECKS ─────────────────────────────────────────────────────────

interface PlatformCheck {
  name: string;
  url: string;
  emoji: string;
}

const SOCIALSCAN_PLATFORMS: PlatformCheck[] = [
  { name: "GitHub", url: "https://github.com/{}", emoji: "💻" },
  { name: "Reddit", url: "https://www.reddit.com/user/{}", emoji: "🤖" },
  { name: "Twitch", url: "https://www.twitch.tv/{}", emoji: "💜" },
  { name: "Steam", url: "https://steamcommunity.com/id/{}", emoji: "🎮" },
  { name: "Pinterest", url: "https://www.pinterest.com/{}/", emoji: "📌" },
  { name: "Replit", url: "https://replit.com/@{}", emoji: "🔄" },
  { name: "Hacker News", url: "https://news.ycombinator.com/user?id={}", emoji: "🟠" },
];

const SHERLOCK_PLATFORMS: PlatformCheck[] = [
  { name: "GitHub", url: "https://github.com/{}", emoji: "💻" },
  { name: "Reddit", url: "https://www.reddit.com/user/{}", emoji: "🤖" },
  { name: "Twitch", url: "https://www.twitch.tv/{}", emoji: "💜" },
  { name: "Steam", url: "https://steamcommunity.com/id/{}", emoji: "🎮" },
  { name: "Pinterest", url: "https://www.pinterest.com/{}/", emoji: "📌" },
  { name: "Replit", url: "https://replit.com/@{}", emoji: "🔄" },
  { name: "Hacker News", url: "https://news.ycombinator.com/user?id={}", emoji: "🟠" },
  { name: "Keybase", url: "https://keybase.io/{}", emoji: "🔑" },
  { name: "Pastebin", url: "https://pastebin.com/u/{}", emoji: "📋" },
  { name: "npm", url: "https://www.npmjs.com/~{}", emoji: "📦" },
  { name: "PyPI", url: "https://pypi.org/user/{}/", emoji: "🐍" },
  { name: "Docker Hub", url: "https://hub.docker.com/u/{}", emoji: "🐳" },
];

async function checkPlatform(platform: PlatformCheck, username: string): Promise<{ found: boolean; url: string }> {
  const url = platform.url.replace("{}", encodeURIComponent(username));
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MewoBot/1.0)" },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return { found: res.ok && res.status < 400, url };
  } catch {
    return { found: false, url };
  }
}

export const cmdSocialscan: Handler = async (msg, args) => {
  const username = args[0];
  if (!username) {
    await msg.reply({ embeds: [err("Provide a username. Usage: `mewo socialscan <username>`")] });
    return;
  }
  const thinking = await msg.reply({
    embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription(`🔍 Scanning \`${username}\` across platforms...`)]
  });
  try {
    const results = await Promise.all(SOCIALSCAN_PLATFORMS.map(p => checkPlatform(p, username)));
    const found = SOCIALSCAN_PLATFORMS.filter((_, i) => results[i].found);
    const notFound = SOCIALSCAN_PLATFORMS.filter((_, i) => !results[i].found);
    const foundText = found.length
      ? found.map((p, i) => `${p.emoji} [${p.name}](${results[SOCIALSCAN_PLATFORMS.indexOf(p)].url})`).join("\n")
      : "*None found*";
    const notFoundText = notFound.length
      ? notFound.map(p => `${p.emoji} ${p.name}`).join("\n")
      : "*All found!*";
    await thinking.edit({
      embeds: [new EmbedBuilder()
        .setColor(found.length > 0 ? 0x57F287 : 0xED4245)
        .setTitle(`SocialScan — \`${username}\``)
        .addFields(
          { name: `✅ Found (${found.length})`, value: foundText.slice(0, 1024), inline: true },
          { name: `❌ Not Found (${notFound.length})`, value: notFoundText.slice(0, 1024), inline: true }
        )
        .setFooter({ text: `mewo • socialscan • ${SOCIALSCAN_PLATFORMS.length} platforms checked` })
      ],
    });
  } catch (e) {
    await thinking.edit({ embeds: [err(`Scan failed: ${(e as Error).message}`)] });
  }
};

export const cmdSherlock: Handler = async (msg, args) => {
  const username = args[0];
  if (!username) {
    await msg.reply({ embeds: [err("Provide a username. Usage: `mewo sherlock <username>`")] });
    return;
  }
  const thinking = await msg.reply({
    embeds: [new EmbedBuilder().setColor(0xFEE75C).setDescription(`🕵️ Running Sherlock OSINT on \`${username}\`...`)]
  });
  try {
    const results = await Promise.all(SHERLOCK_PLATFORMS.map(p => checkPlatform(p, username)));
    const found = SHERLOCK_PLATFORMS.filter((_, i) => results[i].found);
    const notFound = SHERLOCK_PLATFORMS.filter((_, i) => !results[i].found);
    const foundText = found.length
      ? found.map(p => `${p.emoji} [${p.name}](${results[SHERLOCK_PLATFORMS.indexOf(p)].url})`).join("\n")
      : "*None found*";
    const notFoundText = notFound.length
      ? notFound.map(p => `${p.emoji} ~~${p.name}~~`).join("\n")
      : "*All found!*";
    const percent = Math.round((found.length / SHERLOCK_PLATFORMS.length) * 100);
    const bar = "█".repeat(Math.round(percent / 10)) + "░".repeat(10 - Math.round(percent / 10));
    await thinking.edit({
      embeds: [new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle(`🕵️ Sherlock OSINT — \`${username}\``)
        .setDescription(`**Presence:** \`${bar}\` ${percent}% (${found.length}/${SHERLOCK_PLATFORMS.length} platforms)`)
        .addFields(
          { name: `✅ Accounts Found (${found.length})`, value: foundText.slice(0, 1024), inline: true },
          { name: `❌ Not Present (${notFound.length})`, value: notFoundText.slice(0, 1024), inline: true }
        )
        .setFooter({ text: `mewo • sherlock • ${SHERLOCK_PLATFORMS.length} platforms • OSINT tool` })
      ],
    });
  } catch (e) {
    await thinking.edit({ embeds: [err(`Sherlock failed: ${(e as Error).message}`)] });
  }
};
