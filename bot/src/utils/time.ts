export function nowIso(): string {
  return new Date().toISOString();
}

export function getRemainingMilliseconds(lastAt: string | null, cooldownMs: number, nowMs: number): number {
  if (!lastAt) {
    return 0;
  }

  const lastAtMs = Date.parse(lastAt);
  const remaining = lastAtMs + cooldownMs - nowMs;

  return remaining > 0 ? remaining : 0;
}

export function getReadyAt(lastAt: string | null, cooldownMs: number): string | null {
  if (!lastAt) {
    return null;
  }

  return new Date(Date.parse(lastAt) + cooldownMs).toISOString();
}

export function formatDuration(milliseconds: number): string {
  if (milliseconds <= 0) {
    return 'Disponible maintenant';
  }

  const totalSeconds = Math.ceil(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }

  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds}s`);
  }

  return parts.join(' ');
}
