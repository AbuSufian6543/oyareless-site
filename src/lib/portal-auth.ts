import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { hashToken, randomToken } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

export const PORTAL_COOKIE = "wc_portal";
const SESSION_DAYS = 7;

export type PortalUser = {
  id: string;
  email: string;
  name: string;
  customerId: string;
  customerName: string;
  mustChangePassword: boolean;
  twoFactorEnabled: boolean;
};

function secretKey(): Uint8Array {
  return new TextEncoder().encode(env.authSecret);
}

async function signCookie(sessionId: string, token: string, expiresAt: Date) {
  return new SignJWT({ sid: sessionId, tok: token, kind: "portal" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("wirelesscom.ca")
    .setAudience("portal")
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secretKey());
}

export async function createPortalSession(customerUserId: string): Promise<void> {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  const session = await prisma.customerSession.create({
    data: {
      customerUserId,
      tokenHash: hashToken(token),
      expiresAt,
      ipAddress: forwarded?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown",
      userAgent: headerList.get("user-agent") ?? "unknown",
    },
  });
  const store = await cookies();
  store.set(PORTAL_COOKIE, await signCookie(session.id, token, expiresAt), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction && !env.allowInsecureCookies,
    path: "/",
    expires: expiresAt,
  });
}

export async function getPortalUser(): Promise<PortalUser | null> {
  const store = await cookies();
  const raw = store.get(PORTAL_COOKIE)?.value;
  if (!raw) return null;
  try {
    const { payload } = await jwtVerify(raw, secretKey(), {
      issuer: "wirelesscom.ca",
      audience: "portal",
    });
    if (payload.kind !== "portal" || typeof payload.sid !== "string" || typeof payload.tok !== "string") {
      return null;
    }
    const session = await prisma.customerSession.findUnique({
      where: { id: payload.sid },
      include: { customerUser: { include: { customer: true } } },
    });
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt < new Date() ||
      session.tokenHash !== hashToken(payload.tok) ||
      !session.customerUser.isActive ||
      !session.customerUser.customer.isActive
    ) {
      return null;
    }
    return {
      id: session.customerUser.id,
      email: session.customerUser.email,
      name: session.customerUser.name,
      customerId: session.customerUser.customerId,
      customerName: session.customerUser.customer.name,
      mustChangePassword: session.customerUser.mustChangePassword,
      twoFactorEnabled: session.customerUser.twoFactorEnabled,
    };
  } catch {
    return null;
  }
}

export class PortalAuthError extends Error {
  constructor(public code: "UNAUTHENTICATED" | "FORBIDDEN") {
    super(code);
    this.name = "PortalAuthError";
  }
}

export async function requirePortalUser(): Promise<PortalUser> {
  const user = await getPortalUser();
  if (!user) redirect("/portal/login");
  return user;
}

export async function destroyPortalSession(): Promise<void> {
  const store = await cookies();
  const raw = store.get(PORTAL_COOKIE)?.value;
  if (raw) {
    try {
      const { payload } = await jwtVerify(raw, secretKey(), {
        issuer: "wirelesscom.ca",
        audience: "portal",
      });
      if (typeof payload.sid === "string") {
        await prisma.customerSession
          .update({ where: { id: payload.sid }, data: { revokedAt: new Date() } })
          .catch(() => undefined);
      }
    } catch {
      // Cookie was already invalid.
    }
  }
  store.delete(PORTAL_COOKIE);
}

export function ownedBy<T extends { customerId: string | null }>(
  record: T | null,
  customerId: string,
): T {
  if (!record || record.customerId !== customerId) {
    throw new PortalAuthError("FORBIDDEN");
  }
  return record;
}
