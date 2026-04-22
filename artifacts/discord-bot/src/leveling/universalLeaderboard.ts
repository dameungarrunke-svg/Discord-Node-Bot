import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuInteraction,
  ButtonInteraction,
  MessageFlags,
} from "discord.js";
import { getAllUsers, UserData } from "./db.js";
import { computeLevel } from "./engine.js";
import { generateLeaderboardCard, LeaderboardEntry } from "../leaderboardCard.js";

// ─── Categories ───────────────────────────────────────────────────────────────

type Category = "overall" | "voice" | "reactions" | "weekly" | "monthly";

const CATEGORY_META: Record<
  Category,
  { label: string; title: string; description: string }
> = {
  overall:   { label: "Overall XP",  title: "Overall XP Highlights",   description: "All-time XP" },
  voice:     { label: "Voice Time",  title: "Voice Time Highlights",   description: "Top voice activity" },
  reactions: { label: "Reactions",   title: "Reactions Highlights",    description: "Most reactions" },
  weekly:    { label: "Weekly",      title: "Weekly XP Highlights",    description: "Last 7 days" },
  monthly:   { label: "Monthly",     title: "Monthly XP Highlights",   description: "Last 30 days" },
};

const CATEGORY_ORDER: Category[] = ["overall", "voice", "reactions", "weekly", "monthly"];

const PER_PAGE = 10;
const HEADER_LINE = "**LAST STAND  `|`  AS  `|`  IND**";

// ─── Slash command data ───────────────────────────────────────────────────────

export const universalLeaderboardData = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("View the universal server leaderboard.");

// ─── Sorting per category ─────────────────────────────────────────────────────

interface RankedUser {
  userId: string;
  user: UserData;
  primary: number;
  level: number;
}

function rankUsers(
  guildId: string,
  category: Category,
): RankedUser[] {
  const all = getAllUsers(guildId);

  const mapped: RankedUser[] = all.map((u) => {
    const level = computeLevel(u.totalXp).level;
    let primary = 0;
    switch (category) {
      case "overall":   primary = u.totalXp; break;
      case "weekly":    primary = u.weeklyXp; break;
      // No dedicated trackers — fall back to total XP so leaderboard is never empty.
      case "monthly":   primary = u.totalXp; break;
      case "voice":     primary = u.totalXp; break;
      case "reactions": primary = u.totalXp; break;
    }
    return { userId: u.userId, user: u, primary, level };
  });

  return mapped
    .filter((r) => r.primary > 0)
    .sort((a, b) => b.primary - a.primary);
}

// ─── Build embed + components ─────────────────────────────────────────────────

async function buildEntries(
  interaction: ChatInputCommandInteraction | StringSelectMenuInteraction | ButtonInteraction,
  ranked: RankedUser[],
  category: Category,
  page: number,
): Promise<LeaderboardEntry[]> {
  const slice = ranked.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  return await Promise.all(
    slice.map(async (r, idx) => {
      let username = r.userId;
      let avatarURL: string | null = null;
      try {
        const member = await interaction.guild!.members.fetch(r.userId).catch(() => null);
        if (member) {
          username = member.user.username;
          avatarURL = member.user.displayAvatarURL({ extension: "png", size: 64 });
        }
      } catch { /* ignore */ }

      let col1Label = "LVL";
      let col1Value = `+${r.level}`;
      let col2Label = "XP";
      let col2Value = `+${r.primary.toLocaleString()}`;

      if (category === "weekly") {
        const cur = computeLevel(r.user.totalXp).level;
        const prev = computeLevel(Math.max(0, r.user.totalXp - r.user.weeklyXp)).level;
        col1Value = `+${Math.max(0, cur - prev)}`;
      }

      return {
        rank: page * PER_PAGE + idx + 1,
        avatarURL,
        username,
        col1Label,
        col1Value,
        col2Label,
        col2Value,
      };
    }),
  );
}

function buildComponents(
  category: Category,
  page: number,
  totalPages: number,
  guildId: string,
  channelId: string,
): ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] {
  const rows: ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] = [];

  // Top: a "View leaderboard ↗" link button (decorative, opens current channel)
  const linkRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel("View leaderboard ↗")
      .setURL(`https://discord.com/channels/${guildId}/${channelId}`),
  );
  rows.push(linkRow);

  // Bottom: select menu showing current category as placeholder
  const select = new StringSelectMenuBuilder()
    .setCustomId(`ulb_select:${page}`)
    .setPlaceholder(`${CATEGORY_META[category].label}   ›`)
    .addOptions(
      CATEGORY_ORDER.map((c) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(CATEGORY_META[c].label)
          .setValue(c)
          .setDescription(CATEGORY_META[c].description)
          .setDefault(c === category),
      ),
    );
  rows.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select));

  // Pagination row (only if more than one page)
  if (totalPages > 1) {
    const prev = new ButtonBuilder()
      .setCustomId(`ulb_prev:${category}:${page}`)
      .setStyle(ButtonStyle.Secondary)
      .setLabel("‹ Previous")
      .setDisabled(page <= 0);
    const indicator = new ButtonBuilder()
      .setCustomId("ulb_page_indicator")
      .setStyle(ButtonStyle.Secondary)
      .setLabel(`Page ${page + 1} / ${totalPages}`)
      .setDisabled(true);
    const next = new ButtonBuilder()
      .setCustomId(`ulb_next:${category}:${page}`)
      .setStyle(ButtonStyle.Secondary)
      .setLabel("Next ›")
      .setDisabled(page >= totalPages - 1);
    rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(prev, indicator, next));
  }

  return rows;
}

async function renderPayload(
  interaction: ChatInputCommandInteraction | StringSelectMenuInteraction | ButtonInteraction,
  category: Category,
  page: number,
): Promise<{
  content: string;
  embeds: EmbedBuilder[];
  files: AttachmentBuilder[];
  components: ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[];
}> {
  const guildId = interaction.guildId!;
  const channelId = interaction.channelId!;
  const ranked = rankUsers(guildId, category);

  const totalPages = Math.max(1, Math.ceil(ranked.length / PER_PAGE));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);

  const meta = CATEGORY_META[category];

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setDescription(
      `${HEADER_LINE}\n\u200B`,
    )
    .setFooter({ text: `Last Stand Management  ·  ${meta.label}` });

  const files: AttachmentBuilder[] = [];

  if (ranked.length === 0) {
    embed.addFields({
      name: meta.title,
      value: "No data yet for this category. Once members start earning XP it will appear here.",
    });
  } else {
    const entries = await buildEntries(interaction, ranked, category, safePage);
    const buf = await generateLeaderboardCard(meta.title, entries);
    files.push(new AttachmentBuilder(buf, { name: "leaderboard.png" }));
    embed.setImage("attachment://leaderboard.png");
  }

  const components = buildComponents(category, safePage, totalPages, guildId, channelId);

  return {
    content: HEADER_LINE,
    embeds: [embed],
    files,
    components,
  };
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

export async function executeUniversalLeaderboard(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const payload = await renderPayload(interaction, "weekly", 0);
  await interaction.editReply({
    content: payload.content,
    embeds: payload.embeds,
    files: payload.files,
    components: payload.components,
  });
}

export async function handleUniversalLeaderboardSelect(
  interaction: StringSelectMenuInteraction,
): Promise<void> {
  // customId format: ulb_select:<page>
  const parts = interaction.customId.split(":");
  const page = Number.parseInt(parts[1] ?? "0", 10) || 0;
  const value = interaction.values[0] as Category;
  const category: Category = CATEGORY_ORDER.includes(value) ? value : "weekly";

  const payload = await renderPayload(interaction, category, page);
  await interaction.editReply({
    content: payload.content,
    embeds: payload.embeds,
    files: payload.files,
    components: payload.components,
  });
}

export async function handleUniversalLeaderboardButton(
  interaction: ButtonInteraction,
): Promise<void> {
  // customId format: ulb_prev:<category>:<page> | ulb_next:<category>:<page>
  const [action, catRaw, pageRaw] = interaction.customId.split(":");
  const category: Category = CATEGORY_ORDER.includes(catRaw as Category)
    ? (catRaw as Category)
    : "weekly";
  const currentPage = Number.parseInt(pageRaw ?? "0", 10) || 0;
  const nextPage =
    action === "ulb_next" ? currentPage + 1 :
    action === "ulb_prev" ? currentPage - 1 :
    currentPage;

  const payload = await renderPayload(interaction, category, nextPage);
  await interaction.editReply({
    content: payload.content,
    embeds: payload.embeds,
    files: payload.files,
    components: payload.components,
  });
}

// Suppress unused-import warning for MessageFlags if tree-shaken
void MessageFlags;
