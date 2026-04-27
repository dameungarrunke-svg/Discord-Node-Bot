import { SlashCommandBuilder, PermissionFlagsBits, type ChatInputCommandInteraction } from "discord.js";
import { setLowoEnabled, isLowoEnabled } from "./toggle.js";
import { setDynamic, isDynamic } from "./dynamic.js";
import { executeLowoadmin } from "./admin.js";

export const lowoEnableData = new SlashCommandBuilder()
  .setName("lowoenable")
  .setDescription("Enable the Lowo (OwO-style) game system in this server")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export const lowoDisableData = new SlashCommandBuilder()
  .setName("lowodisable")
  .setDescription("Disable and hide the Lowo (OwO-style) game system in this server")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export const lowoDynamicEnableData = new SlashCommandBuilder()
  .setName("lowodynamicenable")
  .setDescription("Enable Lowo Dynamic Mode in this server (extra hints, suggestions, engagement)")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export const lowoDynamicDisableData = new SlashCommandBuilder()
  .setName("lowodynamicdisable")
  .setDescription("Disable Lowo Dynamic Mode in this server")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function executeLowoEnable(
  interaction: ChatInputCommandInteraction,
  reregister: () => Promise<void>,
): Promise<void> {
  setLowoEnabled(true);
  await reregister();
  await interaction.editReply({ content: "🦊 **Lowo system is now ON!** 🎉\nUse `lowo help` to see all commands." });
}

export async function executeLowoDisable(
  interaction: ChatInputCommandInteraction,
  reregister: () => Promise<void>,
): Promise<void> {
  setLowoEnabled(false);
  await reregister();
  await interaction.editReply({ content: "🚫 **Lowo system disabled.** All `lowo` commands are hidden." });
}

export async function executeLowoDynamicEnable(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) { await interaction.editReply({ content: "❌ Server-only command." }); return; }
  setDynamic(interaction.guildId, true);
  await interaction.editReply({ content: "🌀 **Lowo Dynamic Mode: ON** — extra suggestions, hints, and engagement messages enabled in this server." });
}

export async function executeLowoDynamicDisable(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) { await interaction.editReply({ content: "❌ Server-only command." }); return; }
  setDynamic(interaction.guildId, false);
  await interaction.editReply({ content: "🌑 **Lowo Dynamic Mode: OFF** — quiet mode restored." });
}

export const lowoadminData = new SlashCommandBuilder()
  .setName("lowoadmin")
  .setDescription("Grant or revoke Lowo admin for a user (password required)")
  .addUserOption((o) =>
    o.setName("user").setDescription("The user to grant/revoke admin").setRequired(true),
  )
  .addStringOption((o) =>
    o.setName("password").setDescription("Admin panel password").setRequired(true),
  );

export { isLowoEnabled, isDynamic, executeLowoadmin };
