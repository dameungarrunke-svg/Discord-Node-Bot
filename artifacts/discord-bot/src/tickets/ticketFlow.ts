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

const QUESTIONS = [
  {
    key: "opponent",
    label: "Who are you challenging?",
    prompt:
      "**Who are you challenging?**\n> Mention them (`@user`) or type their username.",
  },
  {
    key: "rules",
    label: "Fight Rules",
    prompt:
      "**What are the Fight Rules?**\n> e.g. *No items, No cheap spots, 1v1 only*",
  },
  {
    key: "format",
    label: "Best Of / Format",
    prompt:
      "**What is the Format?**\n> e.g. *Bo1, Bo3, Bo5, First to 10 kills*",
  },
  {
    key: "notes",
    label: "Additional Notes",
    prompt:
      "**Any additional Notes?** *(optional)*\n> Type your notes or type `skip` to leave blank.",
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
  if (!guild) return;

  const userId = interaction.user.id;

  const cooldownMs = isOnCooldown(userId);
  if (cooldownMs > 0) {
    const seconds = Math.ceil(cooldownMs / 1000);
    await interaction.reply({
      ephemeral: true,
      embeds: [
        new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle("⏳ Cooldown Active")
          .setDescription(
            `You recently closed a challenge ticket.\nPlease wait **${seconds}s** before opening a new one.`
          ),
      ],
    });
    return;
  }

  if (hasActiveTicket(userId)) {
    await interaction.reply({
      ephemeral: true,
      embeds: [
        new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle("❌ Ticket Already Open")
          .setDescription(
            "You already have an open challenge ticket.\nPlease close it before opening a new one."
          ),
      ],
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

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
    content: `✅ Your challenge ticket has been created: ${channel}`,
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
    .setColor(0xc0392b)
    .setTitle("⚔️  Challenge Ticket Opened")
    .setDescription(
      `Welcome, ${member ? `<@${userId}>` : "Challenger"}!\n\n` +
      "Please answer the following questions to submit your challenge.\n" +
      "You have **5 minutes** to respond to each question.\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━"
    )
    .setFooter({ text: "The Strongest Battlegrounds  •  Challenge System" })
    .setTimestamp();

  await channel.send({ embeds: [introEmbed] });

  const answers: Record<string, string> = {};

  for (const question of QUESTIONS) {
    const questionEmbed = new EmbedBuilder()
      .setColor(0x2c3e50)
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
        .setColor(0xe74c3c)
        .setTitle("⏰ Ticket Timed Out")
        .setDescription(
          "You did not respond in time. This ticket will be deleted in **10 seconds**."
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
    .setColor(0xc0392b)
    .setTitle("⚔️  Challenge Request Submitted")
    .setDescription(
      "A new challenge has been submitted. Staff will coordinate the match.\n" +
      "━━━━━━━━━━━━━━━━━━━━━━"
    )
    .addFields(
      { name: "🎯  Challenger", value: `<@${userId}>`, inline: true },
      { name: "🆚  Opponent", value: answers["opponent"] ?? "—", inline: true },
      { name: "\u200b", value: "\u200b", inline: false },
      { name: "📜  Fight Rules", value: answers["rules"] ?? "—", inline: false },
      { name: "🗺️  Arena / Map", value: answers["arena"] ?? "—", inline: true },
      { name: "🏆  Format", value: answers["format"] ?? "—", inline: true },
      { name: "📝  Notes", value: answers["notes"] ?? "—", inline: false }
    )
    .setFooter({ text: "The Strongest Battlegrounds  •  Challenge System" })
    .setTimestamp();

  const controlsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("🔒  Close Ticket")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("delete_ticket")
      .setLabel("🗑️  Delete Ticket")
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({
    content: `<@${userId}>`,
    embeds: [summaryEmbed],
    components: [controlsRow],
  });
}
