import {
  ButtonInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { removeActiveTicketByChannelId } from "./ticketManager.js";

const HR = "⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯";

export async function handleCloseTicket(interaction: ButtonInteraction): Promise<void> {
  const channel = interaction.channel as TextChannel;
  if (!channel) {
    await interaction.editReply({ content: "❌ Could not find channel." });
    return;
  }

  const member = interaction.guild?.members.cache.get(interaction.user.id);
  const hasStaffPerms =
    member?.permissions.has(PermissionFlagsBits.ManageChannels) ||
    member?.permissions.has(PermissionFlagsBits.Administrator);

  const userId = removeActiveTicketByChannelId(channel.id);
  const isOwner = userId === interaction.user.id;

  if (!isOwner && !hasStaffPerms) {
    await interaction.editReply({
      content: "❌ Only the ticket owner or staff can close this ticket.",
    });
    return;
  }

  await channel.permissionOverwrites.set([
    {
      id: interaction.guild!.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: interaction.client.user!.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
      ],
    },
  ]);

  if (userId) {
    await channel.permissionOverwrites.create(userId, { ViewChannel: false });
  }

  const closeEmbed = new EmbedBuilder()
    .setColor(0x334155)
    .setAuthor({ name: "LAST STAND  ·  CHALLENGE SYSTEM" })
    .setTitle("🔒  TICKET CLOSED")
    .setDescription(
      `${HR}\n` +
      `Closed by <@${interaction.user.id}>.\n` +
      `Only staff can view or delete this channel.\n` +
      `${HR}`
    )
    .setFooter({ text: "Last Stand (LS)  ·  Challenge System" })
    .setTimestamp();

  await interaction.editReply({ embeds: [closeEmbed] });
}

export async function handleDeleteTicket(interaction: ButtonInteraction): Promise<void> {
  const channel = interaction.channel as TextChannel;
  if (!channel) {
    await interaction.editReply({ content: "❌ Could not find channel." });
    return;
  }

  const member = interaction.guild?.members.cache.get(interaction.user.id);
  const hasStaffPerms =
    member?.permissions.has(PermissionFlagsBits.ManageChannels) ||
    member?.permissions.has(PermissionFlagsBits.Administrator);

  const ticketOwnerId = removeActiveTicketByChannelId(channel.id);
  const isOwner = ticketOwnerId === interaction.user.id;

  if (!isOwner && !hasStaffPerms) {
    await interaction.editReply({
      content: "❌ Only the ticket owner or staff can delete this ticket.",
    });
    return;
  }

  const deleteEmbed = new EmbedBuilder()
    .setColor(0xb91c1c)
    .setAuthor({ name: "LAST STAND  ·  CHALLENGE SYSTEM" })
    .setTitle("🗑️  DELETING TICKET")
    .setDescription(
      `${HR}\n` +
      `This ticket will be permanently deleted in **5 seconds**.\n` +
      `${HR}`
    )
    .setFooter({ text: "Last Stand (LS)  ·  Challenge System" })
    .setTimestamp();

  await interaction.editReply({ embeds: [deleteEmbed] });

  setTimeout(async () => {
    await channel.delete().catch(() => {});
  }, 5_000);
}
