import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Client,
  MessageFlags,
} from "discord.js";
import {
  STAGE_RANKS,
  addMobilePlayer,
  removeMobilePlayerByPosition,
  editMobilePlayer,
  mobilePlayerExistsAtPosition,
  StageRank,
  STAGE_RANK_EMOJI,
  STAGE_RANK_COLORS,
} from "./mobileStore.js";
import { refreshPinnedMobileLeaderboard } from "./mobileDisplay.js";

function isValidAvatarUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

const ADMIN_PERMS = PermissionFlagsBits.ManageGuild;

function stageRankChoices() {
  return STAGE_RANKS.map((r) => ({ name: `${STAGE_RANK_EMOJI[r]}  ${r}`, value: r }));
}

export const setupMobileLeaderboardData = new SlashCommandBuilder()
  .setName("setupmobileleaderboard")
  .setDescription("Deploy the permanent TSB Mobile leaderboard in this channel. (Admin only)")
  .setDefaultMemberPermissions(ADMIN_PERMS);

export const addMobilePlayerData = new SlashCommandBuilder()
  .setName("addmobileplayer")
  .setDescription("Add a player to the mobile leaderboard. (Admin only)")
  .setDefaultMemberPermissions(ADMIN_PERMS)
  .addIntegerOption((o) =>
    o.setName("position").setDescription("Rank position (e.g. 1, 2, 3)").setRequired(true).setMinValue(1)
  )
  .addStringOption((o) =>
    o.setName("display_name").setDescription("Player display name").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("roblox_username").setDescription("Roblox username").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("discord_username").setDescription("Discord username/tag").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("country").setDescription("Country with flag emoji (e.g. 🇺🇸 United States)").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("avatar_url").setDescription("Direct URL to the player's avatar/profile image").setRequired(true)
  )
  .addStringOption((o) =>
    o
      .setName("stage_rank")
      .setDescription("Player's stage rank")
      .setRequired(true)
      .addChoices(...stageRankChoices())
  );

export const removeMobilePlayerData = new SlashCommandBuilder()
  .setName("removemobileplayer")
  .setDescription("Remove a player from the mobile leaderboard by position. (Admin only)")
  .setDefaultMemberPermissions(ADMIN_PERMS)
  .addIntegerOption((o) =>
    o.setName("position").setDescription("The rank position of the player to remove").setRequired(true).setMinValue(1)
  );

export const editMobilePlayerData = new SlashCommandBuilder()
  .setName("editmobileplayer")
  .setDescription("Edit a mobile leaderboard player's details. (Admin only)")
  .setDefaultMemberPermissions(ADMIN_PERMS)
  .addIntegerOption((o) =>
    o.setName("position").setDescription("Current rank position of the player to edit").setRequired(true).setMinValue(1)
  )
  .addIntegerOption((o) =>
    o.setName("new_position").setDescription("New rank position").setRequired(false).setMinValue(1)
  )
  .addStringOption((o) =>
    o.setName("display_name").setDescription("New display name").setRequired(false)
  )
  .addStringOption((o) =>
    o.setName("roblox_username").setDescription("New Roblox username").setRequired(false)
  )
  .addStringOption((o) =>
    o.setName("discord_username").setDescription("New Discord username").setRequired(false)
  )
  .addStringOption((o) =>
    o.setName("country").setDescription("New country (e.g. 🇺🇸 United States)").setRequired(false)
  )
  .addStringOption((o) =>
    o.setName("avatar_url").setDescription("New avatar image URL").setRequired(false)
  )
  .addStringOption((o) =>
    o
      .setName("stage_rank")
      .setDescription("New stage rank")
      .setRequired(false)
      .addChoices(...stageRankChoices())
  );

export async function executeAddMobilePlayer(
  interaction: ChatInputCommandInteraction,
  client: Client
): Promise<void> {
  const position = interaction.options.getInteger("position", true);
  const stageRank = interaction.options.getString("stage_rank", true) as StageRank;

  if (mobilePlayerExistsAtPosition(position)) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle("❌  Position Taken")
          .setDescription(
            `There is already a player at position **#${position}**.\nUse \`/editmobileplayer\` to update them, or choose a different position.`
          ),
      ],
    });
    return;
  }

  const player = {
    position,
    displayName: interaction.options.getString("display_name", true),
    robloxUsername: interaction.options.getString("roblox_username", true),
    discordUsername: interaction.options.getString("discord_username", true),
    country: interaction.options.getString("country", true),
    avatarUrl: interaction.options.getString("avatar_url", true),
    stageRank,
  };

  addMobilePlayer(player);
  try { await refreshPinnedMobileLeaderboard(client); } catch (err) {
    console.error("refreshPinnedMobileLeaderboard failed (addMobilePlayer):", err);
  }

  const addEmbed = new EmbedBuilder()
    .setColor(STAGE_RANK_COLORS[stageRank])
    .setTitle("✅  Player Added  —  Mobile Leaderboard Updated")
    .addFields(
      { name: "Position", value: `#${player.position}`, inline: true },
      { name: "Display Name", value: player.displayName, inline: true },
      { name: "Stage Rank", value: `${STAGE_RANK_EMOJI[stageRank]}  ${stageRank}`, inline: true },
      { name: "Roblox", value: player.robloxUsername, inline: true },
      { name: "Discord", value: player.discordUsername, inline: true },
      { name: "Country", value: player.country, inline: true }
    )
    .setFooter({ text: "The Strongest Battlegrounds  •  Mobile Leaderboard" });

  if (isValidAvatarUrl(player.avatarUrl)) {
    addEmbed.setThumbnail(player.avatarUrl);
  }

  await interaction.editReply({ embeds: [addEmbed] });
}

export async function executeRemoveMobilePlayer(
  interaction: ChatInputCommandInteraction,
  client: Client
): Promise<void> {
  const position = interaction.options.getInteger("position", true);
  const removed = removeMobilePlayerByPosition(position);

  if (!removed) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle("❌  Player Not Found")
          .setDescription(`No player found at position **#${position}**.`),
      ],
    });
    return;
  }

  try { await refreshPinnedMobileLeaderboard(client); } catch (err) {
    console.error("refreshPinnedMobileLeaderboard failed (removeMobilePlayer):", err);
  }

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("🗑️  Player Removed  —  Mobile Leaderboard Updated")
        .setDescription(`Player at position **#${position}** has been removed from the mobile leaderboard.`)
        .setFooter({ text: "The Strongest Battlegrounds  •  Mobile Leaderboard" }),
    ],
  });
}

export async function executeEditMobilePlayer(
  interaction: ChatInputCommandInteraction,
  client: Client
): Promise<void> {
  const position = interaction.options.getInteger("position", true);

  if (!mobilePlayerExistsAtPosition(position)) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle("❌  Player Not Found")
          .setDescription(`No player found at position **#${position}**.`),
      ],
    });
    return;
  }

  const updates: Record<string, string | number | StageRank> = {};
  const newPos = interaction.options.getInteger("new_position");
  const displayName = interaction.options.getString("display_name");
  const robloxUsername = interaction.options.getString("roblox_username");
  const discordUsername = interaction.options.getString("discord_username");
  const country = interaction.options.getString("country");
  const avatarUrl = interaction.options.getString("avatar_url");
  const stageRank = interaction.options.getString("stage_rank") as StageRank | null;

  if (newPos !== null) updates["position"] = newPos;
  if (displayName) updates["displayName"] = displayName;
  if (robloxUsername) updates["robloxUsername"] = robloxUsername;
  if (discordUsername) updates["discordUsername"] = discordUsername;
  if (country) updates["country"] = country;
  if (avatarUrl) updates["avatarUrl"] = avatarUrl;
  if (stageRank) updates["stageRank"] = stageRank;

  if (Object.keys(updates).length === 0) {
    await interaction.editReply({
      content: "⚠️ No changes provided. Please fill in at least one field to update.",
    });
    return;
  }

  editMobilePlayer(position, updates as never);
  try { await refreshPinnedMobileLeaderboard(client); } catch (err) {
    console.error("refreshPinnedMobileLeaderboard failed (editMobilePlayer):", err);
  }

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("✏️  Player Updated  —  Mobile Leaderboard Updated")
        .setDescription(
          `Player at position **#${position}** has been updated.\n\n` +
            Object.entries(updates)
              .map(([k, v]) => `**${k}:** ${v}`)
              .join("\n")
        )
        .setFooter({ text: "The Strongest Battlegrounds  •  Mobile Leaderboard" }),
    ],
  });
}
