import {
  CANONICAL_PUBLIC_ORIGIN,
  emailHtmlContainsForbiddenOrigin,
  isCanonicalPublicHost,
  isIpHostname,
  joinOriginAndPath,
  resolvePublicOrigin,
  sanitizeAppPath,
  sanitizeEmailHref,
  sanitizeEmailHtml,
} from "../src/lib/public-url";

let failed = 0;

function assert(label: string, ok: boolean) {
  if (ok) console.log(`  OK    ${label}`);
  else {
    failed += 1;
    console.log(`  FAIL  ${label}`);
  }
}

const production = (raw: string, path = "/") =>
  joinOriginAndPath(resolvePublicOrigin(raw, "production"), path);

assert(
  "production ignores a public IPv4 SITE_URL",
  resolvePublicOrigin("http://64.110.141.167", "production") === CANONICAL_PUBLIC_ORIGIN,
);
assert(
  "production ignores https on a public IP",
  resolvePublicOrigin("https://64.110.141.167", "production") === CANONICAL_PUBLIC_ORIGIN,
);
assert(
  "production upgrades http://wirelesscom.ca to https apex",
  resolvePublicOrigin("http://wirelesscom.ca", "production") === CANONICAL_PUBLIC_ORIGIN,
);
assert(
  "production canonicalizes www",
  resolvePublicOrigin("https://www.wirelesscom.ca", "production") === CANONICAL_PUBLIC_ORIGIN,
);
assert(
  "production ignores a spoofed host",
  resolvePublicOrigin("https://evil.example", "production") === CANONICAL_PUBLIC_ORIGIN,
);
assert(
  "development keeps localhost",
  resolvePublicOrigin("http://localhost:3000", "development") === "http://localhost:3000",
);
assert(
  "development does not keep a public IP",
  resolvePublicOrigin("http://64.110.141.167", "development") === CANONICAL_PUBLIC_ORIGIN,
);

assert("IPv4 hostnames are detected", isIpHostname("64.110.141.167"));
assert("IPv6 hostnames are detected", isIpHostname("2001:db8::1"));
assert("company host is not treated as an IP", !isIpHostname("wirelesscom.ca"));
assert("www is accepted as the company host", isCanonicalPublicHost("www.wirelesscom.ca"));
assert(
  "lookalike hosts are rejected",
  !isCanonicalPublicHost("wirelesscom.ca.evil.com") &&
    !isCanonicalPublicHost("notwirelesscom.ca") &&
    !isCanonicalPublicHost("evil.wirelesscom.ca"),
);

assert(
  "IP ticket links keep the path on https://wirelesscom.ca",
  production("http://64.110.141.167", "http://64.110.141.167/admin/tickets/abc") ===
    `${CANONICAL_PUBLIC_ORIGIN}/admin/tickets/abc`,
);
assert(
  "relative admin paths stay on https://wirelesscom.ca",
  production("http://64.110.141.167", "/admin/notifications") ===
    `${CANONICAL_PUBLIC_ORIGIN}/admin/notifications`,
);
assert(
  "protocol-relative URLs cannot escape the company origin",
  sanitizeAppPath("//evil.com/phish") === "/" &&
    production("https://wirelesscom.ca", "//evil.com/phish") === CANONICAL_PUBLIC_ORIGIN,
);
assert(
  "javascript URLs are dropped",
  sanitizeAppPath("javascript:alert(1)") === "/",
);
assert(
  "foreign https URLs are dropped",
  sanitizeAppPath("https://evil.example/login") === "/",
);
assert(
  "userinfo cannot disguise a foreign host",
  sanitizeAppPath("https://evil.com@wirelesscom.ca/login") === "/login",
);
assert(
  "CRLF cannot be injected into a path",
  sanitizeAppPath("/login\r\nLocation: https://evil.com") === "/",
);
assert(
  "password-reset tokens stay on https://wirelesscom.ca",
  production(
    "http://64.110.141.167",
    "/login/reset?token=abc%2Fdef",
  ) === `${CANONICAL_PUBLIC_ORIGIN}/login/reset?token=abc%2Fdef`,
);

const rewritten = sanitizeEmailHtml(
  `<a href="http://64.110.141.167/tech/tickets/1">Open</a>`,
);
assert(
  "email HTML rewrite strips the public IP from hrefs",
  !rewritten.includes("64.110.141.167") && rewritten.includes("href="),
);
assert(
  "rewritten email HTML has no forbidden origin",
  !emailHtmlContainsForbiddenOrigin(rewritten),
);
assert(
  "mailto links are kept",
  sanitizeEmailHref("mailto:service@wirelesscom.ca") === "mailto:service@wirelesscom.ca",
);
assert(
  "javascript mailto is rejected",
  !/javascript:alert/i.test(sanitizeEmailHref("mailto:javascript:alert(1)")),
);

process.exit(failed === 0 ? 0 : 1);
