// ─── MODERATION — Professional Warn + Auto-Timeout System ────────────────────
// Commands: `lowo warn @user <reason>`  |  `lowo clearwarn @user <amount>`
// Permission required: ManageMessages OR ModerateMembers (Discord guild perm)
// Punishment ladder:
//   1–2 warns → DM only
//   3 warns   → 1-hour timeout
//   4 warns   → 12-hour timeout
//   5+ warns  → 24-hour timeout (permanent escalation)

import {
  EmbedBuilder, PermissionFlagsBits,
  type Message, type GuildMember,
} from "discord.js";
import { getUser, updateUser } from "./storage.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const HOUR = 60 * 60 * 1000;

function timeoutDuration(warnCount: number): number | null {
  if (warnCount === 3) return 1 * HOUR;
  if (warnCount === 4) return 12 * HOUR;
  if (warnCount >= 5)  return 24 * HOUR;
  return null;
}

function timeoutLabel(warnCount: number): string | null {
  if (warnCount === 3) return "1 Hour Timeout";
  if (warnCount === 4) return "12 Hour Timeout";
  if (warnCount >= 5)  return "24 Hour Timeout";
  return null;
}

function hasModPerms(member: GuildMember): boolean {
  return (
    member.permissions.has(PermissionFlagsBits.ManageMessages) ||
    member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
    member.permissions.has(PermissionFlagsBits.Administrator)
  );
}

// ─── DM Embed ─────────────────────────────────────────────────────────────────
async function sendPunishmentDM(
  target: GuildMember,
  moderator: GuildMember,
  reason: string,
  warnCount: number,
): Promise<void> {
  const punishment = timeoutLabel(warnCount) ?? "Warning";
  const isTimeout = warnCount >= 3;

  const embed = new EmbedBuilder()
    .setColor(0xE74C3C)
    .setTitle("❗ Punishment Issued")
    .setDescription(
      "You received a punishment from our staff for breaking server rules. " +
      "Please revise the rules again, and check the details of your punishment below.",
    )
    .addFields(
      { name: "• Punishment", value: punishment, inline: false },
      { name: "• Moderator", value: `<@${moderator.id}>`, inline: false },
      { name: "• Reason", value: reason, inline: false },
      { name: "• Warn Count", value: `${warnCount}`, inline: false },
      {
        name: "• Punishment Schedule",
        value: [
          "3 warns → **1 Hour** Timeout",
          "4 warns → **12 Hour** Timeout",
          "5 warns → **24 Hour** Timeout",
          "6+ warns → **24 Hour** Timeout (each time)",
        ].join("\n"),
        inline: false,
      },
    )
    .setFooter({ text: `${target.guild.name} Moderation Team` })
    .setTimestamp();

  if (isTimeout) {
    embed.addFields({
      name: "• Action Taken",
      value: `You have been automatically timed out for **${punishment}**.`,
      inline: false,
    });
  }

  try {
    await target.send({ embeds: [embed] });
  } catch {
    // DMs may be disabled — silently skip
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CMD: lowo warn @user <reason>
// ═══════════════════════════════════════════════════════════════════════════════
export async function cmdWarn(message: Message, args: string[]): Promise<void> {
  const mod = message.member as GuildMember | null;
  if (!mod || !hasModPerms(mod)) {
    await message.reply("🔒 You need **Manage Messages** or **Timeout Members** permission to use this command.");
    return;
  }

  const target = message.mentions.members?.first();
  if (!target) {
    await message.reply("Usage: `lowo warn @user <reason>`");
    return;
  }
  if (target.id === message.author.id) {
    await message.reply("❌ You cannot warn yourself.");
    return;
  }
  if (target.user.bot) {
    await message.reply("❌ You cannot warn bots.");
    return;
  }

  // Collect reason (everything after the mention token)
  const reasonTokens = args.filter((a) => !/^<@!?\d+>$/.test(a));
  const reason = reasonTokens.join(" ").trim() || "No reason provided.";

  // Increment warn count
  updateUser(target.id, (x) => { x.warnCount = (x.warnCount ?? 0) + 1; });
  const warnCount = getUser(target.id).warnCount;

  // Apply timeout if threshold reached
  const duration = timeoutDuration(warnCount);
  let timedOut = false;
  if (duration !== null) {
    try {
      await target.timeout(duration, `Warn #${warnCount} — ${reason}`);
      timedOut = true;
    } catch {
      // Bot may lack ModerateMembers or target is above bot in role hierarchy
    }
  }

  // DM the punished user
  await sendPunishmentDM(target, mod, reason, warnCount);

  // Reply in channel (clean, professional)
  const label = timeoutLabel(warnCount);
  const lines: string[] = [
    `✅ **Warning issued** to ${target} by ${message.author}.`,
    `• **Reason:** ${reason}`,
    `• **Total Warns:** ${warnCount}`,
  ];
  if (label) {
    lines.push(
      timedOut
        ? `• **Auto-Timeout:** ⏱️ ${label} applied.`
        : `• **Auto-Timeout:** ⏱️ ${label} — could not apply (check bot role/permissions).`,
    );
  } else {
    lines.push("• **Action:** DM notification sent.");
  }
  lines.push("• **Schedule:** 3 warns = 1 hr · 4 warns = 12 hr · 5+ warns = 24 hr");

  const embed = new EmbedBuilder()
    .setColor(warnCount >= 5 ? 0xE74C3C : warnCount >= 3 ? 0xE67E22 : 0xF1C40F)
    .setTitle("⚠️ Moderation Action")
    .setDescription(lines.join("\n"))
    .setTimestamp()
    .setFooter({ text: `Warned by ${message.author.tag}` });

  await message.reply({ embeds: [embed] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CMD: lowo clearwarn @user <amount>
// ═══════════════════════════════════════════════════════════════════════════════
export async function cmdClearWarn(message: Message, args: string[]): Promise<void> {
  const mod = message.member as GuildMember | null;
  if (!mod || !hasModPerms(mod)) {
    await message.reply("🔒 You need **Manage Messages** or **Timeout Members** permission to use this command.");
    return;
  }

  const target = message.mentions.members?.first();
  if (!target) {
    await message.reply("Usage: `lowo clearwarn @user <amount>`");
    return;
  }

  const cleaned = args.filter((a) => !/^<@!?\d+>$/.test(a));
  const amtStr = cleaned.find((a) => /^\d+$/.test(a));
  if (!amtStr) {
    await message.reply("Usage: `lowo clearwarn @user <amount>`\n_e.g. `lowo clearwarn @user 2` removes 2 warns._");
    return;
  }
  const amount = Math.max(1, parseInt(amtStr, 10));

  updateUser(target.id, (x) => {
    x.warnCount = Math.max(0, (x.warnCount ?? 0) - amount);
  });
  const newTotal = getUser(target.id).warnCount;

  const embed = new EmbedBuilder()
    .setColor(0x2ECC71)
    .setTitle("✅ Warns Cleared")
    .setDescription(
      `Removed **${amount}** warn(s) from ${target}.\n` +
      `• **New Total:** ${newTotal} warn(s)\n` +
      `• **Next threshold:** ${
        newTotal < 3 ? `${3 - newTotal} more warn(s) until 1-hour timeout`
        : newTotal < 4 ? "1 more warn until 12-hour timeout"
        : newTotal < 5 ? "1 more warn until 24-hour timeout"
        : "Already at/above 5 — next warn = 24-hour timeout"
      }`,
    )
    .setTimestamp()
    .setFooter({ text: `Actioned by ${message.author.tag}` });

  await message.reply({ embeds: [embed] });
}
