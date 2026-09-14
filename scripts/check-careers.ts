import { readFileSync } from "node:fs";
import path from "node:path";

import { RESUME_MAX_BYTES, RESUME_MAX_MB } from "../src/lib/careers";

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

assert("résumé cap is 3 MB", RESUME_MAX_BYTES === 3 * 1024 * 1024 && RESUME_MAX_MB === 3);

const turnstile = read("src/lib/turnstile.ts");
assert(
  "human-check host allows the live site and localhost, and rejects lookalikes",
  turnstile.includes("isCanonicalPublicHost") &&
    turnstile.includes("isLoopbackHost") &&
    turnstile.includes("isTrustedPublicHost") &&
    turnstile.includes("isAllowedHumanCheckHost"),
);

const careersPage = read("src/app/(site)/careers/page.tsx");
const jobPage = read("src/app/(site)/careers/[slug]/page.tsx");
assert(
  "careers pages do not point applicants at service@wirelesscom.ca",
  !careersPage.includes("Questions about working here") &&
    !careersPage.includes("service@wirelesscom.ca") &&
    !jobPage.includes("Questions about working here") &&
    !jobPage.includes("service@wirelesscom.ca") &&
    !jobPage.includes("mailto:"),
);
assert(
  "empty jobs CTA goes to the résumé form, not /contact",
  careersPage.includes('href="#apply"') && !careersPage.includes('href="/contact"'),
);
assert(
  "public apply forms require Turnstile",
  careersPage.includes("CareerApplyForm") &&
    jobPage.includes("CareerApplyForm") &&
    careersPage.includes("turnstileSiteKey") &&
    jobPage.includes("turnstileSiteKey"),
);

const applyForm = read("src/components/careers/career-apply-form.tsx");
assert(
  "the public form refuses uploads until the human check is configured",
  applyForm.includes("Applications are not open") &&
    applyForm.includes("turnstileSiteKey") &&
    applyForm.includes("cf-turnstile-response"),
);
assert(
  "the public form enforces a PDF and the 3 MB cap in the browser",
  applyForm.includes("RESUME_MAX_BYTES") && applyForm.includes("application/pdf"),
);

const applyApi = read("src/app/api/careers/apply/route.ts");
assert(
  "the apply API verifies Turnstile before storing a file",
  applyApi.includes("await verifyTurnstileToken") &&
    applyApi.indexOf("await verifyTurnstileToken") <
      applyApi.indexOf("storePrivateResume(") &&
    applyApi.includes("prepareResumePdf") &&
    applyApi.includes("hasCareerNotifyList"),
);
assert(
  "career notification mail uses the career list, not the office inbox default",
  applyApi.includes("careerNotifyEmails") &&
    !applyApi.includes("notifyEmails.join"),
);

const mailSettings = read("src/lib/mail-settings.ts");
assert(
  "career inboxes never fall back to service@wirelesscom.ca",
  mailSettings.includes("careerNotifyEmails: careerFromStore") &&
    mailSettings.includes("hasCareerNotifyList: careerFromStore.length > 0") &&
    !mailSettings.includes("careerNotifyEmails:\n      quoteFromStore") &&
    !/careerNotifyEmails:\s*officeEmails/.test(mailSettings),
);

const pdf = read("src/lib/resume-pdf.ts");
assert(
  "résumés are stored privately and scanned for active PDF content",
  pdf.includes("private/resumes") &&
    pdf.includes("%PDF-") &&
    pdf.includes("/JavaScript") &&
    pdf.includes("/Launch") &&
    pdf.includes('storagePath.includes("..")') &&
    pdf.includes("RESUME_MAX_BYTES"),
);

assert(
  "Turnstile fails closed when keys are missing",
  turnstile.includes("challenges.cloudflare.com/turnstile/v0/siteverify") &&
    turnstile.includes("isConfigured") &&
    applyApi.includes("Applications are not accepting uploads"),
);

const proxy = read("src/proxy.ts");
assert(
  "the public site cannot fetch /uploads/private/",
  proxy.includes('pathname.startsWith("/uploads/private/")') &&
    proxy.includes("status: 404"),
);

const resumeRoute = read("src/app/api/admin/applications/[id]/resume/route.ts");
assert(
  "résumé files are only served to editors, never as a public URL",
  resumeRoute.includes('requireRole("EDITOR")') &&
    resumeRoute.includes("Content-Disposition") &&
    resumeRoute.includes("private, no-store"),
);

const adminDetail = read("src/app/admin/applications/[id]/page.tsx");
assert(
  "editors can view the PDF on the site and download a copy",
  adminDetail.includes("<iframe") &&
    adminDetail.includes("/resume?download=1"),
);

const portalTicket = read("src/app/portal/tickets/[id]/page.tsx");
assert(
  "the customer portal does not host the career apply form",
  !portalTicket.includes("CareerApplyForm") &&
    !portalTicket.includes("/api/careers/apply"),
);

const settingsPage = read("src/app/admin/settings/page.tsx");
assert(
  "admins pick career notification emails separately from the office inbox",
  settingsPage.includes('name="careerNotifyEmails"') &&
    settingsPage.includes("does not fall back to the office inbox") &&
    settingsPage.includes("turnstileSiteKey"),
);

process.exit(failed === 0 ? 0 : 1);
