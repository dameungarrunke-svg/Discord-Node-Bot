import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  TextChannel,
} from "discord.js";
import { saveRaidResult } from "./store.js";

const ADMIN = PermissionFlagsBits.ManageGuild;

const DIVIDER = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

function findChannel(interaction: ChatInputCommandInteraction, ...keywords: string[]): TextChannel | null {
  const guild = interaction.guild;
  if (!guild) return null;
  for (const kw of keywords) {
    const found = guild.channels.cache.find(
      (c) => c.isTextBased() && c.name.toLowerCase().includes(kw.toLowerCase())
    ) as TextChannel | undefined;
    if (found) return found;
  }
  return null;
}

export const startRaidData = new SlashCommandBuilder()
  .setName("startraid")
  .setDescription("Announce the start of a clan raid.")
  .setDefaultMemberPermissions(ADMIN)
  .addStringOption((o) =>
    o.setName("clan_name").setDescription("Your clan name").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("target").setDescription("Target clan or server name").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("game_link").setDescription("Roblox game link").setRequired(true)
  )
  .addIntegerOption((o) =>
    o.setName("people_count").setDescription("Number of members needed").setRequired(true).setMinValue(1)
  )
  .addStringOption((o) =>
    o.setName("raid_time").setDescription("Raid time (e.g. NOW / In 10 minutes)").setRequired(true)
  )
  .addRoleOption((o) =>
    o.setName("ping_role").setDescription("Role to ping for this raid (optional)").setRequired(false)
  )
  .addStringOption((o) =>
    o.setName("allies").setDescription("Allied clans joining the raid (optional)").setRequired(false)
  )
  .addStringOption((o) =>
    o.setName("notes").setDescription("Additional notes (optional)").setRequired(false)
  );

export async function executeStartRaid(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const clanName = interaction.options.getString("clan_name", true);
  const target = interaction.options.getString("target", true);
  const gameLink = interaction.options.getString("game_link", true);
  const peopleCount = interaction.options.getInteger("people_count", true);
  const raidTime = interaction.options.getString("raid_time", true);
  const pingRole = interaction.options.getRole("ping_role");
  const allies = interaction.options.getString("allies") || "None";
  const notes = interaction.options.getString("notes") || "—";

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setAuthor({
      name: "LAST STAND (LS)  —  RAID ALERT",
      iconURL: interaction.guild?.iconURL() ?? undefined,
    })
    .setTitle("⚔️  RAID STARTING")
    .setDescription(
      `**All available members, report immediately.**\n${DIVIDER}`
    )
    .addFields(
      { name: "🏴  Clan", value: `\`${clanName}\``, inline: true },
      { name: "🎯  Target", value: `\`${target}\``, inline: true },
      { name: "👥  Members Needed", value: `\`${peopleCount}\``, inline: true },
      { name: "⏰  Raid Time", value: `\`${raidTime}\``, inline: true },
      { name: "🤝  Allies", value: `\`${allies}\``, inline: true },
      { name: "\u200b", value: "\u200b", inline: true },
      { name: "🔗  Game Link", value: `[**▶ Click to Join**](${gameLink})`, inline: false },
      { name: "📋  Notes", value: notes, inline: false }
    )
    .setFooter({
      text: `Initiated by ${interaction.user.tag}  •  Last Stand (LS)`,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setTimestamp();

  const channel = interaction.channel as TextChannel | null;
  if (!channel) {
    await interaction.editReply({ content: "❌ Cannot post in this channel." });
    return;
  }

  const content = pingRole ? `${pingRole}` : undefined;
  await channel.send({ content, embeds: [embed] });
  await interaction.editReply({ content: "✅ Raid announcement posted." });
}

export const endRaidData = new SlashCommandBuilder()
  .setName("endraid")
  .setDescription("End an active raid and log the results.")
  .setDefaultMemberPermissions(ADMIN)
  .addStringOption((o) =>
    o.setName("clan_name").setDescription("Your clan name").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("opponent_clan").setDescription("Opponent clan name").setRequired(true)
  )
  .addStringOption((o) =>
    o
      .setName("result")
      .setDescription("Raid outcome")
      .setRequired(true)
      .addChoices(
        { name: "🏆  Win", value: "Win" },
        { name: "💀  Loss", value: "Loss" },
        { name: "🤝  Draw", value: "Draw" }
      )
  )
  .addStringOption((o) =>
    o.setName("top_performers").setDescription("Top performers in the raid").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("notes").setDescription("Additional notes (optional)").setRequired(false)
  );

export async function executeEndRaid(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const clanName = interaction.options.getString("clan_name", true);
  const opponentClan = interaction.options.getString("opponent_clan", true);
  const result = interaction.options.getString("result", true) as "Win" | "Loss" | "Draw";
  const topPerformers = interaction.options.getString("top_performers", true);
  const notes = interaction.options.getString("notes") || "—";

  const config = {
    Win:  { color: 0x22c55e, icon: "🏆", label: "VICTORY" },
    Loss: { color: 0xef4444, icon: "💀", label: "DEFEAT"  },
    Draw: { color: 0xeab308, icon: "🤝", label: "DRAW"    },
  }[result];

  const embed = new EmbedBuilder()
    .setColor(config.color)
    .setAuthor({
      name: "LAST STAND (LS)  —  RAID CONCLUDED",
      iconURL: interaction.guild?.iconURL() ?? undefined,
    })
    .setTitle(`${config.icon}  RAID ENDED — ${config.label}`)
    .setDescription(`**The raid has concluded. Results have been logged.**\n${DIVIDER}`)
    .addFields(
      { name: "🏴  Clan", value: `\`${clanName}\``, inline: true },
      { name: "🆚  Opponent", value: `\`${opponentClan}\``, inline: true },
      { name: "📊  Outcome", value: `**${config.icon} ${config.label}**`, inline: true },
      { name: "⭐  Top Performers", value: topPerformers, inline: false },
      { name: "📋  Notes", value: notes, inline: false }
    )
    .setFooter({
      text: `Ended by ${interaction.user.tag}  •  Last Stand (LS)`,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setTimestamp();

  saveRaidResult({
    id: `${Date.now()}`,
    clanName,
    opponentClan,
    result,
    topPerformers,
    notes,
    endedBy: interaction.user.tag,
    endedById: interaction.user.id,
    timestamp: new Date().toISOString(),
    guildId: interaction.guildId ?? "",
  });

  const resultsChannel = findChannel(interaction, "ʀᴀɪᴅ-ʀᴇsᴜʟᴛs", "raid-results");

  if (resultsChannel) {
    await resultsChannel.send({ embeds: [embed] });
    await interaction.editReply({ content: `✅ Raid concluded. Results posted to ${resultsChannel}.` });
  } else {
    const ch = interaction.channel as TextChannel | null;
    if (ch) await ch.send({ embeds: [embed] });
    await interaction.editReply({
      content: "✅ Raid concluded and results logged. *(No raid-results channel found — posted here.)*",
    });
  }
}
