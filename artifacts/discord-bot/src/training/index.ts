import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  TextChannel,
} from "discord.js";
import { saveTrainingLog } from "./store.js";

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

export const startTrainingData = new SlashCommandBuilder()
  .setName("starttraining")
  .setDescription("Announce the start of a clan training session.")
  .setDefaultMemberPermissions(ADMIN)
  .addStringOption((o) =>
    o.setName("game_link").setDescription("Roblox game link").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("host").setDescription("Training host name/tag").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("training_type").setDescription("Type of training (e.g. PvP, Defence, Ranked)").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("duration").setDescription("Expected duration (e.g. 1 hour)").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("start_time").setDescription("Start time (e.g. NOW / 5 minutes)").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("attendance_requirement").setDescription("Is attendance required? (e.g. Mandatory / Optional)").setRequired(true)
  )
  .addRoleOption((o) =>
    o.setName("ping_role").setDescription("Role to ping for this training (optional)").setRequired(false)
  )
  .addStringOption((o) =>
    o.setName("notes").setDescription("Additional notes (optional)").setRequired(false)
  );

export async function executeStartTraining(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const gameLink = interaction.options.getString("game_link", true);
  const host = interaction.options.getString("host", true);
  const trainingType = interaction.options.getString("training_type", true);
  const duration = interaction.options.getString("duration", true);
  const startTime = interaction.options.getString("start_time", true);
  const attendanceReq = interaction.options.getString("attendance_requirement", true);
  const pingRole = interaction.options.getRole("ping_role");
  const notes = interaction.options.getString("notes") || "—";

  const embed = new EmbedBuilder()
    .setColor(0xf97316)
    .setAuthor({
      name: "LAST STAND (LS)  —  TRAINING SESSION",
      iconURL: interaction.guild?.iconURL() ?? undefined,
    })
    .setTitle("🎯  TRAINING STARTED")
    .setDescription(
      `**A training session has been initiated. All relevant members report.**\n${DIVIDER}`
    )
    .addFields(
      { name: "👤  Host", value: `\`${host}\``, inline: true },
      { name: "⚔️  Training Type", value: `\`${trainingType}\``, inline: true },
      { name: "⏱️  Duration", value: `\`${duration}\``, inline: true },
      { name: "🕐  Start Time", value: `\`${startTime}\``, inline: true },
      { name: "📋  Attendance", value: `\`${attendanceReq}\``, inline: true },
      { name: "\u200b", value: "\u200b", inline: true },
      { name: "🔗  Game Link", value: `[**▶ Click to Join**](${gameLink})`, inline: false },
      { name: "📝  Notes", value: notes, inline: false }
    )
    .setFooter({
      text: `Announced by ${interaction.user.tag}  •  Last Stand (LS)`,
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
  await interaction.editReply({ content: "✅ Training session announced." });
}

export const endTrainingData = new SlashCommandBuilder()
  .setName("endtraining")
  .setDescription("End an active training session and log the results.")
  .setDefaultMemberPermissions(ADMIN)
  .addStringOption((o) =>
    o.setName("host").setDescription("Training host name/tag").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("duration_completed").setDescription("Actual duration completed").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("mvp").setDescription("Most Valuable Player of the session").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("notes").setDescription("Session notes (optional)").setRequired(false)
  );

export async function executeEndTraining(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const host = interaction.options.getString("host", true);
  const durationCompleted = interaction.options.getString("duration_completed", true);
  const mvp = interaction.options.getString("mvp", true);
  const notes = interaction.options.getString("notes") || "—";

  const embed = new EmbedBuilder()
    .setColor(0x22c55e)
    .setAuthor({
      name: "LAST STAND (LS)  —  TRAINING CONCLUDED",
      iconURL: interaction.guild?.iconURL() ?? undefined,
    })
    .setTitle("✅  TRAINING ENDED")
    .setDescription(`**Training session has concluded. Results have been logged.**\n${DIVIDER}`)
    .addFields(
      { name: "👤  Host", value: `\`${host}\``, inline: true },
      { name: "⏱️  Duration", value: `\`${durationCompleted}\``, inline: true },
      { name: "🏅  MVP", value: `\`${mvp}\``, inline: true },
      { name: "📝  Notes", value: notes, inline: false }
    )
    .setFooter({
      text: `Ended by ${interaction.user.tag}  •  Last Stand (LS)`,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setTimestamp();

  saveTrainingLog({
    id: `${Date.now()}`,
    host,
    durationCompleted,
    mvp,
    notes,
    endedBy: interaction.user.tag,
    endedById: interaction.user.id,
    timestamp: new Date().toISOString(),
    guildId: interaction.guildId ?? "",
  });

  const resultsChannel = findChannel(interaction, "training-results", "training-log");

  if (resultsChannel) {
    await resultsChannel.send({ embeds: [embed] });
    await interaction.editReply({ content: `✅ Training ended. Results posted to ${resultsChannel}.` });
  } else {
    const ch = interaction.channel as TextChannel | null;
    if (ch) await ch.send({ embeds: [embed] });
    await interaction.editReply({
      content: "✅ Training ended and results logged. *(No training-results channel found — posted here.)*",
    });
  }
}
