import type { Message } from "discord.js";
import { getUser, updateUser } from "./storage.js";
import { ANIMAL_BY_ID, ANIMALS, ACTIVE_SKILLS, ACTIVE_SKILL_LIST, PET_SKILL_SLOTS } from "./data.js";
import { emoji } from "./emojis.js";

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

function ensureSlots(u: ReturnType<typeof getUser>, animalId: string): string[] {
  if (!u.petSkills[animalId]) u.petSkills[animalId] = Array(PET_SKILL_SLOTS).fill("");
  while (u.petSkills[animalId].length < PET_SKILL_SLOTS) u.petSkills[animalId].push("");
  return u.petSkills[animalId];
}

export async function cmdSkillShop(message: Message): Promise<void> {
  const lines = [`${emoji("sparkle")} **Pet Active Skill Catalog** *(buy via \`lowo buy skill_<id>\` or \`lowo learnskill <id>\`)*`];
  for (const s of ACTIVE_SKILL_LIST) {
    const cost = s.cost === 0 ? "*starter (free)*" : `${s.cost.toLocaleString()} cowoncy`;
    lines.push(`${s.emoji} \`${s.id}\` — **${s.name}** *(${s.rarity})* — ${cost}`);
    lines.push(`  ${s.description} *(cooldown: ${s.cooldown})*`);
  }
  await message.reply(lines.join("\n").slice(0, 1950));
}

export async function cmdLearnSkill(message: Message, args: string[]): Promise<void> {
  const id = args[0]?.toLowerCase();
  const skill = id ? ACTIVE_SKILLS[id] : null;
  if (!skill) { await message.reply("Usage: `lowo learnskill <skillId>` — see `lowo skillshop`."); return; }
  const u = getUser(message.author.id);
  if ((u.ownedSkills[skill.id] ?? 0) > 0) { await message.reply(`✅ You already know **${skill.name}**.`); return; }
  if (skill.cost > 0 && u.cowoncy < skill.cost) {
    await message.reply(`❌ Need **${skill.cost.toLocaleString()}** cowoncy *(you have ${u.cowoncy.toLocaleString()})*.`);
    return;
  }
  updateUser(message.author.id, (x) => {
    if (skill.cost > 0) x.cowoncy -= skill.cost;
    x.ownedSkills[skill.id] = 1;
  });
  await message.reply(`${skill.emoji} You learned **${skill.name}**! Equip it via \`lowo equipskill <pet> <slot 1-${PET_SKILL_SLOTS}> ${skill.id}\`.`);
}

export async function cmdMySkills(message: Message): Promise<void> {
  const u = getUser(message.author.id);
  const known = Object.keys(u.ownedSkills).filter((k) => (u.ownedSkills[k] ?? 0) > 0);
  if (known.length === 0) { await message.reply("📭 You haven't learned any active skills yet. See `lowo skillshop`."); return; }
  const lines = [`${emoji("sparkle")} **Your Known Skills**`];
  for (const id of known) {
    const s = ACTIVE_SKILLS[id]; if (!s) continue;
    lines.push(`${s.emoji} \`${s.id}\` — **${s.name}** *(${s.rarity})*`);
  }
  lines.push("\nEquip a skill: `lowo equipskill <pet> <slot 1-5> <skillId>`");
  await message.reply(lines.join("\n"));
}

export async function cmdEquipSkill(message: Message, args: string[]): Promise<void> {
  // lowo equipskill <name...> <slot> <skillId>
  if (args.length < 3) { await message.reply("Usage: `lowo equipskill <pet> <slot 1-5> <skillId>` (use `none` to clear a slot)"); return; }
  const skillId = args[args.length - 1].toLowerCase();
  const slotStr = args[args.length - 2];
  const slot = parseInt(slotStr, 10);
  if (isNaN(slot) || slot < 1 || slot > PET_SKILL_SLOTS) {
    await message.reply(`Slot must be 1–${PET_SKILL_SLOTS}.`);
    return;
  }
  const animalId = resolveAnimalId(args.slice(0, -2).join(" "));
  if (!animalId) { await message.reply("Unknown pet name."); return; }
  const u = getUser(message.author.id);
  if (!u.zoo[animalId] || u.zoo[animalId] <= 0) { await message.reply(`❌ You don't own ${ANIMAL_BY_ID[animalId].emoji} ${ANIMAL_BY_ID[animalId].name}.`); return; }

  if (skillId === "none" || skillId === "clear") {
    updateUser(message.author.id, (x) => { ensureSlots(x, animalId)[slot - 1] = ""; });
    await message.reply(`🧹 Cleared slot ${slot} on ${ANIMAL_BY_ID[animalId].emoji} **${ANIMAL_BY_ID[animalId].name}**.`);
    return;
  }
  const skill = ACTIVE_SKILLS[skillId];
  if (!skill) { await message.reply(`❌ No skill \`${skillId}\` exists.`); return; }
  if ((u.ownedSkills[skill.id] ?? 0) <= 0) {
    await message.reply(`❌ You haven't learned **${skill.name}** yet. \`lowo learnskill ${skill.id}\``);
    return;
  }
  updateUser(message.author.id, (x) => { ensureSlots(x, animalId)[slot - 1] = skill.id; });
  await message.reply(`${skill.emoji} Equipped **${skill.name}** to slot ${slot} on ${ANIMAL_BY_ID[animalId].emoji} **${ANIMAL_BY_ID[animalId].name}**.`);
}

export async function cmdPetSkills(message: Message, args: string[]): Promise<void> {
  const u = getUser(message.author.id);
  if (args.length === 0) {
    const owned = Object.keys(u.zoo).filter((k) => (u.zoo[k] ?? 0) > 0).slice(0, 25);
    if (owned.length === 0) { await message.reply("📭 No pets yet. Try `lowo hunt`."); return; }
    const lines = [`${emoji("sparkle")} **Your Pets' Equipped Skills**`];
    for (const id of owned) {
      const a = ANIMAL_BY_ID[id]; if (!a) continue;
      const slots = u.petSkills[id] ?? [];
      const view = Array.from({ length: PET_SKILL_SLOTS }, (_, i) => {
        const sid = slots[i] ?? ""; const s = sid ? ACTIVE_SKILLS[sid] : null;
        return s ? `${s.emoji}${s.name.split(" ")[0]}` : "·";
      }).join(" | ");
      lines.push(`${a.emoji} **${a.name}** — ${view}`);
    }
    lines.push("\nUse `lowo equipskill <pet> <slot 1-5> <skillId>` to set.");
    await message.reply(lines.join("\n").slice(0, 1900));
    return;
  }
  const animalId = resolveAnimalId(args.join(" "));
  if (!animalId) { await message.reply("Unknown pet name."); return; }
  const a = ANIMAL_BY_ID[animalId];
  const slots = u.petSkills[animalId] ?? Array(PET_SKILL_SLOTS).fill("");
  const lines = [`${a.emoji} **${a.name}** Skill Slots`];
  for (let i = 0; i < PET_SKILL_SLOTS; i++) {
    const sid = slots[i] ?? "";
    const s = sid ? ACTIVE_SKILLS[sid] : null;
    lines.push(`Slot ${i + 1}: ${s ? `${s.emoji} **${s.name}** *(${s.rarity})*` : "*(empty)*"}`);
  }
  await message.reply(lines.join("\n"));
}

/** Returns the equipped active skill ids for a given pet, in slot order. */
export function getPetSkillIds(userId: string, animalId: string): string[] {
  const u = getUser(userId);
  return (u.petSkills[animalId] ?? Array(PET_SKILL_SLOTS).fill("")).filter(Boolean);
}
