import "server-only";

import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { env } from "@/lib/env";
import { prisma, withTimeout } from "@/lib/prisma";
import {
  isCanonicalPublicHost,
  isLoopbackHost,
  isTrustedPublicHost,
} from "@/lib/public-url";

const DUMMY_ALWAYS_PASS_SITE_KEY = "1x0000000000000000000000000000000AA";

/** Hostnames Cloudflare may report for a legitimate careers form. */
export function isAllowedHumanCheckHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (!host) return false;
  return (
    isCanonicalPublicHost(host) ||
    isTrustedPublicHost(host) ||
    isLoopbackHost(host)
  );
}

const SITE_KEY = "turnstileSiteKey";
const SECRET_KEY = "turnstileSecretKey";

export type TurnstileSettings = {
  siteKey: string;
  secretKey: string;
};

export type ResolvedTurnstile = {
  siteKey: string;
  secretKey: string;
  isConfigured: boolean;
};

export async function getTurnstileSettings(): Promise<TurnstileSettings> {
  const merged: TurnstileSettings = { siteKey: "", secretKey: "" };

  try {
    const rows = await withTimeout(
      prisma.siteSetting.findMany({
        where: { key: { in: [SITE_KEY, SECRET_KEY] } },
      }),
    );
    for (const row of rows) {
      const value = typeof row.value === "string" ? row.value : "";
      if (row.key === SITE_KEY) merged.siteKey = value;
      if (row.key === SECRET_KEY) {
        merged.secretKey = value ? decryptSecret(value) ?? "" : "";
      }
    }
  } catch {
    // Fall through to environment variables.
  }

  return merged;
}

export async function getResolvedTurnstile(): Promise<ResolvedTurnstile> {
  const stored = await getTurnstileSettings();
  const siteKey = stored.siteKey.trim() || env.turnstile.siteKey;
  const secretKey = stored.secretKey || env.turnstile.secretKey;
  return {
    siteKey,
    secretKey,
    isConfigured: Boolean(siteKey && secretKey),
  };
}

export async function updateTurnstileSettings(values: {
  siteKey?: string;
  secretKey?: string;
}): Promise<void> {
  if (values.siteKey !== undefined) {
    await prisma.siteSetting.upsert({
      where: { key: SITE_KEY },
      create: { key: SITE_KEY, value: values.siteKey.trim(), group: "security" },
      update: { value: values.siteKey.trim(), group: "security" },
    });
  }
  if (values.secretKey !== undefined) {
    const secret = values.secretKey.trim();
    const stored = secret ? encryptSecret(secret) : "";
    await prisma.siteSetting.upsert({
      where: { key: SECRET_KEY },
      create: { key: SECRET_KEY, value: stored, group: "security" },
      update: { value: stored, group: "security" },
    });
  }
}

/**
 * Verify a Cloudflare Turnstile token. Fails closed when keys are missing or
 * Cloudflare says the visitor is not a human.
 */
export async function verifyTurnstileToken(
  token: string,
  ip: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const config = await getResolvedTurnstile();
  if (!config.isConfigured) {
    return {
      ok: false,
      message:
        "Applications are not accepting uploads right now. Please try again later.",
    };
  }

  const trimmed = token.trim();
  if (!trimmed) {
    return {
      ok: false,
      message: "Please complete the human check before sending your résumé.",
    };
  }

  try {
    const body = new URLSearchParams({
      secret: config.secretKey,
      response: trimmed,
    });
    if (ip && ip !== "unknown") body.set("remoteip", ip);

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(8_000),
      },
    );
    const data = (await response.json().catch(() => null)) as {
      success?: boolean;
      hostname?: string;
    } | null;
    if (!data?.success) {
      return {
        ok: false,
        message: "The human check did not pass. Please try again.",
      };
    }
    if (
      config.siteKey !== DUMMY_ALWAYS_PASS_SITE_KEY &&
      data.hostname &&
      !isAllowedHumanCheckHost(data.hostname)
    ) {
      return {
        ok: false,
        message: "The human check did not pass. Please try again.",
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "We could not complete the human check. Please try again.",
    };
  }
}
