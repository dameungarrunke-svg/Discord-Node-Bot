import { ANIMAL_BY_ID, type HuntArea, type Animal } from "./data.js";

// ─── Volcanic ────────────────────────────────────────────────────────────────
// "Heat" penalty on hunt cooldown.
export const VOLCANIC_HUNT_COOLDOWN_PENALTY_MS = 2_000;
// Fire-type pets get +20% ATK in battle.
export const VOLCANIC_FIRE_ATK_BONUS = 0.20;

// ─── Heaven ──────────────────────────────────────────────────────────────────
// +10% additive luck on hunts.
export const HEAVEN_LUCK_BONUS = 0.10;
// Sacrifice returns -20% essence ("holy place").
export const HEAVEN_SACRIFICE_PENALTY = 0.80;

// ─── Void ────────────────────────────────────────────────────────────────────
// In battle, stats are hidden — players have to feel the fight.
export function hideStatsInBattle(area: HuntArea): boolean {
  return area === "void_unknown";
}

// ─── Fire-type detection ─────────────────────────────────────────────────────
// A pet is "fire-type" if it lives in the volcanic area, has the inferno
// rarity, OR has a fire/burn signature skill.
const FIRE_SIG_SKILLS = new Set([
  "fire_breath", "cinder_burn", "infernal_blast", "flame_aura",
  "burn", "ember_strike", "magma_slam",
]);
export function isFireType(animalId: string): boolean {
  const a = ANIMAL_BY_ID[animalId];
  if (!a) return false;
  return isFireAnimal(a);
}
export function isFireAnimal(a: Animal): boolean {
  if (a.area === "volcanic") return true;
  if (a.rarity === "inferno") return true;
  if (a.signatureSkill && FIRE_SIG_SKILLS.has(a.signatureSkill)) return true;
  // Heuristic fallback for fusion / themed pets named after fire concepts.
  const n = a.name.toLowerCase();
  if (/(fire|flame|inferno|magma|lava|phoenix|dragon|ember|blaze|pyro|solar)/.test(n)) return true;
  return false;
}

// ─── Hunt cooldown penalty by area ───────────────────────────────────────────
export function huntCooldownPenaltyMs(area: HuntArea): number {
  return area === "volcanic" ? VOLCANIC_HUNT_COOLDOWN_PENALTY_MS : 0;
}

// ─── Hunt luck bonus by area (additive multiplier) ───────────────────────────
export function huntLuckMultiplier(area: HuntArea): number {
  return area === "heaven" ? 1 + HEAVEN_LUCK_BONUS : 1;
}

// ─── Sacrifice multiplier by area ────────────────────────────────────────────
export function sacrificeAreaMultiplier(area: HuntArea): number {
  return area === "heaven" ? HEAVEN_SACRIFICE_PENALTY : 1;
}

// ─── Battle ATK bonus for a pet given the hunter/owner's last-hunt area ──────
// In volcanic, fire-type pets gain +20% ATK.
export function petBattleAtkBonus(animalId: string, area: HuntArea): number {
  if (area === "volcanic" && isFireType(animalId)) return 1 + VOLCANIC_FIRE_ATK_BONUS;
  return 1;
}

// Human-readable trait labels used by `lowo area` and the update log.
export const AREA_TRAITS: Record<HuntArea, string[]> = {
  default: [],
  volcanic: [
    `🔥 Fire-type pets gain **+${Math.round(VOLCANIC_FIRE_ATK_BONUS * 100)}% ATK** in battle.`,
    `♨️ Hunt cooldown **+${VOLCANIC_HUNT_COOLDOWN_PENALTY_MS / 1000}s** due to extreme heat.`,
  ],
  space: [],
  heaven: [
    `✨ Hunt luck **+${Math.round(HEAVEN_LUCK_BONUS * 100)}%** while hunting here.`,
    `🕊️ Sacrifices return **${Math.round((1 - HEAVEN_SACRIFICE_PENALTY) * 100)}% less essence** — it's a holy place.`,
  ],
  void_unknown: [
    `🕳️ All battle stats are **hidden** while your last-hunt area is the Void — feel the fight.`,
  ],
};
