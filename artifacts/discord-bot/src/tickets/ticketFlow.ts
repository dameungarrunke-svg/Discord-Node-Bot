import {
  ButtonInteraction,
  Guild,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
  Collection,
  Role,
  Message,
} from "discord.js";
import { addActiveTicket, hasActiveTicket, isOnCooldown } from "./ticketManager.js";

const QUESTION_TIMEOUT = 5 * 60 * 1000;
const HR  = "⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯";
const DOT = " · · · · · · · · · · · · · · · ";

const QUESTIONS = [
  {
    key: "opponent",
    label: "Opponent",
    prompt: "**Who are you challenging?**\n> Mention them (`@user`) or type their username.",
  },
  {
    key: "rules",
    label: "Fight Rules",
    prompt: "**What are the fight rules?**\n> e.g. *No items, No cheap spots, 1v1 only*",
  },
  {
    key: "notes",
    label: "Additional Notes",
    prompt: "**Any additional notes?** *(optional)*\n> Type your notes or type `skip` to leave blank.",
  },
];

function getStaffRoles(guild: Guild): Collection<string, Role> {
  return guild.roles.cache.filter(
    (role) =>
      role.permissions.has(PermissionFlagsBits.ManageChannels) ||
      role.permissions.has(PermissionFlagsBits.Administrator) ||
      role.permissions.has(PermissionFlagsBits.ManageGuild)
  );
}

export async function handleCreateTicket(interaction: ButtonInteraction): Promise<void> {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.editReply({ content: "❌ Could not find server." });
    return;
  }

  const userId = interaction.user.id;

  const cooldownMs = isOnCooldown(userId);
  if (cooldownMs > 0) {
    const seconds = Math.ceil(cooldownMs / 1000);
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xb91c1c)
          .setAuthor({ name: "LAST STAND  ·  CHALLENGE SYSTEM" })
          .setTitle("⏳  COOLDOWN ACTIVE")
          .setDescription(
            `${HR}\n` +
            `You recently closed a ticket.\n` +
            `Please wait **${seconds} seconds** before opening a new one.\n` +
            `${HR}`
          ),
      ],
    });
    return;
  }

  if (hasActiveTicket(userId)) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xb91c1c)
          .setAuthor({ name: "LAST STAND  ·  CHALLENGE SYSTEM" })
          .setTitle("⛔  TICKET ALREADY OPEN")
          .setDescription(
            `${HR}\n` +
            `You already have an open challenge ticket.\n` +
            `Please close it before opening a new one.\n` +
            `${HR}`
          ),
      ],
    });
    return;
  }

  const staffRoles = getStaffRoles(guild);

  const permissionOverwrites: {
    id: string;
    allow?: bigint[];
    deny?: bigint[];
  }[] = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: userId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
    {
      id: interaction.client.user!.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageChannels,
      ],
    },
  ];

  for (const [, role] of staffRoles) {
    permissionOverwrites.push({
      id: role.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    });
  }

  let channel: TextChannel;
  try {
    channel = (await guild.channels.create({
      name: `challenge-${interaction.user.username}`,
      type: ChannelType.GuildText,
      topic: `Challenge ticket for ${interaction.user.tag}`,
      permissionOverwrites,
    })) as TextChannel;
  } catch {
    await interaction.editReply({
      content: "❌ Failed to create ticket channel. Make sure I have `Manage Channels` permission.",
    });
    return;
  }

  addActiveTicket(userId, channel.id);

  await interaction.editReply({
    content: `✅ Your challenge ticket is ready: ${channel}`,
  });

  await runTicketQA(channel, interaction.user.id, guild);
}

async function runTicketQA(
  channel: TextChannel,
  userId: string,
  guild: Guild
): Promise<void> {
  const member = await guild.members.fetch(userId).catch(() => null);

  const introEmbed = new EmbedBuilder()
    .setColor(0x9f1239)
    .setAuthor({ name: "LAST STAND  ·  CHALLENGE SYSTEM" })
    .setTitle("⚔  CHALLENGE TICKET OPENED")
    .setDescription(
      `${HR}\n\n` +
      `Welcome, ${member ? `<@${userId}>` : "Challenger"}.\n\n` +
      `Please answer the following questions to submit your match request.\n` +
      `You have **5 minutes** to respond to each prompt.\n\n` +
      `${HR}`
    )
    .setFooter({ text: "Last Stand (LS)  ·  Challenge System" })
    .setTimestamp();

  await channel.send({ embeds: [introEmbed] });

  const answers: Record<string, string> = {};

  for (const question of QUESTIONS) {
    const questionEmbed = new EmbedBuilder()
      .setColor(0x1e293b)
      .setDescription(`<@${userId}>\n\n${question.prompt}`);

    await channel.send({ embeds: [questionEmbed] });

    const collected = await channel
      .awaitMessages({
        filter: (m: Message) => m.author.id === userId && !m.author.bot,
        max: 1,
        time: QUESTION_TIMEOUT,
        errors: ["time"],
      })
      .catch(() => null);

    if (!collected || collected.size === 0) {
      const timeoutEmbed = new EmbedBuilder()
        .setColor(0xb91c1c)
        .setAuthor({ name: "LAST STAND  ·  CHALLENGE SYSTEM" })
        .setTitle("⏰  TICKET TIMED OUT")
        .setDescription(
          `${HR}\n` +
          `No response received within the time limit.\n` +
          `This ticket will be deleted in **10 seconds**.\n` +
          `${HR}`
        );
      await channel.send({ embeds: [timeoutEmbed] });
      setTimeout(() => channel.delete().catch(() => {}), 10_000);
      return;
    }

    const answer = collected.first()!.content.trim();
    answers[question.key] =
      question.key === "notes" && answer.toLowerCase() === "skip" ? "—" : answer;
  }

  await sendChallengeSummary(channel, userId, answers);
}

async function sendChallengeSummary(
  channel: TextChannel,
  userId: string,
  answers: Record<string, string>
): Promise<void> {
  const summaryEmbed = new EmbedBuilder()
    .setColor(0x9f1239)
    .setAuthor({ name: "LAST STAND  ·  CHALLENGE SUBMITTED" })
    .setTitle("⚔  MATCH REQUEST PENDING")
    .setDescription(
      `${HR}\n` +
      `A challenge has been submitted. Staff will coordinate the match.\n` +
      `${HR}\n` +
      `▸  **CHALLENGER** ${DOT} <@${userId}>\n` +
      `▸  **OPPONENT** ${DOT} \`${answers["opponent"] ?? "—"}\`\n` +
      `${HR}\n` +
      `**FIGHT RULES**\n` +
      `> ${answers["rules"] ?? "—"}\n\n` +
      `**NOTES**\n` +
      `> ${answers["notes"] ?? "—"}\n` +
      `${HR}`
    )
    .setFooter({ text: "Last Stand (LS)  ·  Challenge System" })
    .setTimestamp();

  const controlsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("Close Ticket")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("delete_ticket")
      .setLabel("Delete Ticket")
      .setEmoji("🗑️")
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({
    content: `<@${userId}>`,
    embeds: [summaryEmbed],
    components: [controlsRow],
  });
}
