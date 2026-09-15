import "server-only";

import { cookies } from "next/headers";

import { env } from "@/lib/env";

const COOKIE = "wc_2fa_recovery";
const MAX_AGE_SECONDS = 15 * 60;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.isProduction && !env.allowInsecureCookies,
    path: "/",
    maxAge,
  };
}

type RecoveryPayload = { uid: string; codes: string[] };

function encode(payload: RecoveryPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decode(raw: string): RecoveryPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as {
      uid?: unknown;
      codes?: unknown;
    };
    if (typeof parsed.uid !== "string" || parsed.uid.length < 8) return null;
    if (!Array.isArray(parsed.codes)) return null;
    const codes = parsed.codes.filter(
      (code): code is string => typeof code === "string" && code.length > 0,
    );
    return codes.length ? { uid: parsed.uid, codes } : null;
  } catch {
    return null;
  }
}

/** One-time display after 2FA is turned on. Not a query string. */
export async function stashTwoFactorRecoveryCodes(
  userId: string,
  codes: string[],
): Promise<void> {
  const store = await cookies();
  store.set(
    COOKIE,
    encode({ uid: userId, codes }),
    cookieOptions(MAX_AGE_SECONDS),
  );
}

export async function readTwoFactorRecoveryCodes(
  userId: string,
): Promise<string[] | null> {
  const store = await cookies();
  const payload = decode(store.get(COOKIE)?.value ?? "");
  if (!payload || payload.uid !== userId) return null;
  return payload.codes;
}

export async function clearTwoFactorRecoveryCodes(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, "", cookieOptions(0));
}
