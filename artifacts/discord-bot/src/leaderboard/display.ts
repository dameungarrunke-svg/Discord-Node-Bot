import {
  EmbedBuilder,
  ChatInputCommandInteraction,
  Client,
  TextChannel,
  PermissionFlagsBits,
} from "discord.js";
import {
  getPlayers,
  LeaderboardPlayer,
  STAGE_RANK_COLORS,
  STAGE_RANK_EMOJI,
  getPinnedMessage,
  setPinnedMessage,
  PinnedMessage,
} from "./store.js";

const MAX_CARDS = 10;

const POSITION_MEDALS: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

function positionLabel(pos: number): string {
  return POSITION_MEDALS[pos] ?? `#${pos}`;
}

function buildPlayerEmbed(player: LeaderboardPlayer): EmbedBuilder {
  const color = STAGE_RANK_COLORS[player.stageRank];
  const rankEmoji = STAGE_RANK_EMOJI[player.stageRank];

  return new EmbedBuilder()
    .setColor(color)
    .setAuthor({
      name: `${positionLabel(player.position)}  ${player.displayName}`,
      iconURL: player.avatarUrl || undefined,
    })
    .setThumbnail(player.avatarUrl || null)
    .addFields(
      { name: "🎮  Roblox", value: `\`${player.robloxUsername}\``, inline: true },
      { name: "💬  Discord", value: `\`${player.discordUsername}\``, inline: true },
      { name: "🌍  Country", value: player.country, inline: true },
      {
        name: `${rankEmoji}  Stage Rank`,
        value: `**${player.stageRank}**`,
        inline: true,
      }
    );
}

export function buildPermanentPayload(): {
  content: string;
  embeds: EmbedBuilder[];
} {
  const allPlayers = getPlayers();
  const displayPlayers = allPlayers.slice(0, MAX_CARDS);
  const extra = allPlayers.length - displayPlayers.length;

  const now = Math.floor(Date.now() / 1000);

  const headerLines = [
    "⚔️  **THE STRONGEST BATTLEGROUNDS  —  OFFICIAL LEADERBOARD**",
    "",
    "🏆 High Strong  ·  🥇 High Stable  ·  🥈 Mid Strong  ·  🥉 Mid Stable  ·  ⚔️ Weak Stable",
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  Last updated: <t:${now}:R>`,
  ];

  if (extra > 0) {
    headerLines.push(`*...and ${extra} more player${extra > 1 ? "s" : ""} not shown.*`);
  }

  if (displayPlayers.length === 0) {
    headerLines.push("\n*No players have been added yet.*");
  }

  return {
    content: headerLines.join("\n"),
    embeds: displayPlayers.map(buildPlayerEmbed),
  };
}

export async function refreshPinnedLeaderboard(client: Client): Promise<void> {
  const pinned = getPinnedMessage();
  if (!pinned) return;

  try {
    const guild = await client.guilds.fetch(pinned.guildId).catch(() => null);
    if (!guild) return;

    const channel = (await guild.channels.fetch(pinned.channelId).catch(() => null)) as TextChannel | null;
    if (!channel || !channel.isTextBased()) return;

    const message = await channel.messages.fetch(pinned.messageId).catch(() => null);
    if (!message) return;

    const payload = buildPermanentPayload();
    await message.edit({ content: payload.content, embeds: payload.embeds });
  } catch (err) {
    console.error("Failed to refresh pinned leaderboard:", err);
  }
}

export async function executeSetupLeaderboard(
  interaction: ChatInputCommandInteraction,
  client: Client
): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const channel = interaction.channel as TextChannel | null;
  if (!channel) {
    await interaction.editReply({ content: "❌ Could not find the channel." });
    return;
  }

  const me = interaction.guild?.members.me;
  if (!me?.permissionsIn(channel).has(PermissionFlagsBits.SendMessages)) {
    await interaction.editReply({
      content: "❌ I don't have permission to send messages in this channel.",
    });
    return;
  }

  const existing = getPinnedMessage();
  if (existing && existing.channelId === channel.id) {
    try {
      const old = await channel.messages.fetch(existing.messageId).catch(() => null);
      if (old) {
        await interaction.editReply({
          content: `✅ A leaderboard is already pinned in this channel: https://discord.com/channels/${existing.guildId}/${existing.channelId}/${existing.messageId}\n\nUse \`/addleaderboardplayer\`, \`/editleaderboardplayer\`, or \`/removeleaderboardplayer\` to update it automatically.`,
        });
        return;
      }
    } catch {
      // message no longer exists, proceed to create a new one
    }
  }

  const payload = buildPermanentPayload();
  const msg = await channel.send({ content: payload.content, embeds: payload.embeds });

  await msg.pin().catch(() => {});

  const pinned: PinnedMessage = {
    guildId: interaction.guildId!,
    channelId: channel.id,
    messageId: msg.id,
  };
  setPinnedMessage(pinned);

  await interaction.editReply({
    content: `✅ Leaderboard deployed and pinned: ${msg.url}\n\nIt will auto-update whenever you add, edit, or remove players.`,
  });
}
