/**
 * End-to-end smoke test against a running server.
 *
 *   node scripts/smoke-admin.mjs http://127.0.0.1:3000 abu@wirelesscom.ca 'password'
 *
 * Signs in through the real login form (the no-JavaScript server action path),
 * then requests every admin route and asserts it renders. Useful after a
 * deployment to confirm the database, session cookies and role checks all work.
 */

const base = (process.argv[2] ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const email = process.argv[3] ?? "abu@wirelesscom.ca";
const password = process.argv[4] ?? process.env.SUPERADMIN_PASSWORD;

if (!password) {
  console.error("Usage: node scripts/smoke-admin.mjs <baseUrl> <email> <password>");
  process.exit(1);
}

let failures = 0;
const cookies = new Map();

function storeCookies(response) {
  for (const raw of response.headers.getSetCookie?.() ?? []) {
    const [pair] = raw.split(";");
    const index = pair.indexOf("=");
    if (index > 0) cookies.set(pair.slice(0, index).trim(), pair.slice(index + 1));
  }
}

function cookieHeader() {
  return [...cookies].map(([key, value]) => `${key}=${value}`).join("; ");
}

async function request(path, init = {}) {
  const response = await fetch(`${base}${path}`, {
    redirect: "manual",
    ...init,
    headers: { cookie: cookieHeader(), ...(init.headers ?? {}) },
  });
  storeCookies(response);
  return response;
}

function report(label, ok, detail = "") {
  if (ok) {
    console.log(`  OK    ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

/** Pulls the hidden server-action fields Next renders for progressive enhancement. */
function actionFields(html) {
  const fields = new Map();
  const pattern = /<input type="hidden" name="(\$[^"]+)"(?: value="([^"]*)")?/g;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    fields.set(decode(match[1]), decode(match[2] ?? ""));
  }
  return fields;
}

function decode(value) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&#39;", "'");
}

console.log(`\nSmoke testing ${base}\n`);

// --- Public routes ---------------------------------------------------------
console.log("Public site");
for (const path of [
  "/",
  "/it-services",
  "/cybersecurity",
  "/security-services",
  "/support",
  "/contact",
  "/news",
  "/careers",
  "/live",
  "/privacy-policy",
  "/e-911",
  "/speed-test",
  "/network-tools",
  "/cybersecurity-tools",
  "/brands",
  "/faq",
  "/knowledge-base",
  "/case-studies",
  "/network-status",
  "/system-status",
  "/remote-support",
  "/request-quote",
  "/search",
  "/sitemap.xml",
  "/robots.txt",
  "/api/health",
]) {
  const response = await request(path);
  report(`${path} → ${response.status}`, response.status === 200);
}

// --- Legacy redirects ------------------------------------------------------
console.log("\nLegacy URLs");
for (const [path, expected] of [
  ["/index.html", "/"],
  ["/2-way-radios.html", "/two-way-radios"],
  ["/join-our-team", "/careers"],
]) {
  const response = await request(path);
  const location = response.headers.get("location") ?? "";
  report(
    `${path} → ${response.status} ${location}`,
    response.status >= 300 && response.status < 400 && location.endsWith(expected),
  );
}

// --- Login -----------------------------------------------------------------
console.log("\nAuthentication");
const loginPage = await request("/login");
const html = await loginPage.text();
const hidden = actionFields(html);

if (hidden.size === 0) {
  report("found the login server action", false, "no hidden action fields in the page");
} else {
  const form = new FormData();
  for (const [key, value] of hidden) form.set(key, value);
  form.set("email", email);
  form.set("password", password);

  const submit = await request("/login", { method: "POST", body: form });
  const body = await submit.text();

  const signedIn = cookies.has("wc_session");
  const wrongPassword = /incorrect|invalid|not recogni[sz]/i.test(body);
  report(
    `sign in as ${email}`,
    signedIn,
    wrongPassword ? "credentials rejected" : `no session cookie (status ${submit.status})`,
  );
}

// --- Admin routes ----------------------------------------------------------
console.log("\nAdmin panel");
for (const path of [
  "/admin",
  "/admin/pages",
  "/admin/pages/new",
  "/admin/posts",
  "/admin/media",
  "/admin/streams",
  "/admin/streams/new",
  "/admin/jobs",
  "/admin/submissions",
  "/admin/subscribers",
  "/admin/testimonials",
  "/admin/navigation",
  "/admin/redirects",
  "/admin/settings",
  "/admin/branding",
  "/admin/remote-support",
  "/admin/tickets",
  "/admin/quotes",
  "/admin/portal-users",
  "/admin/collections/brands",
  "/admin/collections/faq",
  "/admin/users",
  "/admin/account",
  "/admin/audit",
]) {
  const response = await request(path);
  report(`${path} → ${response.status}`, response.status === 200);
}

// --- Admin detail routes ---------------------------------------------------
// Ids are scraped from the list pages so this works against any database.
console.log("\nAdmin detail routes");
for (const [listPath, prefix] of [
  ["/admin/pages", "/admin/pages"],
  ["/admin/posts", "/admin/posts"],
  ["/admin/streams", "/admin/streams"],
  ["/admin/jobs", "/admin/jobs"],
  ["/admin/submissions", "/admin/submissions"],
]) {
  const body = await (await request(listPath)).text();
  const pattern = new RegExp(`${prefix}/([a-z0-9]{20,})`, "g");
  const ids = [...new Set([...body.matchAll(pattern)].map((m) => m[1]))];

  if (ids.length === 0) {
    console.log(`  skip  ${prefix}/<id> (nothing to open yet)`);
    continue;
  }

  const response = await request(`${prefix}/${ids[0]}`);
  report(`${prefix}/<id> → ${response.status}`, response.status === 200);
}

// --- Admin APIs -----------------------------------------------------------
console.log("\nAdmin APIs");
for (const path of [
  "/api/admin/media",
  "/api/admin/submissions/export",
  "/api/admin/subscribers/export",
]) {
  const response = await request(path);
  report(`${path} → ${response.status}`, response.status === 200);
}

// --- Public forms ---------------------------------------------------------
console.log("\nPublic forms");
const contact = await request("/api/forms", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    type: "CONTACT",
    name: "Smoke Test",
    email: "smoke@example.com",
    subject: "Automated check",
    message: "Automated smoke test of the contact form. Safe to delete.",
    sourcePage: "/contact",
  }),
});
report(`POST /api/forms → ${contact.status}`, contact.status === 200);

const ping = await request("/api/speedtest/ping");
report(`GET /api/speedtest/ping → ${ping.status}`, ping.status === 204);

console.log(
  failures === 0
    ? "\nAll checks passed.\n"
    : `\n${failures} check(s) failed.\n`,
);

process.exit(failures === 0 ? 0 : 1);
