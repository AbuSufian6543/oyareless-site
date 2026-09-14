import "server-only";

import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { env } from "@/lib/env";
import { prisma, withTimeout } from "@/lib/prisma";
import {
  isCanonicalPublicHost,
  isLoopbackHost,
  isTrustedPublicHost,
} from "@/lib/public-url";
import {
  TURNSTILE_FORM_FIELD,
  type TurnstileAction,
} from "@/lib/turnstile-constants";

const DUMMY_ALWAYS_PASS_SITE_KEY = "1x0000000000000000000000000000000AA";
const DUMMY_ALWAYS_PASS_SECRET_KEY = "1x0000000000000000000000000000000AA";

const DEFAULT_UNAVAILABLE =
  "Human verification is not available right now. Please try again later.";
const DEFAULT_MISSING = "Please complete the human check.";
const DEFAULT_FAILED = "The human check did not pass. Please try again.";
const DEFAULT_NETWORK =
  "We could not complete the human check. Please try again.";

/** Hostnames Cloudflare may report for a legitimate Turnstile widget. */
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
  /** One key is present without the other — never skip verification. */
  isMisconfigured: boolean;
};

export type TurnstileVerifyOptions = {
  /**
   * Fail when keys are missing. Default true (careers). Login uses false so
   * staff can still sign in long enough to paste keys.
   */
  required?: boolean;
  expectedAction?: TurnstileAction | string;
  unavailableMessage?: string;
  missingTokenMessage?: string;
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
  const isConfigured = Boolean(siteKey && secretKey);
  return {
    siteKey,
    secretKey,
    isConfigured,
    isMisconfigured: Boolean(siteKey || secretKey) && !isConfigured,
  };
}

/** Site key to render in the browser. Empty when verification cannot run. */
export function clientTurnstileSiteKey(config: ResolvedTurnstile): string {
  return config.isConfigured ? config.siteKey : "";
}

export function readTurnstileToken(formData: FormData): string {
  return String(
    formData.get(TURNSTILE_FORM_FIELD) ??
      formData.get("cfTurnstileResponse") ??
      "",
  );
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
 * Verify a Cloudflare Turnstile token. Fails closed when keys are missing
 * (unless `required` is false and nothing is configured), when Cloudflare
 * rejects the visitor, or when the widget action/hostname do not match.
 */
export async function verifyTurnstileToken(
  token: string,
  ip: string,
  options: TurnstileVerifyOptions = {},
): Promise<{ ok: true } | { ok: false; message: string }> {
  const required = options.required !== false;
  const unavailable = options.unavailableMessage ?? DEFAULT_UNAVAILABLE;
  const missing = options.missingTokenMessage ?? DEFAULT_MISSING;

  const config = await getResolvedTurnstile();
  const hasSite = Boolean(config.siteKey);
  const hasSecret = Boolean(config.secretKey);

  if (!hasSite && !hasSecret) {
    if (!required) return { ok: true };
    return { ok: false, message: unavailable };
  }

  if (!config.isConfigured) {
    return { ok: false, message: unavailable };
  }

  const trimmed = token.trim();
  if (!trimmed) {
    return { ok: false, message: missing };
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
      action?: string;
    } | null;
    if (!data?.success) {
      return { ok: false, message: DEFAULT_FAILED };
    }

    const dummy =
      config.siteKey === DUMMY_ALWAYS_PASS_SITE_KEY ||
      config.secretKey === DUMMY_ALWAYS_PASS_SECRET_KEY;
    if (!dummy && data.hostname && !isAllowedHumanCheckHost(data.hostname)) {
      return { ok: false, message: DEFAULT_FAILED };
    }
    if (
      !dummy &&
      options.expectedAction &&
      data.action !== options.expectedAction
    ) {
      return { ok: false, message: DEFAULT_FAILED };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: DEFAULT_NETWORK };
  }
}

/**
 * Login, password reset, and portal invite: require a valid token once
 * Turnstile is configured, and still allow sign-in when no keys exist yet.
 */
export async function verifyAuthHumanCheck(
  formData: FormData,
  ip: string,
  expectedAction: TurnstileAction,
): Promise<{ ok: true } | { ok: false; message: string }> {
  return verifyTurnstileToken(readTurnstileToken(formData), ip, {
    required: false,
    expectedAction,
    missingTokenMessage: "Please complete the human check before continuing.",
  });
}
