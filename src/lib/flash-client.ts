export const FLASH_COOKIE = "wc_flash";
export const FLASH_EVENT = "wc-flash";

export type FlashKind = "saved" | "created" | "deleted" | "updated" | "notified" | "logged";

export type FlashNotice = {
  tone: "ok" | "err";
  message: string;
};

export const FLASH_MESSAGES: Record<FlashKind, string> = {
  saved: "Saved.",
  created: "Created.",
  deleted: "Deleted.",
  updated: "Updated.",
  notified: "Reminder sent.",
  logged: "Work log updated.",
};

export function parseFlashValue(value: string | undefined | null): FlashKind | null {
  if (!value) return null;
  const kind = typeof value === "string" ? value.split(":")[0] : "";
  if (
    kind === "saved" ||
    kind === "created" ||
    kind === "deleted" ||
    kind === "updated" ||
    kind === "notified" ||
    kind === "logged"
  ) {
    return kind;
  }
  return null;
}

/** Cookie shape `n:ok:timestamp:message` for a sentence the toast can show as success or failure. */
export function parseFlashNotice(value: string | undefined | null): FlashNotice | null {
  if (!value || !value.startsWith("n:")) return null;
  const parts = value.split(":");
  const tone = parts[1];
  if ((tone !== "ok" && tone !== "err") || parts.length < 4) return null;
  try {
    const message = decodeURIComponent(parts.slice(3).join(":")).trim();
    if (!message) return null;
    return { tone, message: message.slice(0, 140) };
  } catch {
    return null;
  }
}

/** Shows the staff toast immediately after an in-place save (no redirect). */
export function emitFlash(kind: FlashKind): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FLASH_EVENT, { detail: kind }));
}

export function clearFlashCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${FLASH_COOKIE}=; path=/; max-age=0; SameSite=Lax${
    window.location.protocol === "https:" ? "; Secure" : ""
  }`;
}
