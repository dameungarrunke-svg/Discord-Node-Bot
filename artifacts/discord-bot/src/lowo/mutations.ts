import { getEvent } from "./storage.js";
import { MUTATIONS, MUTATION_BY_ID, MUTATION_EVENT_IDS, rollMutation, type MutationDef } from "./data.js";

/** Returns the active mutation event def (or null). */
export function activeMutationEvent(): { id: string } | null {
  const ev = getEvent();
  if (!ev.id || ev.until < Date.now()) return null;
  if (!MUTATION_EVENT_IDS.includes(ev.id)) return null;
  return { id: ev.id };
}

/** Roll a mutation only when one of the 10 mutation events is active. */
export function maybeRollMutationDuringEvent(): MutationDef | null {
  if (!activeMutationEvent()) return null;
  return rollMutation();
}

export function mutationName(id: string): string {
  return MUTATION_BY_ID[id]?.name ?? id;
}

export function mutationLabel(id: string): string {
  const m = MUTATION_BY_ID[id];
  return m ? `${m.emoji} ${m.name}` : id;
}

export { MUTATIONS };
