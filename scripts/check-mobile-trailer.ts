import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { DEFAULT_NAV } from "../src/lib/nav-defaults";
import {
  DEFAULT_MOBILE_TRAILER_FLYER_URL,
  MOBILE_TRAILER_IMAGES,
  MOBILE_TRAILER_PATH,
  resolveTrailerFlyerUrl,
  trailerFlyerDownloadName,
  trailerFlyerIsPdf,
} from "../src/lib/mobile-security-trailer";
import { DEFAULT_SETTINGS } from "../src/lib/settings-defaults";
import { SEED_PAGES } from "../prisma/seed-content";

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

assert(
  "the public trailer path is /mobile-security-trailer",
  MOBILE_TRAILER_PATH === "/mobile-security-trailer",
);
assert(
  "the default flyer is the committed letter under public/docs",
  DEFAULT_MOBILE_TRAILER_FLYER_URL === "/docs/mobile-security-trailer-flyer.jpg" &&
    DEFAULT_SETTINGS.mobileTrailerFlyerUrl === DEFAULT_MOBILE_TRAILER_FLYER_URL,
);
assert(
  "an empty admin flyer field falls back to the shipped letter",
  resolveTrailerFlyerUrl("  ") === DEFAULT_MOBILE_TRAILER_FLYER_URL,
);
assert(
  "a PDF flyer keeps a .pdf download name",
  trailerFlyerIsPdf("/uploads/trailer.pdf") &&
    trailerFlyerDownloadName("/uploads/trailer.pdf").endsWith(".pdf"),
);

for (const [key, file] of Object.entries(MOBILE_TRAILER_IMAGES)) {
  assert(
    `${key} photo is committed`,
    existsSync(path.join(process.cwd(), "public", file.replace(/^\//, ""))),
  );
}
assert(
  "the flyer JPEG is committed",
  existsSync(path.join(process.cwd(), "public/docs/mobile-security-trailer-flyer.jpg")),
);

assert(
  "header and footer menus include the trailer",
  DEFAULT_NAV.some(
    (item) =>
      item.location === "HEADER" &&
      item.children?.some((child) => child.href === MOBILE_TRAILER_PATH),
  ) &&
    DEFAULT_NAV.some(
      (item) =>
        item.location === "FOOTER" &&
        item.children?.some((child) => child.href === MOBILE_TRAILER_PATH),
    ),
);

const branding = read("src/app/admin/branding/page.tsx");
assert(
  "admins can replace the flyer from Branding",
  branding.includes('name="mobileTrailerFlyerUrl"') && branding.includes("allowDocument"),
);

const sync = read("scripts/content-sync.ts");
assert(
  "edited Security Systems pages still receive the trailer cards on deploy",
  sync.includes("upgradeSecurityServicesTrailer"),
);

const quote = read("src/components/site/quote-form.tsx");
assert(
  "quote requests can name the trailer",
  quote.includes('"Mobile security trailer"') && quote.includes("preselected"),
);

assert(
  "the trailer is a CMS page admins can edit under Pages",
  SEED_PAGES.some((page) => page.slug === "mobile-security-trailer") &&
    JSON.stringify(
      SEED_PAGES.find((page) => page.slug === "mobile-security-trailer"),
    ).includes("mobileTrailer"),
);

process.exit(failed === 0 ? 0 : 1);
