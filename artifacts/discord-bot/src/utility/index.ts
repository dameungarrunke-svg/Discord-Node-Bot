import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  TextChannel,
  Message,
} from "discord.js";
import { addWarn, getWarns, addPromotion, addAttendance, addMvp } from "./store.js";

const ADMIN = PermissionFlagsBits.ManageGuild;
const MOD   = PermissionFlagsBits.ModerateMembers;
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

export const announceData = new SlashCommandBuilder()
  .setName("announce")
  .setDescription("Post a premium announcement embed.")
  .setDefaultMemberPermissions(ADMIN)
  .addStringOption((o) =>
    o.setName("title").setDescription("Announcement title").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("message").setDescription("Announcement body").setRequired(true)
  )
  .addChannelOption((o) =>
    o.setName("channel").setDescription("Channel to post in (defaults to current)").setRequired(false)
  )
  .addRoleOption((o) =>
    o.setName("ping_role").setDescription("Role to ping (optional)").setRequired(false)
  );

export async function executeAnnounce(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const title   = interaction.options.getString("title", true);
  const message = interaction.options.getString("message", true);
  const target  = interaction.options.getChannel("channel") as TextChannel | null;
  const pingRole = interaction.options.getRole("ping_role");

  const channel = (target ?? interaction.channel) as TextChannel | null;
  if (!channel || !("send" in channel)) {
    await interaction.editReply({ content: "❌ Cannot post in that channel." });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setAuthor({
      name: "LAST STAND (LS)  —  ANNOUNCEMENT",
      iconURL: interaction.guild?.iconURL() ?? undefined,
    })
    .setTitle(`📢  ${title}`)
    .setDescription(`${DIVIDER}\n\n${message}\n\n${DIVIDER}`)
    .setFooter({
      text: `Posted by ${interaction.user.tag}  •  Last Stand (LS)`,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setTimestamp();

  await channel.send({ content: pingRole ? `${pingRole}` : undefined, embeds: [embed] });
  await interaction.editReply({ content: `✅ Announcement posted in ${channel}.` });
}

export const warnData = new SlashCommandBuilder()
  .setName("warn")
  .setDescription("Issue a formal warning to a member.")
  .setDefaultMemberPermissions(MOD)
  .addUserOption((o) =>
    o.setName("user").setDescription("Member to warn").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("reason").setDescription("Reason for warning").setRequired(true)
  );

export async function executeWarn(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const target = interaction.options.getUser("user", true);
  const reason = interaction.options.getString("reason", true);

  addWarn({
    id: `${Date.now()}`,
    userId: target.id,
    userTag: target.tag,
    moderatorId: interaction.user.id,
    moderatorTag: interaction.user.tag,
    reason,
    timestamp: new Date().toISOString(),
    guildId: interaction.guildId ?? "",
  });

  const history = getWarns(target.id, interaction.guildId ?? "");

  const embed = new EmbedBuilder()
    .setColor(0xeab308)
    .setAuthor({
      name: "LAST STAND (LS)  —  WARNING ISSUED",
      iconURL: interaction.guild?.iconURL() ?? undefined,
    })
    .setTitle("⚠️  MEMBER WARNED")
    .setDescription(`${DIVIDER}`)
    .addFields(
      { name: "👤  Member", value: `<@${target.id}>`, inline: true },
      { name: "🛡️  Moderator", value: `<@${interaction.user.id}>`, inline: true },
      { name: "📋  Total Warnings", value: `\`${history.length}\``, inline: true },
      { name: "📝  Reason", value: reason, inline: false }
    )
    .setFooter({ text: "Last Stand (LS)  •  Moderation Log" })
    .setTimestamp();

  const channel = interaction.channel as TextChannel | null;
  if (channel) await channel.send({ embeds: [embed] });

  await interaction.editReply({ content: `✅ Warning issued to **${target.tag}**. Total warnings: **${history.length}**` });
}

export const promoteData = new SlashCommandBuilder()
  .setName("promote")
  .setDescription("Promote a clan member to a new rank.")
  .setDefaultMemberPermissions(ADMIN)
  .addUserOption((o) =>
    o.setName("user").setDescription("Member to promote").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("rank").setDescription("New rank title").setRequired(true)
  );

export async function executePromote(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const target = interaction.options.getUser("user", true);
  const rank   = interaction.options.getString("rank", true);

  addPromotion({
    id: `${Date.now()}`,
    userId: target.id,
    userTag: target.tag,
    moderatorId: interaction.user.id,
    moderatorTag: interaction.user.tag,
    type: "promote",
    newRank: rank,
    timestamp: new Date().toISOString(),
    guildId: interaction.guildId ?? "",
  });

  const embed = new EmbedBuilder()
    .setColor(0x22c55e)
    .setAuthor({
      name: "LAST STAND (LS)  —  PROMOTION",
      iconURL: interaction.guild?.iconURL() ?? undefined,
    })
    .setTitle("🎖️  MEMBER PROMOTED")
    .setDescription(`${DIVIDER}`)
    .addFields(
      { name: "👤  Member", value: `<@${target.id}>`, inline: true },
      { name: "🏅  New Rank", value: `\`${rank}\``, inline: true },
      { name: "🛡️  Promoted By", value: `<@${interaction.user.id}>`, inline: true }
    )
    .setThumbnail(target.displayAvatarURL())
    .setFooter({ text: "Last Stand (LS)  •  Rank Promotion" })
    .setTimestamp();

  const channel = interaction.channel as TextChannel | null;
  if (channel) await channel.send({ embeds: [embed] });
  await interaction.editReply({ content: `✅ **${target.tag}** promoted to **${rank}**.` });
}

export const demoteData = new SlashCommandBuilder()
  .setName("demote")
  .setDescription("Demote a clan member to a lower rank.")
  .setDefaultMemberPermissions(ADMIN)
  .addUserOption((o) =>
    o.setName("user").setDescription("Member to demote").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("rank").setDescription("New (lower) rank title").setRequired(true)
  );

export async function executeDemote(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const target = interaction.options.getUser("user", true);
  const rank   = interaction.options.getString("rank", true);

  addPromotion({
    id: `${Date.now()}`,
    userId: target.id,
    userTag: target.tag,
    moderatorId: interaction.user.id,
    moderatorTag: interaction.user.tag,
    type: "demote",
    newRank: rank,
    timestamp: new Date().toISOString(),
    guildId: interaction.guildId ?? "",
  });

  const embed = new EmbedBuilder()
    .setColor(0xef4444)
    .setAuthor({
      name: "LAST STAND (LS)  —  DEMOTION",
      iconURL: interaction.guild?.iconURL() ?? undefined,
    })
    .setTitle("📉  MEMBER DEMOTED")
    .setDescription(`${DIVIDER}`)
    .addFields(
      { name: "👤  Member", value: `<@${target.id}>`, inline: true },
      { name: "📋  New Rank", value: `\`${rank}\``, inline: true },
      { name: "🛡️  Demoted By", value: `<@${interaction.user.id}>`, inline: true }
    )
    .setThumbnail(target.displayAvatarURL())
    .setFooter({ text: "Last Stand (LS)  •  Rank Demotion" })
    .setTimestamp();

  const channel = interaction.channel as TextChannel | null;
  if (channel) await channel.send({ embeds: [embed] });
  await interaction.editReply({ content: `✅ **${target.tag}** demoted to **${rank}**.` });
}

export const attendanceData = new SlashCommandBuilder()
  .setName("attendance")
  .setDescription("Mark a member's attendance for an event.")
  .setDefaultMemberPermissions(MOD)
  .addStringOption((o) =>
    o.setName("event").setDescription("Event name").setRequired(true)
  )
  .addUserOption((o) =>
    o.setName("user").setDescription("Member to mark present").setRequired(true)
  );

export async function executeAttendance(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const event  = interaction.options.getString("event", true);
  const target = interaction.options.getUser("user", true);

  addAttendance({
    id: `${Date.now()}`,
    userId: target.id,
    userTag: target.tag,
    event,
    markedById: interaction.user.id,
    markedByTag: interaction.user.tag,
    timestamp: new Date().toISOString(),
    guildId: interaction.guildId ?? "",
  });

  const embed = new EmbedBuilder()
    .setColor(0x06b6d4)
    .setAuthor({
      name: "LAST STAND (LS)  —  ATTENDANCE",
      iconURL: interaction.guild?.iconURL() ?? undefined,
    })
    .setTitle("✅  ATTENDANCE MARKED")
    .addFields(
      { name: "👤  Member", value: `<@${target.id}>`, inline: true },
      { name: "📅  Event", value: `\`${event}\``, inline: true },
      { name: "🛡️  Marked By", value: `<@${interaction.user.id}>`, inline: true }
    )
    .setFooter({ text: "Last Stand (LS)  •  Attendance System" })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

export const pollData = new SlashCommandBuilder()
  .setName("poll")
  .setDescription("Create a community vote/poll.")
  .setDefaultMemberPermissions(MOD)
  .addStringOption((o) =>
    o.setName("question").setDescription("Poll question").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("option1").setDescription("Option 1").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("option2").setDescription("Option 2").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("option3").setDescription("Option 3 (optional)").setRequired(false)
  )
  .addStringOption((o) =>
    o.setName("option4").setDescription("Option 4 (optional)").setRequired(false)
  );

export async function executePoll(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const question = interaction.options.getString("question", true);
  const options = [
    interaction.options.getString("option1", true),
    interaction.options.getString("option2", true),
    interaction.options.getString("option3"),
    interaction.options.getString("option4"),
  ].filter((o): o is string => o !== null);

  const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣"];

  const optionsText = options
    .map((opt, i) => `${emojis[i]}  **${opt}**`)
    .join("\n\n");

  const embed = new EmbedBuilder()
    .setColor(0x8b5cf6)
    .setAuthor({
      name: "LAST STAND (LS)  —  COMMUNITY POLL",
      iconURL: interaction.guild?.iconURL() ?? undefined,
    })
    .setTitle(`📊  ${question}`)
    .setDescription(`${DIVIDER}\n\n${optionsText}\n\n${DIVIDER}\n\n*React below to cast your vote.*`)
    .setFooter({
      text: `Poll by ${interaction.user.tag}  •  Last Stand (LS)`,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setTimestamp();

  const channel = interaction.channel as TextChannel | null;
  if (!channel) {
    await interaction.editReply({ content: "❌ Cannot post in this channel." });
    return;
  }

  const msg: Message = await channel.send({ embeds: [embed] });

  for (let i = 0; i < options.length; i++) {
    await msg.react(emojis[i]).catch(() => {});
  }

  await interaction.editReply({ content: "✅ Poll posted." });
}

export const mvpData = new SlashCommandBuilder()
  .setName("mvp")
  .setDescription("Award MVP to a member for outstanding performance.")
  .setDefaultMemberPermissions(MOD)
  .addUserOption((o) =>
    o.setName("user").setDescription("Member receiving MVP").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("event").setDescription("Event or match name").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("reason").setDescription("Reason for MVP award").setRequired(true)
  );

export async function executeMvp(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const target = interaction.options.getUser("user", true);
  const event  = interaction.options.getString("event", true);
  const reason = interaction.options.getString("reason", true);

  addMvp({
    id: `${Date.now()}`,
    userId: target.id,
    userTag: target.tag,
    event,
    reason,
    awardedById: interaction.user.id,
    awardedByTag: interaction.user.tag,
    timestamp: new Date().toISOString(),
    guildId: interaction.guildId ?? "",
  });

  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setAuthor({
      name: "LAST STAND (LS)  —  MVP AWARD",
      iconURL: interaction.guild?.iconURL() ?? undefined,
    })
    .setTitle("🏆  MVP OF THE SESSION")
    .setDescription(`${DIVIDER}`)
    .addFields(
      { name: "🌟  MVP", value: `<@${target.id}>`, inline: true },
      { name: "📅  Event", value: `\`${event}\``, inline: true },
      { name: "🛡️  Awarded By", value: `<@${interaction.user.id}>`, inline: true },
      { name: "📝  Reason", value: reason, inline: false }
    )
    .setThumbnail(target.displayAvatarURL())
    .setFooter({ text: "Last Stand (LS)  •  MVP Award" })
    .setTimestamp();

  const channel = interaction.channel as TextChannel | null;
  if (channel) await channel.send({ embeds: [embed] });
  await interaction.editReply({ content: `✅ MVP awarded to **${target.tag}**.` });
}

export const suggestionData = new SlashCommandBuilder()
  .setName("suggestion")
  .setDescription("Submit a suggestion for the clan or server.")
  .addStringOption((o) =>
    o.setName("suggestion").setDescription("Your suggestion").setRequired(true)
  );

export async function executeSuggestion(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const suggestion = interaction.options.getString("suggestion", true);

  const embed = new EmbedBuilder()
    .setColor(0x6366f1)
    .setAuthor({
      name: "LAST STAND (LS)  —  SUGGESTION",
      iconURL: interaction.guild?.iconURL() ?? undefined,
    })
    .setTitle("💡  NEW SUGGESTION")
    .setDescription(`${DIVIDER}\n\n${suggestion}\n\n${DIVIDER}`)
    .setThumbnail(interaction.user.displayAvatarURL())
    .addFields(
      { name: "👤  Submitted By", value: `<@${interaction.user.id}>`, inline: true }
    )
    .setFooter({ text: "Last Stand (LS)  •  Suggestions" })
    .setTimestamp();

  const suggestionsChannel = findChannel(interaction, "suggestions", "suggest");
  const channel = (suggestionsChannel ?? interaction.channel) as TextChannel | null;

  if (!channel) {
    await interaction.editReply({ content: "❌ Could not find a channel to post in." });
    return;
  }

  const msg: Message = await channel.send({ embeds: [embed] });
  await msg.react("✅").catch(() => {});
  await msg.react("❌").catch(() => {});

  await interaction.editReply({
    content: suggestionsChannel
      ? `✅ Suggestion posted to ${suggestionsChannel}.`
      : "✅ Suggestion posted. *(No #suggestions channel found — posted here.)*",
  });
}
