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
const FULL_BAR = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
const SOFT_BAR = "─────  ◆  ─────";
const CARD_BAR = "╾──────────────────────╼";
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
  if (rank === 1) return 0xfacc15;
  if (rank === 2) return 0xcbd5e1;
  if (rank === 3) return 0xf97316;
  return 0x7c3aed;
}

function rankBadge(rank: number): string {
  if (rank === 1) return "CROWN SEED";
  if (rank === 2) return "ELITE SEED";
  if (rank === 3) return "VANGUARD SEED";
  return "RANKED SEED";
}

function rankMedal(rank: number): string {
  if (rank === 1) return "♛";
  if (rank === 2) return "◆";
  if (rank === 3) return "◇";
  return "◈";
}

function stageTier(stage: string): string {
  if (stage.includes("High Strong")) return "S-TIER";
  if (stage.includes("High Stable")) return "A-TIER";
  if (stage.includes("High Weak")) return "B-TIER";
  if (stage.includes("Mid Strong")) return "C-TIER";
  if (stage.includes("Mid Stable")) return "D-TIER";
  return "ENTRY";
}

function buildHeaderEmbed(totalPlayers: number): EmbedBuilder {
  const now = Math.floor(Date.now() / 1000);
  const visible = Math.min(totalPlayers, MAX_PLAYER_CARDS);
  const hidden = Math.max(totalPlayers - MAX_PLAYER_CARDS, 0);

  return new EmbedBuilder()
    .setColor(0x05070d)
    .setAuthor({ name: "LAST STAND // ELITE KILL RANKINGS" })
    .setTitle("♛  TOP-KILLS // OPERATOR INDEX")
    .setDescription(
      `\`\`\`ansi\n` +
      `╔════════════════════════════════════╗\n` +
      `║        LAST STAND KILL BOARD       ║\n` +
      `║      PRECISION • POWER • STATUS    ║\n` +
      `╚════════════════════════════════════╝\n` +
      `\`\`\`\n` +
      `${FULL_BAR}\n` +
      `**${visible} ACTIVE OPERATOR${visible === 1 ? "" : "S"} DISPLAYED**${hidden > 0 ? `  •  **${hidden} IN RESERVE**` : ""}\n` +
      `\`RANK\`       \`IDENTITY\`       \`ROLE\`       \`KILLS\`       \`STAGE\`\n` +
      `${FULL_BAR}`
    )
    .setImage("attachment://fixedbulletlines.gif")
    .setFooter({ text: `Last Stand Competitive Division  •  Live board refreshed ${new Date(now * 1000).toLocaleString()}` });
}

function buildEmptyEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x111827)
    .setTitle("◇  NO OPERATORS LOCKED IN")
    .setDescription(
      `${CARD_BAR}\n` +
      `Use \`/addkillplayer\` to build the first premium stat card.\n\n` +
      `Each card supports rank, display identity, Roblox username, Discord username, role, kills, stage, and right-side avatar art.\n` +
      `${CARD_BAR}`
    )
    .setFooter({ text: "Awaiting first ranked combatant" });
}

function buildPlayerEmbed(player: KillPlayer): EmbedBuilder {
  const kills = compactKills(player.killCount);
  const embed = new EmbedBuilder()
    .setColor(rankAccent(player.rank))
    .setAuthor({ name: `${rankMedal(player.rank)}  ${rankBadge(player.rank)}  //  RANK ${paddedRank(player.rank)}` })
    .setTitle(`${player.displayName.toUpperCase()}  ⟡  ${kills} KILLS`)
    .setDescription(
      `\`\`\`ansi\n` +
      `╭─ ELITE COMBAT CARD ───────────────╮\n` +
      `│  #${paddedRank(player.rank)}  ${player.displayName.slice(0, 24).padEnd(24, " ")} │\n` +
      `╰───────────────────────────────────╯\n` +
      `\`\`\`\n` +
      `**IDENTITY**\n` +
      `╭ ${SOFT_BAR}\n` +
      `┃  **Roblox**  \`{user_LS_${player.robloxUsername}}\`\n` +
      `┃  **Discord** \`${player.discordUsername}\`\n` +
      `╰ ${SOFT_BAR}\n\n` +
      `**PERFORMANCE MATRIX**\n` +
      `╭ ${SOFT_BAR}\n` +
      `┃  **Role**   \`${player.rolePosition}\`\n` +
      `┃  **Kills**  \`${kills}\`  ▸  \`${player.killCount.toLocaleString()} total\`\n` +
      `┃  **Stage**  \`${player.stage}\`  ▸  \`${stageTier(player.stage)}\`\n` +
      `╰ ${SOFT_BAR}\n` +
      `${CARD_BAR}`
    )
    .addFields(
      { name: "RANK", value: `\`#${paddedRank(player.rank)}\``, inline: true },
      { name: "KILLS", value: `\`${kills}\``, inline: true },
      { name: "CLASS", value: `\`${stageTier(player.stage)}\``, inline: true }
    )
    .setFooter({ text: `${player.rolePosition}  •  Last Stand Kill Division` });

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