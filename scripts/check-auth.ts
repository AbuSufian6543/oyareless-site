import { readFileSync } from "node:fs";
import path from "node:path";

let failed = 0;

function assert(label: string, ok: boolean) {
  if (ok) console.log(`  OK    ${label}`);
  else {
    failed += 1;
    console.log(`  FAIL  ${label}`);
  }
}

function read(relative: string) {
  return readFileSync(path.join(process.cwd(), relative), "utf8");
}

function callsBefore(source: string, first: string, second: string) {
  const a = source.indexOf(first);
  const b = source.indexOf(second);
  return a >= 0 && b >= 0 && a < b;
}

const constants = read("src/lib/turnstile-constants.ts");
assert(
  "Turnstile actions cover every sign-in surface",
  constants.includes("staff-login") &&
    constants.includes("staff-2fa") &&
    constants.includes("staff-reset-request") &&
    constants.includes("staff-reset-complete") &&
    constants.includes("portal-login") &&
    constants.includes("portal-invite") &&
    constants.includes("careers-apply") &&
    constants.includes("cf-turnstile-response"),
);

const turnstile = read("src/lib/turnstile.ts");
assert(
  "login can boot without keys, but partial keys fail closed",
  turnstile.includes("verifyAuthHumanCheck") &&
    turnstile.includes("required: false") &&
    turnstile.includes("isMisconfigured") &&
    turnstile.includes("clientTurnstileSiteKey"),
);
assert(
  "siteverify checks hostname and widget action",
  turnstile.includes("expectedAction") &&
    turnstile.includes("isAllowedHumanCheckHost") &&
    turnstile.includes("challenges.cloudflare.com/turnstile/v0/siteverify"),
);

const humanField = read("src/components/security/human-check-field.tsx");
assert(
  "auth forms submit the Turnstile token as a hidden field",
  humanField.includes("TURNSTILE_FORM_FIELD") &&
    humanField.includes('type="hidden"') &&
    humanField.includes("resetSignal"),
);

const loginActions = read("src/app/login/actions.ts");
assert(
  "staff login verifies Turnstile before checking the password",
  loginActions.includes("TURNSTILE_ACTIONS.staffLogin") &&
    callsBefore(loginActions, "verifyAuthHumanCheck", "await verifyPassword") &&
    callsBefore(loginActions, "verifyAuthHumanCheck", "await isLoginThrottled"),
);
assert(
  "staff 2FA verifies Turnstile before checking the authenticator code",
  loginActions.includes("TURNSTILE_ACTIONS.staffTwoFactor") &&
    loginActions.includes("verifyTwoFactorAction") &&
    callsBefore(
      loginActions.slice(loginActions.indexOf("verifyTwoFactorAction")),
      "verifyAuthHumanCheck",
      "await verifyTotpToken",
    ),
);

const resetActions = read("src/app/login/reset-actions.ts");
assert(
  "password reset request and completion verify Turnstile first",
  resetActions.includes("TURNSTILE_ACTIONS.staffResetRequest") &&
    resetActions.includes("TURNSTILE_ACTIONS.staffResetComplete") &&
    callsBefore(resetActions, "verifyAuthHumanCheck", "rateLimit(`pwreset-ip:") &&
    callsBefore(
      resetActions.slice(resetActions.indexOf("completePasswordResetAction")),
      "verifyAuthHumanCheck",
      "hashPassword",
    ),
);

const portalActions = read("src/app/portal/actions.ts");
assert(
  "portal login uses the real client IP and verifies Turnstile",
  portalActions.includes("requestClientIp") &&
    !portalActions.includes('ip = "portal"') &&
    portalActions.includes("TURNSTILE_ACTIONS.portalLogin") &&
    callsBefore(portalActions, "verifyAuthHumanCheck", "await verifyPassword"),
);
assert(
  "portal invite accept verifies Turnstile before creating a session",
  portalActions.includes("TURNSTILE_ACTIONS.portalInvite") &&
    callsBefore(
      portalActions.slice(portalActions.indexOf("acceptInviteAction")),
      "verifyAuthHumanCheck",
      "await createPortalSession",
    ),
);

const loginForm = read("src/app/login/login-form.tsx");
assert(
  "staff login and 2FA forms render the human check",
  loginForm.includes("HumanCheckField") &&
    loginForm.includes("TURNSTILE_ACTIONS.staffLogin") &&
    loginForm.includes("TURNSTILE_ACTIONS.staffTwoFactor") &&
    loginForm.includes("turnstileSiteKey"),
);

assert(
  "forgot, reset, portal login, and invite forms render the human check",
  read("src/app/login/forgot/forgot-form.tsx").includes("HumanCheckField") &&
    read("src/app/login/reset/reset-form.tsx").includes("HumanCheckField") &&
    read("src/app/portal/login-form.tsx").includes("HumanCheckField") &&
    read("src/app/portal/accept-form.tsx").includes("HumanCheckField"),
);

assert(
  "login pages pass a site key only from resolved Turnstile",
  read("src/app/login/page.tsx").includes("clientTurnstileSiteKey") &&
    read("src/app/login/forgot/page.tsx").includes("clientTurnstileSiteKey") &&
    read("src/app/login/reset/page.tsx").includes("clientTurnstileSiteKey") &&
    read("src/app/portal/login/page.tsx").includes("clientTurnstileSiteKey") &&
    read("src/app/portal/accept/page.tsx").includes("clientTurnstileSiteKey"),
);

const applyApi = read("src/app/api/careers/apply/route.ts");
assert(
  "career applications still fail closed and bind the careers action",
  applyApi.includes("TURNSTILE_ACTIONS.careersApply") &&
    applyApi.includes("Applications are not accepting uploads") &&
    applyApi.includes("await verifyTurnstileToken"),
);

process.exit(failed === 0 ? 0 : 1);
