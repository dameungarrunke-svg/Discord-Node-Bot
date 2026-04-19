import {
  Message,
  Client,
  EmbedBuilder,
  TextChannel,
  GuildMember,
} from "discord.js";
import {
  getGuildConfig,
  getUser,
  saveUser,
  getGuildLevelRoles,
  GuildConfig,
} from "./db.js";

// ─── XP Formula (Arcane-style) ────────────────────────────────────────────────
// XP needed to advance from level N → N+1
export function xpForLevel(level: number): number {
  return 5 * level * level + 50 * level + 100;
}

// Total XP required to reach a given level from zero
export function totalXpToReachLevel(target: number): number {
  let sum = 0;
  for (let i = 0; i < target; i++) sum += xpForLevel(i);
  return sum;
}

// Derive current level, XP within that level, and XP needed for next level-up
export function computeLevel(totalXp: number): {
  level: number;
  currentXp: number;
  neededXp: number;
} {
  let level = 0;
  let remaining = totalXp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  return { level, currentXp: remaining, neededXp: xpForLevel(level) };
}

// Unicode progress bar
export function progressBar(current: number, total: number, length = 16): string {
  const pct = total > 0 ? Math.min(current / total, 1) : 0;
  const filled = Math.round(pct * length);
  return "█".repeat(filled) + "░".repeat(length - filled);
}

// ─── Anti-Spam ────────────────────────────────────────────────────────────────

function isSpam(content: string, lastContent: string): boolean {
  const c = content.trim();
  if (c.length < 3) return true;
  if (c === lastContent) return true;
  // Repeating single character: "aaaaaaa"
  if (/^(.)\1{5,}$/.test(c)) return true;
  // All caps + short: "AAAA"
  if (c.length < 6 && c === c.toUpperCase() && /[A-Z]/.test(c)) return true;
  return false;
}

// ─── Multiplier Calculation ───────────────────────────────────────────────────

function computeXpGain(config: GuildConfig, memberRoleIds: string[]): number {
  const base =
    Math.floor(Math.random() * (config.xpMax - config.xpMin + 1)) + config.xpMin;

  // Apply role-based multiplier (best-wins, not stacked)
  let roleBonus = 1.0;
  for (const roleId of memberRoleIds) {
    const m = config.roleMultipliers[roleId];
    if (m && m > roleBonus) roleBonus = m;
  }

  const total = config.serverMultiplier * config.eventMultiplier * roleBonus;
  return Math.max(1, Math.round(base * total));
}

// ─── Main message processor ───────────────────────────────────────────────────

export async function processMessage(message: Message, client: Client): Promise<void> {
  if (!message.guild || message.author.bot) return;
  if (message.content.startsWith("/")) return;

  const guildId = message.guild.id;
  const userId = message.author.id;
  const config = getGuildConfig(guildId);

  // System-wide kill switch
  if (!config.enabled) return;

  // Channel gate
  if (config.blacklistedChannels.includes(message.channelId)) return;
  if (
    config.whitelistedChannels.length > 0 &&
    !config.whitelistedChannels.includes(message.channelId)
  )
    return;

  const now = Date.now();
  const user = getUser(guildId, userId);

  // Cooldown gate
  if ((now - user.lastMessageAt) / 1000 < config.cooldown) return;

  // Spam gate
  const content = message.content.trim();
  if (isSpam(content, user.lastMessageContent)) return;

  // Compute and apply XP
  const memberRoleIds = message.member
    ? [...message.member.roles.cache.keys()]
    : [];
  const xpGain = computeXpGain(config, memberRoleIds);

  const oldTotalXp = user.totalXp;
  const oldLevel = computeLevel(oldTotalXp).level;

  user.totalXp += xpGain;
  user.weeklyXp += xpGain;
  user.lastMessageAt = now;
  user.lastMessageContent = content;

  const { level: newLevel, currentXp, neededXp } = computeLevel(user.totalXp);
  user.level = newLevel;
  user.xp = currentXp;

  saveUser(guildId, userId, user);

  // Level-up handler
  if (newLevel > oldLevel && message.member) {
    handleLevelUp(
      message.member,
      oldLevel,
      newLevel,
      config,
      client,
      guildId,
      { currentXp, neededXp }
    ).catch((err) => console.error("[LEVELING] Level-up handler error:", err));
  }
}

// ─── Level-up handler ─────────────────────────────────────────────────────────

export async function handleLevelUp(
  member: GuildMember,
  oldLevel: number,
  newLevel: number,
  config: GuildConfig,
  client: Client,
  guildId: string,
  xpInfo: { currentXp: number; neededXp: number }
): Promise<void> {
  const guild = member.guild;
  const levelRoles = getGuildLevelRoles(guildId);

  const rolesToAdd: string[] = [];
  const rolesToRemove: string[] = [];
  let unlockedRoleName: string | undefined;

  // For each configured level-role, check what to add/remove
  for (const [lvlStr, roleName] of Object.entries(levelRoles)) {
    const lvl = Number(lvlStr);
    const role = guild.roles.cache.find(
      (r) => r.name.toLowerCase() === roleName.toLowerCase()
    );
    if (!role) {
      // Only log error if this level is being crossed
      if (lvl === newLevel) {
        console.error(
          `[LEVELING] Role not found: "${roleName}" for level ${lvl} in guild ${guildId}`
        );
      }
      continue;
    }

    if (lvl === newLevel) {
      unlockedRoleName = roleName;
      if (!member.roles.cache.has(role.id)) rolesToAdd.push(role.id);
    } else if (!config.keepOldRoles && lvl < newLevel) {
      if (member.roles.cache.has(role.id)) rolesToRemove.push(role.id);
    }
  }

  if (rolesToRemove.length > 0) {
    try {
      await member.roles.remove(rolesToRemove, `Level-up to ${newLevel} — replacing old role`);
    } catch (err) {
      console.error("[LEVELING] Failed to remove old roles:", err);
    }
  }

  if (rolesToAdd.length > 0) {
    try {
      await member.roles.add(rolesToAdd, `Reached level ${newLevel}`);
    } catch (err) {
      console.error("[LEVELING] Failed to add new role:", err);
    }
  }

  if (!config.announcements) return;

  // Build level-up embed
  const bar = progressBar(xpInfo.currentXp, xpInfo.neededXp);
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setAuthor({
      name: member.user.username,
      iconURL: member.user.displayAvatarURL(),
    })
    .setTitle(`⚡  LEVEL  ${newLevel}`)
    .setDescription(
      unlockedRoleName
        ? `◈  Role Unlocked · **${unlockedRoleName}**`
        : `◈  Keep climbing — next role awaits.`
    )
    .addFields({
      name: "XP Progress",
      value: `\`${bar}\`\n${xpInfo.currentXp.toLocaleString()} / ${xpInfo.neededXp.toLocaleString()} XP`,
    })
    .setFooter({ text: `Level ${oldLevel} → ${newLevel}` })
    .setTimestamp();

  // Find the level-up channel
  let channel: TextChannel | null = null;
  if (config.levelUpChannelId) {
    try {
      channel = (await guild.channels.fetch(config.levelUpChannelId)) as TextChannel | null;
    } catch {
      /* channel may have been deleted */
    }
  }
  if (!channel) {
    channel =
      (guild.channels.cache.find(
        (c) =>
          c.isTextBased() &&
          (c.name.includes("general") ||
            c.name.includes("level") ||
            c.name.includes("chat"))
      ) as TextChannel | undefined) ?? null;
  }

  if (channel) {
    try {
      await channel.send({
        content: config.pingOnLevelUp ? `<@${member.user.id}>` : undefined,
        embeds: [embed],
      });
    } catch (err) {
      console.error("[LEVELING] Failed to post level-up embed:", err);
    }
  }
}
