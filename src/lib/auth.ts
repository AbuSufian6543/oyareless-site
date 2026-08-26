import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { generateSecret, generateURI, verify as verifyTotp } from "otplib";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret, hashToken, randomToken } from "@/lib/crypto";
import type { Role, User } from "@/generated/prisma/client";

export {
  hashPassword,
  hashRecoveryCodes,
  validatePasswordStrength,
  verifyPassword,
  verifyRecoveryCode,
  type PasswordProblem,
} from "@/lib/passwords";

export const SESSION_COOKIE = "wc_session";
export const TWO_FACTOR_COOKIE = "wc_2fa";

const SESSION_DAYS = 7;

/** Role ranking used for "at least this role" checks. */
const ROLE_RANK: Record<Role, number> = {
  VIEWER: 1,
  EDITOR: 2,
  ADMIN: 3,
  SUPERADMIN: 4,
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl: string | null;
  mustChangePassword: boolean;
  twoFactorEnabled: boolean;
};

// ---------------------------------------------------------------------------
// JWT wrapper around the opaque session token
// ---------------------------------------------------------------------------

function secretKey(): Uint8Array {
  return new TextEncoder().encode(env.authSecret);
}

async function signSessionCookie(
  sessionId: string,
  token: string,
  expiresAt: Date,
): Promise<string> {
  return new SignJWT({ sid: sessionId, tok: token })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("wirelesscom.ca")
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secretKey());
}

async function readSessionCookie(
  value: string,
): Promise<{ sid: string; tok: string } | null> {
  try {
    const { payload } = await jwtVerify(value, secretKey(), {
      issuer: "wirelesscom.ca",
    });
    if (typeof payload.sid === "string" && typeof payload.tok === "string") {
      return { sid: payload.sid, tok: payload.tok };
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

async function requestContext() {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  return {
    ipAddress:
      forwarded?.split(",")[0]?.trim() ||
      headerList.get("x-real-ip") ||
      "unknown",
    userAgent: headerList.get("user-agent") ?? "unknown",
  };
}

export async function createSession(userId: string): Promise<void> {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const { ipAddress, userAgent } = await requestContext();

  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      ipAddress,
      userAgent,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await signSessionCookie(session.id, token, expiresAt), {
    httpOnly: true,
    sameSite: "lax",
    // Bare-IP HTTP access needs this relaxed, hence the explicit opt-in.
    secure: env.isProduction && !env.allowInsecureCookies,
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const parsed = await readSessionCookie(raw);
  if (!parsed) return null;

  const session = await prisma.session.findUnique({
    where: { id: parsed.sid },
    include: { user: true },
  });

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt < new Date() ||
    !session.user.isActive
  ) {
    return null;
  }

  // Opaque token check prevents a leaked/forged JWT with a guessed session id.
  if (session.tokenHash !== hashToken(parsed.tok)) return null;

  const user = session.user;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    mustChangePassword: user.mustChangePassword,
    twoFactorEnabled: user.twoFactorEnabled,
  };
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;

  if (raw) {
    const parsed = await readSessionCookie(raw);
    if (parsed) {
      await prisma.session
        .update({
          where: { id: parsed.sid },
          data: { revokedAt: new Date() },
        })
        .catch(() => undefined);
    }
  }

  cookieStore.delete(SESSION_COOKIE);
}

/** Used when a password changes or an admin deactivates an account. */
export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// ---------------------------------------------------------------------------
// Authorization helpers
// ---------------------------------------------------------------------------

export function hasRole(user: SessionUser | null, minimum: Role): boolean {
  if (!user) return false;
  return ROLE_RANK[user.role] >= ROLE_RANK[minimum];
}

export function isSuperAdmin(user: SessionUser | null): boolean {
  return user?.role === "SUPERADMIN";
}

/** Throws when the caller lacks the role; callers convert this to a 403. */
export async function requireRole(minimum: Role): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("UNAUTHENTICATED");
  if (!hasRole(user, minimum)) throw new AuthError("FORBIDDEN");
  return user;
}

export class AuthError extends Error {
  constructor(public code: "UNAUTHENTICATED" | "FORBIDDEN") {
    super(code);
    this.name = "AuthError";
  }
}

// ---------------------------------------------------------------------------
// Brute force throttling
// ---------------------------------------------------------------------------

const MAX_ATTEMPTS = 8;
const WINDOW_MINUTES = 15;

export async function isLoginThrottled(
  email: string,
  ipAddress: string,
): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000);
  const failures = await prisma.loginAttempt.count({
    where: {
      success: false,
      createdAt: { gte: since },
      OR: [{ email: email.toLowerCase() }, { ipAddress }],
    },
  });
  return failures >= MAX_ATTEMPTS;
}

export async function recordLoginAttempt(
  email: string,
  ipAddress: string,
  success: boolean,
  reason?: string,
): Promise<void> {
  await prisma.loginAttempt.create({
    data: { email: email.toLowerCase(), ipAddress, success, reason },
  });
}

// ---------------------------------------------------------------------------
// Two-factor authentication (TOTP)
// ---------------------------------------------------------------------------

export function createTotpSecret(): string {
  return generateSecret({ length: 20 });
}

export function totpUri(secret: string, email: string): string {
  return generateURI({
    issuer: "WirelessCom.Ca",
    label: email,
    secret,
  });
}

export async function verifyTotpToken(
  encryptedSecret: string,
  token: string,
): Promise<boolean> {
  const secret = decryptSecret(encryptedSecret);
  if (!secret) return false;
  try {
    const result = await verifyTotp({
      secret,
      token: token.replace(/\s/g, ""),
      // Allows for one step of clock drift in either direction.
      epochTolerance: 30,
    });
    return result.valid;
  } catch {
    return false;
  }
}

export function storeTotpSecret(secret: string): string {
  return encryptSecret(secret);
}

/**
 * Issues a short-lived cookie proving the password step succeeded, so the TOTP
 * form cannot be used to bypass credentials.
 */
export async function beginTwoFactorChallenge(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 5 * 60_000);
  const jwt = await new SignJWT({ uid: userId, stage: "2fa" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("wirelesscom.ca")
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secretKey());

  const cookieStore = await cookies();
  cookieStore.set(TWO_FACTOR_COOKIE, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction && !env.allowInsecureCookies,
    path: "/",
    expires: expiresAt,
  });
}

export async function readTwoFactorChallenge(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(TWO_FACTOR_COOKIE)?.value;
  if (!raw) return null;
  try {
    const { payload } = await jwtVerify(raw, secretKey(), {
      issuer: "wirelesscom.ca",
    });
    if (payload.stage === "2fa" && typeof payload.uid === "string") {
      return payload.uid;
    }
    return null;
  } catch {
    return null;
  }
}

export async function clearTwoFactorChallenge(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TWO_FACTOR_COOKIE);
}

export function generateRecoveryCodes(count = 8): string[] {
  return Array.from({ length: count }, () =>
    randomToken(6).replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase(),
  );
}

export type { User };
