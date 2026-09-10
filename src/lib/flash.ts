import "server-only";

import { cookies } from "next/headers";

import { env } from "@/lib/env";
import { FLASH_COOKIE, type FlashKind } from "@/lib/flash-client";

export { FLASH_COOKIE, FLASH_MESSAGES, parseFlashValue, type FlashKind } from "@/lib/flash-client";

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
