/**
 * Office clock for the whole site. Dates are stored in UTC; every screen,
 * email, and audit line should read them in this zone so they match.
 *
 * Default is Toronto (Eastern Time). Admins can change it under Site settings.
 */

export const DEFAULT_DISPLAY_TIMEZONE = "America/Toronto";

export const DISPLAY_TIMEZONES = [
  { value: "America/St_Johns", label: "St. John's (Newfoundland Time)" },
  { value: "America/Halifax", label: "Halifax (Atlantic Time)" },
  { value: "America/Toronto", label: "Toronto (Eastern Time)" },
  { value: "America/Winnipeg", label: "Winnipeg (Central Time)" },
  { value: "America/Edmonton", label: "Edmonton (Mountain Time)" },
  { value: "America/Vancouver", label: "Vancouver (Pacific Time)" },
  { value: "UTC", label: "UTC" },
] as const;

let boundTimeZone: string = DEFAULT_DISPLAY_TIMEZONE;

function isValidIana(value: string): boolean {
  try {
    Intl.DateTimeFormat("en-CA", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function normalizeTimeZone(value: string | null | undefined): string {
  const zone = String(value ?? "").trim();
  if (
    zone &&
    DISPLAY_TIMEZONES.some((item) => item.value === zone) &&
    isValidIana(zone)
  ) {
    return zone;
  }
  return DEFAULT_DISPLAY_TIMEZONE;
}

/** Call from the root layout after loading site settings. */
export function bindDisplayTimeZone(value: string | null | undefined): string {
  boundTimeZone = normalizeTimeZone(value);
  return boundTimeZone;
}

export function displayTimeZone(): string {
  if (typeof document !== "undefined") {
    const fromDom = document.documentElement.getAttribute("data-timezone");
    if (fromDom) return normalizeTimeZone(fromDom);
  }
  return boundTimeZone;
}

export type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

export function zonedParts(date: Date, timeZone = displayTimeZone()): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
    second: read("second"),
  };
}

function offsetMsAt(date: Date, timeZone: string): number {
  const parts = zonedParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return asUtc - date.getTime();
}

/** Wall-clock time in `timeZone`, returned as a UTC Date. */
export function zonedWallTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone = displayTimeZone(),
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const first = new Date(utcGuess - offsetMsAt(new Date(utcGuess), timeZone));
  return new Date(utcGuess - offsetMsAt(first, timeZone));
}

export function startOfZonedDay(date: Date, timeZone = displayTimeZone()): Date {
  const parts = zonedParts(date, timeZone);
  return zonedWallTime(parts.year, parts.month, parts.day, 0, 0, timeZone);
}

export function calendarDateKey(date: Date, timeZone = displayTimeZone()): string {
  const { year, month, day } = zonedParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function zonedHour(date = new Date(), timeZone = displayTimeZone()): number {
  return zonedParts(date, timeZone).hour;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** `datetime-local` value (`YYYY-MM-DDTHH:mm`) in the office timezone. */
export function dateTimeLocalValue(date: Date, timeZone = displayTimeZone()): string {
  const parts = zonedParts(date, timeZone);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}T${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

/** Read a `datetime-local` string as a wall clock in the office timezone. */
export function parseDateTimeLocal(
  value: string,
  timeZone = displayTimeZone(),
): Date | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return null;
  const date = zonedWallTime(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    timeZone,
  );
  return Number.isNaN(date.getTime()) ? null : date;
}
