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

const envExample = read(".env.example");
assert(
  "tracked env example does not ship a superadmin password",
  /^SUPERADMIN_PASSWORD=\s*$/m.test(envExample),
);

const deploy = read("deploy.sh");
assert(
  "deploy.sh does not default to a committed superadmin password",
  /SUPERADMIN_PASSWORD=""/m.test(deploy) &&
    !/info "Password\s+\$\{SUPERADMIN_PASSWORD/.test(deploy),
);

const accountActions = read("src/app/admin/account/actions.ts");
assert(
  "2FA setup does not put the TOTP secret in the URL",
  !accountActions.includes("?setup=") &&
    !accountActions.includes("encodeURIComponent(secret)"),
);
assert(
  "2FA recovery codes are not placed in the URL",
  !accountActions.includes("?codes=") &&
    accountActions.includes("stashTwoFactorRecoveryCodes"),
);

const accountPage = read("src/app/admin/account/page.tsx");
assert(
  "the account page does not read 2FA secrets from query strings",
  !accountPage.includes("params.setup") &&
    !accountPage.includes("params.codes") &&
    accountPage.includes("readTwoFactorRecoveryCodes") &&
    accountPage.includes("readTotpSecret"),
);

const subscribe = read("src/app/api/subscribe/route.ts");
assert(
  "newsletter subscribe uses one success wording",
  subscribe.includes("acceptedMessage") &&
    !subscribe.includes("already subscribed") &&
    subscribe.includes("If that address can be added"),
);

const health = read("src/app/api/health/route.ts");
assert(
  "public health JSON does not name the database",
  health.includes('{ status: "ok" }') &&
    !health.includes("database,") &&
    !health.includes("unreachable"),
);

const statusPage = read("src/app/(site)/system-status/page.tsx");
assert(
  "public system status does not name Postgres",
  !statusPage.toLowerCase().includes("postgres") &&
    !statusPage.includes("prisma"),
);

const nginx = read("docker/nginx/wirelesscom.conf.template");
assert("nginx hides its version token", nginx.includes("server_tokens off;"));

const tools = read("src/app/api/tools/route.ts");
assert(
  "network-tools public IP endpoint filters private addresses",
  tools.includes("publicClientIp(ip)"),
);

const publicUrlCheck = read("scripts/check-public-url.ts");
assert(
  "public-URL fixtures use documentation addresses, not a live host",
  publicUrlCheck.includes("203.0.113.1") &&
    !publicUrlCheck.includes("64.110.141.167"),
);

process.exit(failed === 0 ? 0 : 1);
