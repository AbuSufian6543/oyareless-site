export const FLASH_COOKIE = "wc_flash";
export const FLASH_EVENT = "wc-flash";

export type FlashKind = "saved" | "created" | "deleted" | "updated" | "notified" | "logged";

export const FLASH_MESSAGES: Record<FlashKind, string> = {
  saved: "Saved.",
  created: "Created.",
  deleted: "Deleted.",
  updated: "Updated.",
  notified: "Notification sent.",
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
