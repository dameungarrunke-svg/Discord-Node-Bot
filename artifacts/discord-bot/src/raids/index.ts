import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  TextChannel,
} from "discord.js";
import { saveRaidResult, nextRaidNumber } from "./store.js";

const ADMIN = PermissionFlagsBits.ManageGuild;

function shortDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPerformers(raw: string): string {
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length === 0) return raw;
  return list
    .map((name, i) => `${String(i + 1).padStart(2, "0")}  ${name}`)
    .join("\n");
}

function findChannel(
  interaction: ChatInputCommandInteraction,
  ...keywords: string[]
): TextChannel | null {
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

// ─── /startraid ──────────────────────────────────────────────────────────────

export const startRaidData = new SlashCommandBuilder()
  .setName("startraid")
  .setDescription("Deploy a raid alert to the server.")
  .addStringOption((o) =>
    o.setName("clan_name").setDescription("Your clan name (LS)").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("target").setDescription("Target clan name").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("game_link").setDescription("Roblox game link").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("people_count").setDescription("Members needed (e.g. 15)").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("allies").setDescription("Allied clans joining (optional)").setRequired(false)
  )
  .addStringOption((o) =>
    o.setName("notes").setDescription("Mission briefing (optional)").setRequired(false)
  );

export async function executeStartRaid(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const clanName    = interaction.options.getString("clan_name", true);
  const target      = interaction.options.getString("target", true);
  const gameLink    = interaction.options.getString("game_link", true);
  const peopleCount = interaction.options.getString("people_count", true);
  const pingRole    = interaction.options.getRole("ping_role");
  const allies      = interaction.options.getString("allies") || "None";
  const notes       = interaction.options.getString("notes");

  const raidNumber = nextRaidNumber();

  const fields: { name: string; value: string; inline?: boolean }[] = [
    {
      name: "◈  GAME LINK",
      value: `[▸ Enter the Battlefield](${gameLink})`,
    },
  ];

  if (notes) {
    fields.push({
      name: "◈  MISSION BRIEFING",
      value: `*${notes}*`,
    });
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setAuthor({
      name: "◇  RAID STARTING",
      iconURL: interaction.guild?.iconURL() ?? undefined,
    })
    .setTitle(`${clanName}  ——  ${target}`)
    .setDescription(
      `> Members Needed · **${peopleCount}**\n` +
      `> Allied Clans · ${allies}\n` +
      `> Date · ${shortDate()}`
    )
    .addFields(fields)
    .setFooter({
      text: `Raid #${raidNumber}  ·  Called by ${interaction.user.username}`,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setTimestamp();

  const channel = interaction.channel as TextChannel | null;
  if (!channel) {
    await interaction.editReply({ content: "❌ Cannot post in this channel." });
    return;
  }

  await channel.send({
    content: pingRole ? `${pingRole}` : undefined,
    embeds: [embed],
  });
  await interaction.editReply({ content: `✅ Raid #${raidNumber} deployed.` });
}

// ─── /endraid ────────────────────────────────────────────────────────────────

export const endRaidData = new SlashCommandBuilder()
  .setName("endraid")
  .setDescription("Close an active raid and post the match results.")
  .addStringOption((o) =>
    o.setName("clan_name").setDescription("Your clan name (LS)").setRequired(true)
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
        { name: "Victory — We won",          value: "victory" },
        { name: "Defeat — We lost",           value: "defeat"  },
        { name: "Draw — It was even",         value: "draw"    },
        { name: "Contested — Unclear result", value: "contested" }
      )
  )
  .addStringOption((o) =>
    o
      .setName("top_performers")
      .setDescription("Top performers (comma-separated: user1, user2, user3)")
      .setRequired(true)
  )
  .addStringOption((o) =>
    o
      .setName("notes")
      .setDescription("Commander's notes — format: username — note (optional)")
      .setRequired(false)
  );

export async function executeEndRaid(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const clanName      = interaction.options.getString("clan_name", true);
  const opponentClan  = interaction.options.getString("opponent_clan", true);
  const result        = interaction.options.getString("result", true);
  const topPerformers = interaction.options.getString("top_performers", true);
  const notes         = interaction.options.getString("notes");

  const raidNumber = nextRaidNumber();

  type Outcome = {
    authorLabel: string;
    outcomeDisplay: string;
    color: number;
  };

  const outcomeMap: Record<string, Outcome> = {
    victory:   { authorLabel: "◇  VICTORY",   outcomeDisplay: "🟢 WIN",           color: 0x16a34a },
    defeat:    { authorLabel: "◇  DEFEAT",     outcomeDisplay: "🔴 LOSS",           color: 0xb91c1c },
    draw:      { authorLabel: "◇  DRAW",       outcomeDisplay: "🟡 DRAW",           color: 0xd97706 },
    contested: { authorLabel: "◇  CONTESTED",  outcomeDisplay: "🟣 CONTESTED",      color: 0x7c3aed },
  };

  const outcome = outcomeMap[result] ?? outcomeMap.draw;

  const fields: { name: string; value: string; inline?: boolean }[] = [
    {
      name: "TOP PERFORMERS",
      value: formatPerformers(topPerformers),
    },
  ];

  if (notes) {
    fields.push({
      name: "COMMANDER'S NOTES",
      value: `*${notes}*`,
    });
  }

  const embed = new EmbedBuilder()
    .setColor(outcome.color)
    .setAuthor({
      name: outcome.authorLabel,
      iconURL: interaction.guild?.iconURL() ?? undefined,
    })
    .setTitle(`${clanName}  ——  ${opponentClan}`)
    .setDescription(
      `> Outcome · ${outcome.outcomeDisplay}\n` +
      `> Date · ${shortDate()}`
    )
    .addFields(fields)
    .setFooter({
      text: `Raid #${raidNumber}  ·  Logged by ${interaction.user.username}`,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setTimestamp();

  saveRaidResult({
    id: `${Date.now()}`,
    clanName,
    opponentClan,
    result,
    topPerformers,
    notes: notes ?? "—",
    endedBy: interaction.user.tag,
    endedById: interaction.user.id,
    timestamp: new Date().toISOString(),
    guildId: interaction.guildId ?? "",
    raidNumber,
  });

  const resultsChannel = findChannel(
    interaction,
    "raid-results",
    "ʀᴀɪᴅ-ʀᴇsᴜʟᴛs"
  );

  if (resultsChannel) {
    await resultsChannel.send({ embeds: [embed] });
    await interaction.editReply({
      content: `✅ Raid #${raidNumber} results posted to ${resultsChannel}.`,
    });
  } else {
    const ch = interaction.channel as TextChannel | null;
    if (ch) await ch.send({ embeds: [embed] });
    await interaction.editReply({
      content: `✅ Raid #${raidNumber} concluded and results logged.`,
    });
  }
}
