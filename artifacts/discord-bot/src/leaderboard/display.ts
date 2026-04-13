import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  ChatInputCommandInteraction,
  InteractionEditReplyOptions,
} from "discord.js";
import {
  getPlayers,
  LeaderboardPlayer,
  STAGE_RANK_COLORS,
  STAGE_RANK_EMOJI,
} from "./store.js";

const PAGE_SIZE = 5;

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
      {
        name: "🎮  Roblox",
        value: `\`${player.robloxUsername}\``,
        inline: true,
      },
      {
        name: "💬  Discord",
        value: `\`${player.discordUsername}\``,
        inline: true,
      },
      {
        name: "🌍  Country",
        value: player.country,
        inline: true,
      },
      {
        name: `${rankEmoji}  Stage Rank`,
        value: `**${player.stageRank}**`,
        inline: true,
      }
    );
}

function buildNavEmbed(
  page: number,
  totalPages: number,
  totalPlayers: number
): EmbedBuilder {
  const start = page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, totalPlayers);

  return new EmbedBuilder()
    .setColor(0xc0392b)
    .setTitle("⚔️  THE STRONGEST BATTLEGROUNDS — LEADERBOARD")
    .setDescription(
      `**Top Ranked Players**\n` +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
        `Showing positions **#${start}–#${end}** of **${totalPlayers}** players\n` +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
        "**Stage Ranks:**  🏆 High Strong  ·  🥇 High Stable  ·  🥈 Mid Strong  ·  🥉 Mid Stable  ·  ⚔️ Weak Stable"
    )
    .setFooter({
      text: `The Strongest Battlegrounds  •  Page ${page + 1} / ${totalPages}`,
    })
    .setTimestamp();
}

function buildComponents(
  page: number,
  totalPages: number
): ActionRowBuilder<ButtonBuilder>[] {
  if (totalPages <= 1) return [];

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`lb_goto_${page - 1}`)
      .setLabel("◀  Previous")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`lb_goto_${page + 1}`)
      .setLabel("Next  ▶")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1)
  );

  return [row];
}

export function buildLeaderboardPayload(
  page: number
): InteractionEditReplyOptions & { page: number; totalPages: number } {
  const players = getPlayers();

  if (players.length === 0) {
    return {
      page: 0,
      totalPages: 0,
      embeds: [
        new EmbedBuilder()
          .setColor(0xc0392b)
          .setTitle("⚔️  TSB Leaderboard")
          .setDescription(
            "No players have been added yet.\n\nAdmins can use `/addleaderboardplayer` to add players."
          )
          .setTimestamp(),
      ],
      components: [],
    };
  }

  const totalPages = Math.ceil(players.length / PAGE_SIZE);
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const pagePlayers = players.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE
  );

  const navEmbed = buildNavEmbed(safePage, totalPages, players.length);
  const playerEmbeds = pagePlayers.map(buildPlayerEmbed);

  return {
    page: safePage,
    totalPages,
    embeds: [navEmbed, ...playerEmbeds],
    components: buildComponents(safePage, totalPages),
  };
}

export async function handleLeaderboardButton(
  interaction: ButtonInteraction
): Promise<void> {
  const match = interaction.customId.match(/^lb_goto_(\d+)$/);
  if (!match) return;

  const targetPage = parseInt(match[1], 10);
  await interaction.deferUpdate();

  const payload = buildLeaderboardPayload(targetPage);
  await interaction.editReply({
    embeds: payload.embeds,
    components: payload.components,
  });
}

export async function executeLeaderboard(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  await interaction.deferReply();
  const payload = buildLeaderboardPayload(0);
  await interaction.editReply({
    embeds: payload.embeds,
    components: payload.components,
  });
}
