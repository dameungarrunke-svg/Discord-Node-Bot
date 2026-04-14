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
const MAX_PLAYER_CARDS = 10;
const ADMIN_PERMS = PermissionFlagsBits.ManageGuild;

export const setupKillLeaderboardData = new SlashCommandBuilder()
  .setName("setupkillleaderboard")
  .setDescription("Create the permanent kill leaderboard message in this channel. (Admin only)")
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

function makeDividerAttachment(): AttachmentBuilder {
  return new AttachmentBuilder(DIVIDER_GIF, { name: "fixedbulletlines.gif" });
}

function buildEmptyEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x252530)
    .setTitle("No players added yet")
    .setDescription("Use `/addkillplayer` to add the first player.");
}

function buildPlayerEmbed(player: KillPlayer): EmbedBuilder {
  const kills = compactKills(player.killCount);
  const embed = new EmbedBuilder()
    .setColor(0x252530)
    .setTitle(`${player.rank} - ${player.displayName}`)
    .setDescription(
      `│  ${player.robloxUsername}  │\n` +
      `≪≪  |  ${player.discordUsername}  |  ≫≫\n` +
      `≪≪  •  ${player.position}  •  ≫≫\n` +
      `Kill Count : ${kills}\n` +
      `Stage : ${player.stage}`
    )
    .setImage("attachment://fixedbulletlines.gif");

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
  const embeds: EmbedBuilder[] = [];

  if (players.length === 0) {
    embeds.push(buildEmptyEmbed());
  } else {
    embeds.push(...players.slice(0, MAX_PLAYER_CARDS).map(buildPlayerEmbed));
  }

  return {
    embeds,
    files: players.length > 0 ? [makeDividerAttachment()] : [],
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
        content: `✅ Kill leaderboard refreshed:\n${existingMessage.url}`,
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
    content: `✅ Kill leaderboard created:\n${message.url}`,
  });
}