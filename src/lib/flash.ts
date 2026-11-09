import "server-only";

import { cookies } from "next/headers";

import { env } from "@/lib/env";
import { FLASH_COOKIE, type FlashKind, type FlashNotice } from "@/lib/flash-client";

export { FLASH_COOKIE, FLASH_MESSAGES, parseFlashNotice, parseFlashValue, type FlashKind, type FlashNotice } from "@/lib/flash-client";

/** Sets a short-lived flash for the staff toast. Safe to call from server actions. */
export async function setFlash(kind: FlashKind): Promise<void> {
  const store = await cookies();
  store.set(FLASH_COOKIE, `${kind}:${Date.now()}`, {
    path: "/",
    maxAge: 30,
    httpOnly: false,
    sameSite: "lax",
    secure: env.isProduction && !env.allowInsecureCookies,
  });
}

/** A sentence for the staff popup. The message is ours, never text a visitor typed. */
export async function setFlashNotice(tone: FlashNotice["tone"], message: string): Promise<void> {
  const clean = message.replace(/\s+/g, " ").trim().slice(0, 140);
  if (!clean) return;
  const store = await cookies();
  store.set(FLASH_COOKIE, `n:${tone}:${Date.now()}:${encodeURIComponent(clean)}`, {
    path: "/",
    maxAge: 30,
    httpOnly: false,
    sameSite: "lax",
    secure: env.isProduction && !env.allowInsecureCookies,
  });
}
