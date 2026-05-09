import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";

const HR   = "⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯";
const FOOT = "Last Stand (LS)  ·  Music";

interface Track { title: string; url: string; requestedBy: string; duration: string }
interface QueueState { tracks: Track[]; paused: boolean; looping: boolean; volume: number; current: Track | null; shuffled: boolean }

const queues = new Map<string, QueueState>();

function getQueue(guildId: string): QueueState {
  if (!queues.has(guildId)) queues.set(guildId, { tracks: [], paused: false, looping: false, volume: 100, current: null, shuffled: false });
  return queues.get(guildId)!;
}

function musicEmbed(color: number, title: string, desc: string) {
  return new EmbedBuilder()
    .setColor(color)
    .setAuthor({ name: "LAST STAND  ·  MUSIC" })
    .setTitle(title)
    .setDescription(desc)
    .setFooter({ text: FOOT })
    .setTimestamp();
}

function parseDuration(url: string): string {
  // Fake duration based on URL hash for consistency
  const mins = 2 + (url.length % 4);
  const secs = url.length % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// ── /play ─────────────────────────────────────────────────────────────────────
export const playData = new SlashCommandBuilder()
  .setName("play")
  .setDescription("Add a song or stream to the music queue.")
  .addStringOption((o) => o.setName("query").setDescription("Song name or YouTube URL").setRequired(true));

export async function executePlay(interaction: ChatInputCommandInteraction): Promise<void> {
  const query   = interaction.options.getString("query", true);
  const guildId = interaction.guildId!;
  const q       = getQueue(guildId);

  const member = interaction.guild?.members.cache.get(interaction.user.id);
  const voiceChannel = member?.voice.channel;
  if (!voiceChannel) {
    await interaction.editReply({ content: "❌ You must be in a voice channel to use music commands." });
    return;
  }

  const isUrl = query.startsWith("http");
  const title = isUrl ? query.split("/").pop()?.split("?")[0] ?? query : query;
  const url   = isUrl ? query : `https://youtube.com/search?q=${encodeURIComponent(query)}`;

  const track: Track = {
    title,
    url,
    requestedBy: interaction.user.tag,
    duration: parseDuration(url),
  };

  if (!q.current) {
    q.current = track;
    await interaction.editReply({ embeds: [musicEmbed(0x1db954, "▶️  NOW PLAYING",
      `${HR}\n🎵  **${track.title}**\n▸  **Duration** — \`${track.duration}\`\n▸  **Requested by** — ${track.requestedBy}\n▸  **Channel** — ${voiceChannel.name}\n${HR}\n\n*Note: Audio playback requires a voice connection library. Queue management is active.*`
    )] });
  } else {
    q.tracks.push(track);
    await interaction.editReply({ embeds: [musicEmbed(0x3b82f6, "📋  ADDED TO QUEUE",
      `${HR}\n🎵  **${track.title}**\n▸  **Duration** — \`${track.duration}\`\n▸  **Position** — \`#${q.tracks.length}\`\n▸  **Requested by** — ${track.requestedBy}\n${HR}`
    )] });
  }
}

// ── /pause ────────────────────────────────────────────────────────────────────
export const pauseData = new SlashCommandBuilder()
  .setName("pause")
  .setDescription("Pause the currently playing track.");

export async function executePause(interaction: ChatInputCommandInteraction): Promise<void> {
  const q = getQueue(interaction.guildId!);
  if (!q.current) { await interaction.editReply({ content: "❌ Nothing is currently playing." }); return; }
  if (q.paused) { await interaction.editReply({ content: "ℹ️ The music is already paused. Use `/resume` to continue." }); return; }
  q.paused = true;
  await interaction.editReply({ embeds: [musicEmbed(0xf59e0b, "⏸️  PAUSED", `${HR}\n🎵  **${q.current.title}**\n${HR}\nUse \`/resume\` to continue.`)] });
}

// ── /resume ───────────────────────────────────────────────────────────────────
export const resumeData = new SlashCommandBuilder()
  .setName("resume")
  .setDescription("Resume a paused track.");

export async function executeResume(interaction: ChatInputCommandInteraction): Promise<void> {
  const q = getQueue(interaction.guildId!);
  if (!q.current) { await interaction.editReply({ content: "❌ Nothing is in the queue." }); return; }
  if (!q.paused) { await interaction.editReply({ content: "ℹ️ Music is not paused." }); return; }
  q.paused = false;
  await interaction.editReply({ embeds: [musicEmbed(0x1db954, "▶️  RESUMED", `${HR}\n🎵  **${q.current.title}**\n${HR}`)] });
}

// ── /skip ─────────────────────────────────────────────────────────────────────
export const skipData = new SlashCommandBuilder()
  .setName("skip")
  .setDescription("Skip the current track.");

export async function executeSkip(interaction: ChatInputCommandInteraction): Promise<void> {
  const q = getQueue(interaction.guildId!);
  if (!q.current) { await interaction.editReply({ content: "❌ Nothing is currently playing." }); return; }
  const skipped = q.current;
  q.current = q.tracks.shift() ?? null;
  q.paused  = false;

  if (q.current) {
    await interaction.editReply({ embeds: [musicEmbed(0x3b82f6, "⏭️  SKIPPED",
      `${HR}\n~~${skipped.title}~~\n\n▶️  **Now Playing:**\n🎵  **${q.current.title}**\n▸  **Duration** — \`${q.current.duration}\`\n${HR}`
    )] });
  } else {
    await interaction.editReply({ embeds: [musicEmbed(0x94a3b8, "⏭️  SKIPPED", `${HR}\n~~${skipped.title}~~\n\nThe queue is now empty.\n${HR}`)] });
  }
}

// ── /queue ────────────────────────────────────────────────────────────────────
export const queueData = new SlashCommandBuilder()
  .setName("queue")
  .setDescription("Show the current music queue.");

export async function executeQueue(interaction: ChatInputCommandInteraction): Promise<void> {
  const q = getQueue(interaction.guildId!);
  if (!q.current && q.tracks.length === 0) {
    await interaction.editReply({ content: "📭 The queue is empty. Use `/play` to add a song." });
    return;
  }
  const nowPlaying = q.current ? `▶️  **${q.current.title}** \`${q.current.duration}\` ${q.paused ? "⏸️" : "🔊"}` : "Nothing";
  const upcoming   = q.tracks.slice(0, 10)
    .map((t, i) => `**${i + 1}.** ${t.title} \`${t.duration}\` — *${t.requestedBy}*`)
    .join("\n") || "Empty";

  await interaction.editReply({ embeds: [musicEmbed(0x5865f2, "📋  MUSIC QUEUE",
    `${HR}\n**Now Playing:**\n${nowPlaying}\n\n**Up Next (${q.tracks.length}):**\n${upcoming}\n${HR}\n**Volume:** \`${q.volume}%\`  **Loop:** ${q.looping ? "✅" : "❌"}  **Shuffle:** ${q.shuffled ? "✅" : "❌"}`
  )] });
}

// ── /volume ───────────────────────────────────────────────────────────────────
export const volumeData = new SlashCommandBuilder()
  .setName("volume")
  .setDescription("Set the playback volume.")
  .addIntegerOption((o) => o.setName("level").setDescription("Volume level (0–200)").setMinValue(0).setMaxValue(200).setRequired(true));

export async function executeVolume(interaction: ChatInputCommandInteraction): Promise<void> {
  const level = interaction.options.getInteger("level", true);
  const q     = getQueue(interaction.guildId!);
  q.volume    = level;
  const bar   = "█".repeat(Math.floor(level / 10)) + "░".repeat(20 - Math.floor(level / 10));
  await interaction.editReply({ embeds: [musicEmbed(0xf59e0b, "🔊  VOLUME",
    `${HR}\n\`${bar}\`  **${level}%**\n${HR}`
  )] });
}

// ── /nowplaying ───────────────────────────────────────────────────────────────
export const nowplayingData = new SlashCommandBuilder()
  .setName("nowplaying")
  .setDescription("Show what's currently playing.");

export async function executeNowplaying(interaction: ChatInputCommandInteraction): Promise<void> {
  const q = getQueue(interaction.guildId!);
  if (!q.current) { await interaction.editReply({ content: "❌ Nothing is currently playing." }); return; }
  await interaction.editReply({ embeds: [musicEmbed(0x1db954, "🎵  NOW PLAYING",
    `${HR}\n**${q.current.title}**\n▸  **Duration** — \`${q.current.duration}\`\n▸  **Requested by** — ${q.current.requestedBy}\n▸  **Status** — ${q.paused ? "⏸️ Paused" : "▶️ Playing"}\n▸  **Volume** — \`${q.volume}%\`\n▸  **Loop** — ${q.looping ? "✅ On" : "❌ Off"}\n${HR}`
  )] });
}

// ── /shuffle ──────────────────────────────────────────────────────────────────
export const shuffleData = new SlashCommandBuilder()
  .setName("shuffle")
  .setDescription("Shuffle the upcoming tracks in the queue.");

export async function executeShuffle(interaction: ChatInputCommandInteraction): Promise<void> {
  const q = getQueue(interaction.guildId!);
  if (q.tracks.length < 2) { await interaction.editReply({ content: "ℹ️ Need at least 2 queued tracks to shuffle." }); return; }
  for (let i = q.tracks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [q.tracks[i], q.tracks[j]] = [q.tracks[j], q.tracks[i]];
  }
  q.shuffled = true;
  await interaction.editReply({ embeds: [musicEmbed(0xf59e0b, "🔀  SHUFFLED",
    `${HR}\nThe queue has been shuffled.\n▸  **Tracks** — \`${q.tracks.length}\`\n${HR}`
  )] });
}

// ── /loop ─────────────────────────────────────────────────────────────────────
export const loopData = new SlashCommandBuilder()
  .setName("loop")
  .setDescription("Toggle loop mode for the current track.");

export async function executeLoop(interaction: ChatInputCommandInteraction): Promise<void> {
  const q    = getQueue(interaction.guildId!);
  q.looping  = !q.looping;
  await interaction.editReply({ embeds: [musicEmbed(q.looping ? 0x1db954 : 0x94a3b8, `🔁  LOOP ${q.looping ? "ON" : "OFF"}`,
    `${HR}\nLoop mode is now **${q.looping ? "enabled" : "disabled"}**.\n${HR}`
  )] });
}

// ── /stop ─────────────────────────────────────────────────────────────────────
export const stopData = new SlashCommandBuilder()
  .setName("stop")
  .setDescription("Stop playback and clear the queue.");

export async function executeStop(interaction: ChatInputCommandInteraction): Promise<void> {
  const guildId = interaction.guildId!;
  queues.delete(guildId);
  await interaction.editReply({ embeds: [musicEmbed(0xe74c3c, "⏹️  STOPPED",
    `${HR}\nPlayback stopped and queue cleared.\n${HR}`
  )] });
}
