/** Hidden field Cloudflare and our server actions both read. */
export const TURNSTILE_FORM_FIELD = "cf-turnstile-response";

/**
 * Widget `action` values returned by siteverify. Kept short so they fit
 * Cloudflare's 32-character limit.
 */
export const TURNSTILE_ACTIONS = {
  staffLogin: "staff-login",
  staffTwoFactor: "staff-2fa",
  staffResetRequest: "staff-reset-request",
  staffResetComplete: "staff-reset-complete",
  portalLogin: "portal-login",
  portalInvite: "portal-invite",
  careersApply: "careers-apply",
} as const;

export type TurnstileAction =
  (typeof TURNSTILE_ACTIONS)[keyof typeof TURNSTILE_ACTIONS];
