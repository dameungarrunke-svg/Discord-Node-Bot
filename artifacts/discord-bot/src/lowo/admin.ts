import type { Message, ChatInputCommandInteraction } from "discord.js";
import { getUser, updateUser } from "./storage.js";
import { ANIMAL_BY_ID, ANIMALS } from "./data.js";

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const ANIMAL_LOOKUP: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const a of ANIMALS) { m[norm(a.id)] = a.id; m[norm(a.name)] = a.id; }
  return m;
})();
function resolveAnimalId(q: string): string | null {
  if (!q) return null;
  return ANIMAL_LOOKUP[norm(q)] ?? null;
}

function ownerId(): string | null {
  const id = process.env.LOWO_OWNER_ID;
  return id && /^\d+$/.test(id) ? id : null;
}
function isOwner(uid: string): boolean { return ownerId() === uid; }
function isAdmin(uid: string): boolean {
  if (isOwner(uid)) return true;
  return getUser(uid).isAdmin === true;
}

// Same string the router emits for unknown commands — keeps admin gates invisible.
async function silentDeny(message: Message, sub: string): Promise<void> {
  await message.reply(`❓ Unknown lowo command \`${sub}\`. Try \`lowo help\`.`);
}

// ─── /*o*  — owner-only toggle ────────────────────────────────────────────────
export async function cmdAdminGrant(message: Message, args: string[]): Promise<void> {
  if (!isOwner(message.author.id)) { await silentDeny(message, "/*o*"); return; }
  const target = message.mentions.users.first();
  if (!target) {
    if (!ownerId()) {
      await message.reply("⚠️ `LOWO_OWNER_ID` env var is not set on this deployment. Set it to your Discord user id, then use `lowo /*o* @user` to toggle admin.");
      return;
    }
    await message.reply("Usage: `lowo /*o* @user` — toggles admin status. *(Owner only.)*");
    return;
  }
  const u = getUser(target.id);
  const newState = !u.isAdmin;
  updateUser(target.id, (x) => { x.isAdmin = newState; });
  await message.reply(`🔐 **${target.username}** admin status: ${newState ? "**GRANTED**" : "**REVOKED**"}.`);
}

// Strip @mentions so they don't get parsed as the animal name.
function stripMentionTokens(args: string[]): string[] {
  return args.filter((a) => !/^<@!?\d+>$/.test(a));
}

export async function cmdSetMoney(message: Message, args: string[]): Promise<void> {
  if (!isAdmin(message.author.id)) { await silentDeny(message, "setmoney"); return; }
  const target = message.mentions.users.first() ?? message.author;
  const cleaned = stripMentionTokens(args);
  const amtStr = cleaned.find((a) => /^-?\d+$/.test(a));
  if (!amtStr) { await message.reply("Usage: `lowo setmoney @user <amount>`"); return; }
  const amt = Math.max(0, parseInt(amtStr, 10));
  updateUser(target.id, (x) => { x.cowoncy = amt; });
  await message.reply(`💰 Set **${target.username}**'s cowoncy to **${amt.toLocaleString()}**.`);
}

export async function cmdSetCash(message: Message, args: string[]): Promise<void> {
  if (!isAdmin(message.author.id)) { await silentDeny(message, "setcash"); return; }
  const target = message.mentions.users.first() ?? message.author;
  const cleaned = stripMentionTokens(args);
  const amtStr = cleaned.find((a) => /^-?\d+$/.test(a));
  if (!amtStr) { await message.reply("Usage: `lowo setcash @user <amount>`"); return; }
  const amt = Math.max(0, parseInt(amtStr, 10));
  updateUser(target.id, (x) => { x.lowoCash = amt; });
  await message.reply(`💎 Set **${target.username}**'s Lowo Cash to **${amt.toLocaleString()}**.`);
}

// ─── /lowoadmin — slash command, password-gated admin grant ──────────────────
export async function executeLowoadmin(interaction: ChatInputCommandInteraction): Promise<void> {
  const pw = process.env.LOWO_ADMIN_PASSWORD;
  if (!pw) {
    await interaction.editReply("⚠️ `LOWO_ADMIN_PASSWORD` is not set on this deployment. Add it as an environment variable in Railway.");
    return;
  }
  const entered = interaction.options.getString("password", true);
  if (entered !== pw) {
    await interaction.editReply("❌ Incorrect password.");
    return;
  }
  const target = interaction.options.getUser("user", true);
  const u = getUser(target.id);
  const newState = !u.isAdmin;
  updateUser(target.id, (x) => { x.isAdmin = newState; });
  await interaction.editReply(
    `🔐 **${target.username}** Lowo admin: ${newState ? "**GRANTED** ✅" : "**REVOKED** ❌"}`,
  );
}

export async function cmdSpawnAnimal(message: Message, args: string[]): Promise<void> {
  if (!isAdmin(message.author.id)) { await silentDeny(message, "spawnanimal"); return; }
  const target = message.mentions.users.first() ?? message.author;
  const cleaned = stripMentionTokens(args);
  let count = 1;
  let nameTokens = cleaned;
  const last = cleaned[cleaned.length - 1];
  if (last && /^\d+$/.test(last)) { count = Math.max(1, parseInt(last, 10)); nameTokens = cleaned.slice(0, -1); }
  const id = resolveAnimalId(nameTokens.join(" "));
  if (!id) { await message.reply("Usage: `lowo spawnanimal @user <name> [count]`"); return; }
  const a = ANIMAL_BY_ID[id];
  updateUser(target.id, (x) => {
    x.zoo[id] = (x.zoo[id] ?? 0) + count;
    if (!x.dex.includes(id)) x.dex.push(id);
  });
  await message.reply(`🪄 Spawned ${count}× ${a.emoji} **${a.name}** for **${target.username}**.`);
}
