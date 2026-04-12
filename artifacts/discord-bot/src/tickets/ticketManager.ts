export interface ActiveTicket {
  channelId: string;
  userId: string;
  createdAt: number;
}

const activeTickets = new Map<string, ActiveTicket>();
const cooldowns = new Map<string, number>();

const COOLDOWN_MS = 5 * 60 * 1000;

export function hasActiveTicket(userId: string): boolean {
  return activeTickets.has(userId);
}

export function getActiveTicket(userId: string): ActiveTicket | undefined {
  return activeTickets.get(userId);
}

export function addActiveTicket(userId: string, channelId: string): void {
  activeTickets.set(userId, {
    channelId,
    userId,
    createdAt: Date.now(),
  });
}

export function removeActiveTicket(userId: string): void {
  activeTickets.delete(userId);
  cooldowns.set(userId, Date.now());
}

export function removeActiveTicketByChannelId(channelId: string): string | null {
  for (const [userId, ticket] of activeTickets.entries()) {
    if (ticket.channelId === channelId) {
      activeTickets.delete(userId);
      cooldowns.set(userId, Date.now());
      return userId;
    }
  }
  return null;
}

export function isOnCooldown(userId: string): number {
  const last = cooldowns.get(userId);
  if (!last) return 0;
  const remaining = COOLDOWN_MS - (Date.now() - last);
  return remaining > 0 ? remaining : 0;
}
