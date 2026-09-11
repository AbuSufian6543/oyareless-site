const MINUTES_PER_HOUR = 60;
const MAX_MINUTES = 24 * MINUTES_PER_HOUR;

/** Hours + minutes from the work-log form → whole minutes. */
export function parseLoggedMinutes(hoursRaw: string, minutesRaw: string): number | null {
  const hours = hoursRaw.trim() === "" ? 0 : Number(hoursRaw);
  const minutes = minutesRaw.trim() === "" ? 0 : Number(minutesRaw);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || minutes < 0 || minutes >= MINUTES_PER_HOUR) return null;
  if (!Number.isInteger(minutes) && minutes !== Math.floor(minutes)) return null;
  const total = Math.round(hours * MINUTES_PER_HOUR + minutes);
  if (total < 1 || total > MAX_MINUTES) return null;
  return total;
}

export function formatLoggedDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / MINUTES_PER_HOUR);
  const rest = safe % MINUTES_PER_HOUR;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

export function splitLoggedMinutes(minutes: number): { hours: number; minutes: number } {
  const safe = Math.max(0, Math.round(minutes));
  return {
    hours: Math.floor(safe / MINUTES_PER_HOUR),
    minutes: safe % MINUTES_PER_HOUR,
  };
}

export function parseProductQuantity(raw: string): number | null {
  const value = Number(String(raw).trim());
  if (!Number.isFinite(value) || value <= 0 || value > 10000) return null;
  return Math.round(value * 100) / 100;
}

export function formatProductQuantity(quantity: number, unit: string): string {
  const amount = Number.isInteger(quantity) ? String(quantity) : String(quantity);
  return `${amount} ${unit}`.trim();
}
