const _cooldowns = new Map<string, number>();

setInterval(() => {
  const now = Date.now();
  for (const [key, expiry] of _cooldowns) {
    if (now >= expiry) _cooldowns.delete(key);
  }
}, 60_000);

export function checkCooldown(
  userId: string,
  command: string,
  seconds: number
): number | false {
  const key = `${userId}:${command}`;
  const now = Date.now();
  const expiry = _cooldowns.get(key);
  if (expiry && now < expiry) {
    return Math.ceil((expiry - now) / 1000);
  }
  _cooldowns.set(key, now + seconds * 1000);
  return false;
}
