import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import {
  clearKillPinnedMessage,
  getKillPinnedMessage,
  getKillPlayers,
  KillPinnedMessage,
  KillPlayer,
  setKillPinnedMessage,
} from "./store.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIVIDER_GIF = readFileSync(resolve(__dirname, "fixedbulletlines.gif"));
const MAX_PLAYER_CARDS = 9;
const ADMIN_PERMS = PermissionFlagsBits.ManageGuild;

export const setupKillLeaderboardData = new SlashCommandBuilder()
  .setName("setupkillleaderboard")
  .setDescription("Deploy the permanent premium kill leaderboard in this channel. (Admin only)")
  .setDefaultMemberPermissions(ADMIN_PERMS);

function isValidUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function compactKills(kills: number): string {
  if (kills >= 1_000_000) return `${(kills / 1_000_000).toFixed(kills % 1_000_000 === 0 ? 0 : 1)}M`;
  if (kills >= 1_000) return `${(kills / 1_000).toFixed(kills % 1_000 === 0 ? 0 : 1)}K`;
  return kills.toLocaleString();
}

function paddedRank(rank: number): string {
  return rank.toString().padStart(2, "0");
}

function makeDividerAttachment(): AttachmentBuilder {
  return new AttachmentBuilder(DIVIDER_GIF, { name: "fixedbulletlines.gif" });
}

function rankAccent(rank: number): number {
  return 0x000000;
}

function rankBadge(rank: number): string {
  if (rank === 1) return "TOP PLAYER";
  if (rank === 2) return "ELITE PLAYER";
  if (rank === 3) return "PRO PLAYER";
  return "TSB PLAYER";
}

function rankMedal(rank: number): string {
  if (rank === 1) return "★";
  if (rank === 2) return "◆";
  if (rank === 3) return "◇";
  return "•";
}

function buildHeaderEmbed(totalPlayers: number): EmbedBuilder {
  const now = Math.floor(Date.now() / 1000);
  const visible = Math.min(totalPlayers, MAX_PLAYER_CARDS);
  const hidden = Math.max(totalPlayers - MAX_PLAYER_CARDS, 0);

  return new EmbedBuilder()
    .setColor(0x000000)
    .setAuthor({ name: "LAST STAND  ·  TSB KILL LEADERBOARD" })
    .setTitle("Top-Kills")
    .setDescription(
      `Premium TSB player cards.\n` +
      `Showing **${visible}** player${visible === 1 ? "" : "s"}${hidden > 0 ? ` · **${hidden}** more saved` : ""}.`
    )
    .setFooter({ text: `Last Stand  •  Updated ${new Date(now * 1000).toLocaleString()}` });
}

function buildEmptyEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x000000)
    .setTitle("No players added yet")
    .setDescription(
      `Use \`/addkillplayer\` to add the first TSB player card.`
    )
    .setFooter({ text: "Last Stand  •  TSB Kill Leaderboard" });
}

function buildPlayerEmbed(player: KillPlayer): EmbedBuilder {
  const kills = compactKills(player.killCount);
  const embed = new EmbedBuilder()
    .setColor(rankAccent(player.rank))
    .setAuthor({ name: `${rankMedal(player.rank)}  Rank #${paddedRank(player.rank)}  ·  ${rankBadge(player.rank)}` })
    .setTitle(player.displayName)
    .setDescription(
      `**Roblox:** \`${player.robloxUsername}\`\n` +
      `**Discord:** \`${player.discordUsername}\`\n\n` +
      `**Rank:** #${player.rank}\n` +
      `**Role:** ${player.rolePosition}\n` +
      `**Kills:** ${kills}\n` +
      `**Stage:** ${player.stage}`
    )
    .setImage("attachment://fixedbulletlines.gif")
    .setFooter({ text: "Last Stand  •  TSB Player Card" });

  if (isValidUrl(player.avatarUrl)) {
    embed.setThumbnail(player.avatarUrl);
  }

  return embed;
}

export function buildKillLeaderboardPayload(): {
  embeds: EmbedBuilder[];
  files: AttachmentBuilder[];
} {
  const players = getKillPlayers();
  const embeds = [buildHeaderEmbed(players.length)];

  if (players.length === 0) {
    embeds.push(buildEmptyEmbed());
  } else {
    embeds.push(...players.slice(0, MAX_PLAYER_CARDS).map(buildPlayerEmbed));
  }

  return {
    embeds,
    files: [makeDividerAttachment()],
  };
}

export async function refreshPinnedKillLeaderboard(client: Client): Promise<void> {
  const pinned = getKillPinnedMessage();
  if (!pinned) return;

  const guild = await client.guilds.fetch(pinned.guildId).catch(() => null);
  if (!guild) {
    clearKillPinnedMessage();
    return;
  }

  const channel = (await guild.channels.fetch(pinned.channelId).catch(() => null)) as TextChannel | null;
  if (!channel || !channel.isTextBased()) {
    clearKillPinnedMessage();
    return;
  }

  const message = await channel.messages.fetch(pinned.messageId).catch(() => null);
  if (!message) {
    clearKillPinnedMessage();
    return;
  }

  const payload = buildKillLeaderboardPayload();
  await message.edit({
    embeds: payload.embeds,
    files: payload.files,
    attachments: [],
  });
}

export async function executeSetupKillLeaderboard(
  interaction: ChatInputCommandInteraction,
  client: Client
): Promise<void> {
  const channel = interaction.channel as TextChannel | null;
  if (!channel || !channel.isTextBased()) {
    await interaction.editReply({ content: "❌ Cannot post a kill leaderboard in this channel." });
    return;
  }

  const me = interaction.guild?.members.me;
  if (!me?.permissionsIn(channel).has(PermissionFlagsBits.SendMessages)) {
    await interaction.editReply({ content: "❌ I do not have permission to send messages in this channel." });
    return;
  }

  const pinned = getKillPinnedMessage();
  if (pinned && pinned.guildId === interaction.guildId) {
    const existingChannel = (await interaction.guild?.channels.fetch(pinned.channelId).catch(() => null)) as TextChannel | null;
    const existingMessage = existingChannel
      ? await existingChannel.messages.fetch(pinned.messageId).catch(() => null)
      : null;

    if (existingMessage) {
      const payload = buildKillLeaderboardPayload();
      await existingMessage.edit({ embeds: payload.embeds, files: payload.files, attachments: [] });
      await interaction.editReply({
        content:
          `✅ Premium kill leaderboard already exists and was refreshed:\n${existingMessage.url}\n\n` +
          `Use \`/addkillplayer\`, \`/editkillplayer\`, and \`/removekillplayer\` to manage it.`,
      });
      return;
    }
  }

  const payload = buildKillLeaderboardPayload();
  const message = await channel.send(payload);
  await message.pin().catch(() => {});

  const saved: KillPinnedMessage = {
    guildId: interaction.guildId!,
    channelId: channel.id,
    messageId: message.id,
  };
  setKillPinnedMessage(saved);

  await interaction.editReply({
    content:
      `✅ Premium kill leaderboard deployed:\n${message.url}\n\n` +
      `This is now the permanent kill leaderboard message and will update automatically.`,
  });
}