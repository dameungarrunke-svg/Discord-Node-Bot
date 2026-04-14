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

const HR  = "⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯";
const DOT = " · · · · · · · · · · · · · · · ";

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
  .setDescription("Deploy a raid alert to the server.")
  .setDefaultMemberPermissions(ADMIN)
  .addStringOption((o) =>
    o.setName("clan_name").setDescription("Your clan name").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("target").setDescription("Target clan or server").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("game_link").setDescription("Roblox game link").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("people_count").setDescription("Members needed (e.g. 15, 10+, All available)").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("raid_time").setDescription("Raid time (e.g. NOW, In 10 minutes, 3:00 PM EST)").setRequired(true)
  )
  .addRoleOption((o) =>
    o.setName("ping_role").setDescription("Role to ping").setRequired(false)
  )
  .addStringOption((o) =>
    o.setName("allies").setDescription("Allied clans joining the raid").setRequired(false)
  )
  .addStringOption((o) =>
    o.setName("notes").setDescription("Mission notes / briefing").setRequired(false)
  );

export async function executeStartRaid(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const clanName    = interaction.options.getString("clan_name", true);
  const target      = interaction.options.getString("target", true);
  const gameLink    = interaction.options.getString("game_link", true);
  const peopleCount = interaction.options.getString("people_count", true);
  const raidTime    = interaction.options.getString("raid_time", true);
  const pingRole    = interaction.options.getRole("ping_role");
  const allies      = interaction.options.getString("allies") || "None";
  const notes       = interaction.options.getString("notes") || "—";

  const embed = new EmbedBuilder()
    .setColor(0x4f46e5)
    .setAuthor({
      name: "LAST STAND  ·  COMMAND CENTER",
      iconURL: interaction.guild?.iconURL() ?? undefined,
    })
    .setTitle("⚔  RAID DEPLOYED — ALL FORCES MOBILIZE")
    .setDescription(
      `${HR}\n` +
      `▸  **CLAN NAME** ${DOT} \`${clanName}\`\n` +
      `▸  **TARGET** ${DOT} \`${target}\`\n` +
      `▸  **STRIKE FORCE** ${DOT} \`${peopleCount}\`\n` +
      `▸  **STRIKE TIME** ${DOT} \`${raidTime}\`\n` +
      `▸  **ALLIED CLANS** ${DOT} \`${allies}\`\n` +
      `${HR}\n` +
      `🔗  [**CLICK TO ENTER THE BATTLEFIELD**](${gameLink})\n` +
      `${HR}\n` +
      `**MISSION BRIEFING**\n` +
      `> ${notes}`
    )
    .setFooter({
      text: `Initiated by ${interaction.user.tag}  ·  Last Stand (LS)`,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setTimestamp();

  const channel = interaction.channel as TextChannel | null;
  if (!channel) {
    await interaction.editReply({ content: "❌ Cannot post in this channel." });
    return;
  }

  await channel.send({ content: pingRole ? `${pingRole}` : undefined, embeds: [embed] });
  await interaction.editReply({ content: "✅ Raid alert deployed." });
}

export const endRaidData = new SlashCommandBuilder()
  .setName("endraid")
  .setDescription("Close an active raid and post the match results.")
  .setDefaultMemberPermissions(ADMIN)
  .addStringOption((o) =>
    o.setName("clan_name").setDescription("Your clan name").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("opponent_clan").setDescription("Opponent clan name").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("result").setDescription("Raid outcome — type anything (e.g. Victory, Defeat, Clean sweep)").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("top_performers").setDescription("Top performers in the raid").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("notes").setDescription("Post-raid notes (optional)").setRequired(false)
  );

export async function executeEndRaid(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const clanName     = interaction.options.getString("clan_name", true);
  const opponentClan = interaction.options.getString("opponent_clan", true);
  const result       = interaction.options.getString("result", true);
  const topPerformers = interaction.options.getString("top_performers", true);
  const notes        = interaction.options.getString("notes") || "—";

  const lower = result.toLowerCase();
  const color =
    lower.includes("win") || lower.includes("victory") || lower.includes("won")
      ? 0x16a34a
      : lower.includes("loss") || lower.includes("defeat") || lower.includes("lost")
      ? 0xb91c1c
      : 0x6d28d9;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setAuthor({
      name: "LAST STAND  ·  MATCH RESULTS",
      iconURL: interaction.guild?.iconURL() ?? undefined,
    })
    .setTitle("🏁  RAID CONCLUDED — RESULTS LOGGED")
    .setDescription(
      `${HR}\n` +
      `▸  **CLAN** ${DOT} \`${clanName}\`\n` +
      `▸  **OPPONENT** ${DOT} \`${opponentClan}\`\n` +
      `▸  **OUTCOME** ${DOT} \`${result}\`\n` +
      `${HR}\n` +
      `**TOP PERFORMERS**\n` +
      `> ${topPerformers}\n` +
      `${HR}\n` +
      `**POST-RAID NOTES**\n` +
      `> ${notes}`
    )
    .setFooter({
      text: `Closed by ${interaction.user.tag}  ·  Last Stand (LS)`,
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
    await interaction.editReply({ content: `✅ Results posted to ${resultsChannel}.` });
  } else {
    const ch = interaction.channel as TextChannel | null;
    if (ch) await ch.send({ embeds: [embed] });
    await interaction.editReply({ content: "✅ Raid concluded and results logged." });
  }
}
