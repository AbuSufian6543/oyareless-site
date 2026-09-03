/**
 * Pushes updated seed content onto an existing database.
 *
 * The seed itself is create-only: `seedPages()` skips any slug that already
 * exists, which is correct for a first boot but means later content
 * improvements never reach a live site. This command closes that gap without
 * ever trampling an admin's work:
 *
 *   - a PageRevision snapshot is written before a page is touched, so any
 *     change is reversible from the admin UI;
 *   - pages an admin has edited since seeding keep their copy unless named
 *     with --force; empty photos and logos are still filled, shipped vendor
 *     logo files under /brand/logos/ are refreshed in place, missing service
 *     cards and brand tiles are still appended, a missing home stats strip
 *     or defense-in-depth section is still inserted, a missing core-capabilities
 *     section is still inserted, the home tech hero is upgraded when it
 *     still has a previous seed headline, banner CTAs on a light background
 *     are restored to a readable dark band, a Hytera catalog callout is
 *     added on Home and Two-way Radios when missing, and blank search titles
 *     or descriptions are filled from seed;


 *   - nothing is ever deleted, and redirects/navigation are only ever added to.
 *
 * Usage:
 *   npm run content:sync                    # dry run, shows what would change
 *   npm run content:sync -- --apply         # apply to unedited pages
 *   npm run content:sync -- --apply --force home,cybersecurity
 *   npm run content:sync -- --apply --force all
 */
import {
  buildBlocks,
  HYTERA_CATALOG_HEADING,
  HYTERA_CATALOG_URL,
  SEED_NAV,
  SEED_PAGES,
  SEED_REDIRECTS,
} from "../prisma/seed-content";
import { newBlockId } from "../src/lib/blocks";
import { prisma } from "../src/lib/prisma";

type Verdict = "create" | "update" | "skip-edited" | "identical";

type Row = {
  slug: string;
  verdict: Verdict;
  detail: string;
};

type JsonBlock = {
  id?: string;
  type: string;
  settings?: Record<string, unknown>;
  data?: Record<string, unknown>;
};

function parseArgs(argv: string[]) {
  const apply = argv.includes("--apply");

  const forceIndex = argv.indexOf("--force");
  const forceRaw = forceIndex >= 0 ? (argv[forceIndex + 1] ?? "") : "";
  const forceAll = forceRaw === "all";
  const forced = new Set(
    forceRaw && !forceAll
      ? forceRaw
          .split(",")
          .map((slug) => slug.trim().replace(/^\//, ""))
          .filter(Boolean)
      : [],
  );

  return { apply, forceAll, forced };
}

/**
 * A page is considered admin-edited once its updatedAt has moved past its
 * createdAt. Prisma sets both in the same statement on create, so a small
 * tolerance avoids false positives from clock/rounding differences.
 */
function wasEditedByAdmin(createdAt: Date, updatedAt: Date): boolean {
  return updatedAt.getTime() - createdAt.getTime() > 2000;
}

function normalizeTitle(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function canonicalServiceName(value: unknown): string {
  return normalizeTitle(value)
    .replace(/\b(live|vehicle|optic)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sameServiceCard(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
): boolean {
  const hrefLeft = String(left.href ?? "").replace(/\/$/, "");
  const hrefRight = String(right.href ?? "").replace(/\/$/, "");
  if (hrefLeft && hrefRight && hrefLeft === hrefRight) return true;
  const titleLeft = canonicalServiceName(left.title);
  const titleRight = canonicalServiceName(right.title);
  return Boolean(titleLeft && titleRight && titleLeft === titleRight);
}

function canonicalBrandName(value: unknown): string {
  const name = normalizeTitle(value);
  if (name === "unifi" || name === "ubiquiti" || name === "ubiquiti networks") {
    return "unifi";
  }
  if (name === "azure" || name === "microsoft azure") return "azure";
  if (name === "aws" || name === "amazon web services" || name === "amazon") return "aws";
  if (name === "google cloud" || name === "google cloud platform" || name === "gcp") {
    return "google cloud";
  }
  if (name === "microsoft 365" || name === "office 365" || name === "office365") {
    return "microsoft 365";
  }
  if (name === "cloudflare") return "cloudflare";
  if (name === "tait" || name === "tait communications") return "tait";
  if (name === "rogers") return "rogers";
  if (name === "genetec") return "genetec";
  if (name === "mikrotik" || name === "mikro tik") return "mikrotik";
  if (name === "grandstream" || name === "grandstrea") return "grandstream";
  if (name === "fortinet" || name === "fotinet") return "fortinet";
  return name;
}

function sameBrand(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
): boolean {
  const leftName = canonicalBrandName(left.name);
  const rightName = canonicalBrandName(right.name);
  return Boolean(leftName && rightName && leftName === rightName);
}

function insertMissingSeedBlock(
  next: JsonBlock[],
  seed: ReturnType<typeof buildBlocks>,
  type: string,
  afterTypes: string[],
  notes: string[],
  note: string,
): void {
  const seedBlock = seed.find((block) => block.type === type);
  if (!seedBlock || next.some((block) => block.type === type)) return;

  let insertAt = -1;
  for (const after of afterTypes) {
    const index = next.findIndex((block) => block.type === after);
    if (index >= 0) {
      insertAt = index + 1;
      break;
    }
  }
  if (insertAt < 0) insertAt = Math.min(next.length, 2);

  next.splice(insertAt, 0, {
    ...(structuredClone(seedBlock) as JsonBlock),
    id: newBlockId(),
  });
  notes.push(note);
}

/**
 * Home used to open on a generic networks headline, then on an AI-first hero.
 * When that exact seed copy is still on the page, replace it with the current
 * company-first hero. A headline an admin wrote themselves is left alone.
 */
const PREVIOUS_TECH_HERO_HEADLINES = new Set([
  "IT, networks and security that keep your business running",
  "Networks and security built to stay up",
  "AI on the cameras and phones you already run",
  "AI we implement on cameras and phones",
]);

const TITLE_CASE_TECH_HERO_HEADLINES = new Set([
  "Networks, security, and communications for Northern Ontario",
]);

const PREVIOUS_CAPABILITY_HEADINGS = new Set([
  "Two systems every site already runs",
  "Two systems we implement with AI",
]);

const PREVIOUS_SERVICE_HERO_HEADLINES = new Set([
  "AI on the cameras and phones you already need",
]);

const TITLE_CASE_SERVICE_HERO_HEADLINES = new Set([
  "IT infrastructure built for uptime",
  "Protect your business with enterprise-grade cybersecurity",
  "Comprehensive security for your business, assets and people",
  "Cloud-hosted IP VoIP telephone service",
  "Looking for affordable, reliable internet?",
  "Video broadcasting service",
  "Client and private broadcasts",
  "Access control and parking gate systems",
  "Intrusion alarms that the same team stays on",
  "See who is at the door before you open it",
  "A silent call for help from the desk",
  "Structured cabling and fiber optic splicing",
  "Level 2 EV charging, installed and certified",
  "Your Hytera communications dealer",
  "Know where your fleet is, in real time",
  "Digital marketing & graphic design",
  "Websites we build and stand behind",
  "Technical support",
  "Talk to WirelessCom",
  "AI we implement on cameras and phones",
  "Next-generation firewalls we actually support",
  "VoIP 9-1-1 (E-911) notice",
]);

const PREVIOUS_CTA_HEADINGS = new Set([
  "Add AI to the cameras or the phones you already have",
]);

const PREVIOUS_IT_CLOUD_SECTION = {
  eyebrow: "Cloud and Microsoft 365",
  heading: "Azure, AWS, Google Cloud and Microsoft 365",
};

function upgradeItServicesCopy(
  next: JsonBlock[],
  seed: ReturnType<typeof buildBlocks>,
  slug: string,
  notes: string[],
): void {
  if (slug !== "it-services") return;

  const seedImageTexts = seed.filter((block) => block.type === "imageText");
  const currentImageTexts = next.filter((block) => block.type === "imageText");
  const first = currentImageTexts[0];
  const firstData = (first?.data ?? {}) as Record<string, unknown>;

  if (
    first &&
    String(firstData.eyebrow ?? "") === PREVIOUS_IT_CLOUD_SECTION.eyebrow &&
    String(firstData.heading ?? "") === PREVIOUS_IT_CLOUD_SECTION.heading &&
    seedImageTexts[0]
  ) {
    first.data = structuredClone(seedImageTexts[0].data);
    first.settings = {
      ...(first.settings ?? {}),
      ...(seedImageTexts[0].settings ?? {}),
    };
    notes.push("IT field install section");
  }

  const hasCloudSection = currentImageTexts.some(
    (block) =>
      String((block.data as { heading?: string })?.heading ?? "") ===
      PREVIOUS_IT_CLOUD_SECTION.heading,
  );
  if (!hasCloudSection && seedImageTexts[1]) {
    const brandIndex = next.findIndex((block) => block.type === "brandGrid");
    const featureIndex = next.findIndex((block) => block.type === "featureGrid");
    const insertAt = brandIndex >= 0 ? brandIndex : featureIndex;
    if (insertAt >= 0) {
      next.splice(insertAt, 0, {
        ...(structuredClone(seedImageTexts[1]) as JsonBlock),
        id: newBlockId(),
      });
      notes.push("IT cloud section");
    }
  }

  const seedHero = seed.find((block) => block.type === "hero");
  const currentHero = next.find((block) => block.type === "hero");
  if (!seedHero || !currentHero) return;

  const currentData = (currentHero.data ??= {});
  const seedData = seedHero.data as Record<string, unknown>;
  const highlights = currentData.highlights;
  if (
    Array.isArray(highlights) &&
    highlights.some((item) => /azure|aws|google cloud/i.test(String(item)))
  ) {
    currentData.subheadline = seedData.subheadline;
    currentData.highlights = structuredClone(seedData.highlights);
    notes.push("IT hero copy");
  }
}

const LIGHT_STREAM_BANDS = new Set(["white", "light"]);

function upgradeVideoServicesSurfaces(
  next: JsonBlock[],
  slug: string,
  notes: string[],
): void {
  if (slug !== "video-services" && slug !== "live-video-broadcasting") return;

  for (const block of next) {
    if (block.type !== "liveStream" && block.type !== "streamGrid") continue;
    const settings = (block.settings ??= {});
    const background = String(settings.background ?? "white");
    if (!LIGHT_STREAM_BANDS.has(background)) continue;
    settings.background = "grid";
    notes.push(`${block.type} broadcast band`);
  }
}

function upgradeTechHeroCopy(
  next: JsonBlock[],
  seed: ReturnType<typeof buildBlocks>,
  notes: string[],
): void {
  const seedHero = seed.find((block) => block.type === "techHero");
  const currentHero = next.find((block) => block.type === "techHero");
  if (!seedHero || !currentHero) return;

  const currentData = (currentHero.data ??= {});
  const headline = String(currentData.headline ?? "");
  const seedData = seedHero.data as unknown as Record<string, unknown>;

  if (TITLE_CASE_TECH_HERO_HEADLINES.has(headline)) {
    currentData.headline = seedData.headline;
    notes.push("home hero title case");
    return;
  }

  if (!PREVIOUS_TECH_HERO_HEADLINES.has(headline)) return;

  currentData.eyebrow = seedData.eyebrow;
  currentData.headline = seedData.headline;
  currentData.subheadline = seedData.subheadline;
  if (Array.isArray(seedData.highlights)) {
    currentData.highlights = [...seedData.highlights];
  }
  if (Array.isArray(seedData.buttons)) {
    currentData.buttons = structuredClone(seedData.buttons);
  }
  notes.push("home company hero copy");
}

function upgradeCapabilityCopy(
  next: JsonBlock[],
  seed: ReturnType<typeof buildBlocks>,
  notes: string[],
): void {
  const seedBlock = seed.find((block) => block.type === "capabilityGrid");
  const currentBlock = next.find((block) => block.type === "capabilityGrid");
  if (!seedBlock || !currentBlock) return;

  const currentData = (currentBlock.data ??= {});
  if (!PREVIOUS_CAPABILITY_HEADINGS.has(String(currentData.heading ?? ""))) return;

  const seedData = seedBlock.data as unknown as Record<string, unknown>;
  currentData.eyebrow = seedData.eyebrow;
  currentData.heading = seedData.heading;
  currentData.description = seedData.description;
  currentData.columns = seedData.columns;
  currentData.showImages = seedData.showImages;
  if (Array.isArray(seedData.items)) {
    currentData.items = structuredClone(seedData.items);
  }
  if (seedBlock.settings) {
    currentBlock.settings = {
      ...(currentBlock.settings ?? {}),
      ...seedBlock.settings,
    };
  }
  notes.push("core platforms copy");
}

function upgradeServiceHeroCopy(
  next: JsonBlock[],
  seed: ReturnType<typeof buildBlocks>,
  notes: string[],
): void {
  const seedHero = seed.find((block) => block.type === "hero");
  const currentHero = next.find((block) => block.type === "hero");
  if (!seedHero || !currentHero) return;

  const currentData = (currentHero.data ??= {});
  const headline = String(currentData.headline ?? "");
  const seedData = seedHero.data as unknown as Record<string, unknown>;

  if (TITLE_CASE_SERVICE_HERO_HEADLINES.has(headline)) {
    currentData.headline = seedData.headline;
    notes.push("hero title case");
    return;
  }

  if (!PREVIOUS_SERVICE_HERO_HEADLINES.has(headline)) {
    return;
  }

  currentData.headline = seedData.headline;
  currentData.subheadline = seedData.subheadline;
  notes.push("AI services hero copy");
}

function upgradeCtaCopy(
  next: JsonBlock[],
  seed: ReturnType<typeof buildBlocks>,
  notes: string[],
): void {
  const currentCtas = next.filter((block) => block.type === "cta");
  const seedCtas = seed.filter((block) => block.type === "cta");
  for (const current of currentCtas) {
    const currentData = (current.data ??= {});
    if (!PREVIOUS_CTA_HEADINGS.has(String(currentData.heading ?? ""))) continue;
    const seedMatch = seedCtas[seedCtas.length - 1];
    if (!seedMatch) continue;
    const seedData = seedMatch.data as unknown as Record<string, unknown>;
    currentData.heading = seedData.heading;
    if (seedData.description !== undefined) {
      currentData.description = seedData.description;
    }
    notes.push("AI services CTA copy");
  }
}

function fixBannerCtaSurfaces(next: JsonBlock[], notes: string[]): void {
  for (const block of next) {
    if (block.type !== "cta") continue;
    const variant = String(block.data?.variant ?? "banner");
    if (variant !== "banner") continue;
    const settings = (block.settings ??= {});
    const background = String(settings.background ?? "white");
    if (
      background === "white" ||
      background === "light" ||
      background === "accent"
    ) {
      settings.background = "gradient";
      notes.push("CTA banner contrast");
    }
  }
}

function upgradeHyteraCtaCopy(next: JsonBlock[], notes: string[]): void {
  for (const block of next) {
    if (block.type !== "cta") continue;
    const data = (block.data ??= {});
    const description = String(data.description ?? "");
    if (!/contact us to learn more about hytera products/i.test(description)) {
      continue;
    }
    data.description =
      "Check current Hytera prices and request a quote at hyteraradios.ca for the radios you need. For rentals, programming, or a custom fleet, call 1-800-705-3189.";
    const buttons = Array.isArray(data.buttons)
      ? (data.buttons as Array<Record<string, unknown>>)
      : [];
    if (!buttons.some((button) => String(button.href ?? "").includes("hyteraradios.ca"))) {
      buttons.push({
        label: "Open hyteraradios.ca",
        href: HYTERA_CATALOG_URL,
        style: "outline",
        openInNewTab: true,
      });
      data.buttons = buttons;
    }
    notes.push("Hytera CTA copy");
  }
}

function ensureHyteraCatalog(
  next: JsonBlock[],
  seed: ReturnType<typeof buildBlocks>,
  slug: string,
  notes: string[],
): void {
  if (slug !== "home" && slug !== "two-way-radios") return;

  const hasCatalogCta = next.some((block) => {
    if (block.type !== "cta") return false;
    const heading = String(block.data?.heading ?? "");
    return (
      heading === HYTERA_CATALOG_HEADING ||
      /hytera prices/i.test(heading)
    );
  });
  if (hasCatalogCta) return;

  const seedBlock = seed.find((block) => {
    if (block.type !== "cta") return false;
    return String((block.data as { heading?: string }).heading ?? "") === HYTERA_CATALOG_HEADING;
  });
  if (!seedBlock) return;

  const afterTypes =
    slug === "home"
      ? ["capabilityGrid", "techHero", "hero"]
      : ["richText", "hero"];
  let insertAt = -1;
  for (const type of afterTypes) {
    const index = next.findIndex((block) => block.type === type);
    if (index >= 0) {
      insertAt = index + 1;
      break;
    }
  }
  if (insertAt < 0) insertAt = Math.min(next.length, 2);

  next.splice(insertAt, 0, {
    ...(structuredClone(seedBlock) as JsonBlock),
    id: newBlockId(),
  });
  notes.push("Hytera catalog callout");
}

/**
 * On pages an admin has already edited, still fill empty photos and logos,
 * append missing service cards and brand tiles, insert a stats strip,
 * defense-in-depth section, or core-capabilities section when the seed has
 * one and the live page does not, and upgrade the home tech hero when it
 * still carries a previous seed headline. Copy, headlines, and photos the
 * admin set are left alone.
 */
function fillMissingMedia(
  current: unknown,
  seed: ReturnType<typeof buildBlocks>,
  slug: string,
): { blocks: JsonBlock[]; notes: string[] } | null {
  if (!Array.isArray(current)) return null;

  const next = structuredClone(current) as JsonBlock[];
  const notes: string[] = [];

  const seedGrids = seed.filter((block) => block.type === "serviceGrid");
  const currentGrids = next.filter((block) => block.type === "serviceGrid");
  for (let index = 0; index < Math.min(seedGrids.length, currentGrids.length); index += 1) {
    const seedItems = seedGrids[index].data.items as Array<Record<string, unknown>>;
    const currentItems = currentGrids[index].data?.items;
    if (!Array.isArray(currentItems)) continue;

    for (const seedItem of seedItems) {
      const match = currentItems.find((item) =>
        sameServiceCard(item as Record<string, unknown>, seedItem),
      ) as Record<string, unknown> | undefined;

      if (match) {
        if (!String(match.imageUrl ?? "") && seedItem.imageUrl) {
          match.imageUrl = seedItem.imageUrl;
          if (seedItem.imageAlt) match.imageAlt = seedItem.imageAlt;
          notes.push(`photo on ${String(match.title || seedItem.title)}`);
        }
        continue;
      }

      currentItems.push({ ...seedItem });
      notes.push(`added ${String(seedItem.title)}`);
    }
  }

  const seedBrands = seed.filter((block) => block.type === "brandGrid");
  const currentBrands = next.filter((block) => block.type === "brandGrid");
  for (let index = 0; index < Math.min(seedBrands.length, currentBrands.length); index += 1) {
    const seedItems = seedBrands[index].data.items as Array<Record<string, unknown>>;
    const currentItems = currentBrands[index].data?.items;
    if (!Array.isArray(currentItems)) continue;

    for (const seedItem of seedItems) {
      const match = currentItems.find((item) =>
        sameBrand(item as Record<string, unknown>, seedItem),
      ) as Record<string, unknown> | undefined;

      if (match) {
        const currentLogo = String(match.logoUrl ?? "");
        const seedLogo = String(seedItem.logoUrl ?? "");
        if (!currentLogo && seedLogo) {
          match.logoUrl = seedLogo;
          notes.push(`logo on ${String(match.name || seedItem.name)}`);
        } else if (
          seedLogo &&
          currentLogo !== seedLogo &&
          currentLogo.startsWith("/brand/logos/")
        ) {
          // Keep admin uploads under /uploads. Refresh shipped files in place
          // when the seed now points at the vendor's own mark.
          match.logoUrl = seedLogo;
          notes.push(`updated logo for ${String(match.name || seedItem.name)}`);
        }
        continue;
      }

      currentItems.push({ ...seedItem });
      notes.push(`added brand ${String(seedItem.name)}`);
    }
  }

  const seedStats = seed.find((block) => block.type === "stats");
  const currentStats = next.find((block) => block.type === "stats");
  if (seedStats && currentStats) {
    const seedData = seedStats.data as unknown as Record<string, unknown>;
    const currentData = (currentStats.data ??= {});
    if (!String(currentData.heading ?? "") && seedData.heading) {
      currentData.heading = seedData.heading;
      notes.push("stats heading");
    }
    const seedChips = seedData.chips;
    const currentChips = currentData.chips;
    if (
      Array.isArray(seedChips) &&
      seedChips.length > 0 &&
      (!Array.isArray(currentChips) || currentChips.length === 0)
    ) {
      currentData.chips = [...seedChips];
      notes.push("stats chips");
    } else if (Array.isArray(seedChips) && Array.isArray(currentChips)) {
      const present = new Set(
        currentChips.map((chip) => String(chip).trim().toLowerCase()),
      );
      for (const chip of seedChips) {
        const label = String(chip).trim();
        if (!label || present.has(label.toLowerCase())) continue;
        if (!["azure", "aws", "google cloud", "microsoft 365"].includes(label.toLowerCase())) {
          continue;
        }
        currentChips.push(label);
        present.add(label.toLowerCase());
        notes.push(`stats chip ${label}`);
      }
    }
  }

  insertMissingSeedBlock(
    next,
    seed,
    "stats",
    ["pillars", "techHero", "hero"],
    notes,
    "stats highlights",
  );
  insertMissingSeedBlock(
    next,
    seed,
    "capabilityGrid",
    ["techHero", "hero"],
    notes,
    "core capabilities",
  );
  insertMissingSeedBlock(
    next,
    seed,
    "serviceGrid",
    ["steps", "hero", "techHero"],
    notes,
    "related services",
  );
  insertMissingSeedBlock(
    next,
    seed,
    "imageText",
    ["hero", "techHero"],
    notes,
    "missing imageText",
  );
  insertMissingSeedBlock(
    next,
    seed,
    "brandGrid",
    ["imageText", "techHero", "hero"],
    notes,
    "missing brandGrid",
  );
  insertMissingSeedBlock(
    next,
    seed,
    "defenseInDepth",
    ["imageText", "stats", "statusStrip", "pillars"],
    notes,
    "defense in depth",
  );

  upgradeTechHeroCopy(next, seed, notes);
  upgradeCapabilityCopy(next, seed, notes);
  upgradeServiceHeroCopy(next, seed, notes);
  upgradeCtaCopy(next, seed, notes);
  upgradeItServicesCopy(next, seed, slug, notes);
  upgradeVideoServicesSurfaces(next, slug, notes);
  fixBannerCtaSurfaces(next, notes);
  upgradeHyteraCtaCopy(next, notes);
  ensureHyteraCatalog(next, seed, slug, notes);

  const seedHeroes = seed.filter((block) => block.type === "hero");
  const currentHeroes = next.filter((block) => block.type === "hero");
  for (let index = 0; index < Math.min(seedHeroes.length, currentHeroes.length); index += 1) {
    const seedData = seedHeroes[index].data as unknown as Record<string, unknown>;
    const currentData = (currentHeroes[index].data ??= {});
    if (!String(currentData.backgroundImageUrl ?? "") && seedData.backgroundImageUrl) {
      currentData.backgroundImageUrl = seedData.backgroundImageUrl;
      if (seedData.backgroundImageAlt) {
        currentData.backgroundImageAlt = seedData.backgroundImageAlt;
      }
      if (currentData.variant === "dark" || !currentData.variant) {
        currentData.variant = "split";
      }
      notes.push("hero photo");
    }

    const seedHighlights = seedData.highlights;
    const currentHighlights = currentData.highlights;
    if (Array.isArray(seedHighlights) && Array.isArray(currentHighlights)) {
      const present = new Set(
        currentHighlights.map((item) => String(item).trim().toLowerCase()),
      );
      for (const item of seedHighlights) {
        const label = String(item).trim();
        if (!label || present.has(label.toLowerCase())) continue;
        if (
          !/microsoft 365|azure|aws|google cloud/i.test(label)
        ) {
          continue;
        }
        currentHighlights.push(label);
        present.add(label.toLowerCase());
        notes.push(`hero highlight ${label}`);
      }
    }
  }

  const seedImageText = seed.filter((block) => block.type === "imageText");
  const currentImageText = next.filter((block) => block.type === "imageText");
  for (let index = 0; index < Math.min(seedImageText.length, currentImageText.length); index += 1) {
    const seedImage = (
      seedImageText[index].data as unknown as { image?: { url?: string; alt?: string } }
    ).image;
    const currentData = (currentImageText[index].data ??= {});
    const currentImage = (currentData.image ?? {}) as { url?: string; alt?: string };
    if (!String(currentImage.url ?? "") && seedImage?.url) {
      currentData.image = {
        ...currentImage,
        url: seedImage.url,
        alt: seedImage.alt ?? currentImage.alt ?? "",
      };
      notes.push("section photo");
    }
  }

  return notes.length > 0 ? { blocks: next, notes } : null;
}

function fillMissingMeta(
  existing: { metaTitle: string | null; metaDescription: string | null },
  seed: { metaTitle?: string; metaDescription: string },
): { metaTitle?: string; metaDescription?: string } | null {
  const patch: { metaTitle?: string; metaDescription?: string } = {};
  if (!existing.metaTitle?.trim() && seed.metaTitle) {
    patch.metaTitle = seed.metaTitle;
  }
  if (!existing.metaDescription?.trim() && seed.metaDescription) {
    patch.metaDescription = seed.metaDescription;
  }
  return Object.keys(patch).length > 0 ? patch : null;
}

async function snapshotPage(
  pageId: string,
  title: string,
  blocks: unknown,
  note: string,
): Promise<void> {
  await prisma.pageRevision.create({
    data: {
      pageId,
      title,
      blocks: blocks as never,
      note,
    },
  });
}

async function main(): Promise<void> {
  const { apply, forceAll, forced } = parseArgs(process.argv.slice(2));

  process.stdout.write(
    `\nContent sync — ${apply ? "APPLY" : "dry run"}${
      forceAll ? " (forcing all pages)" : forced.size ? ` (forcing: ${[...forced].join(", ")})` : ""
    }\n\n`,
  );

  const rows: Row[] = [];

  for (const page of SEED_PAGES) {
    const blocks = buildBlocks(page.blocks, page.slug);
    const existing = await prisma.page.findUnique({
      where: { slug: page.slug },
      select: {
        id: true,
        title: true,
        blocks: true,
        createdAt: true,
        updatedAt: true,
        metaTitle: true,
        metaDescription: true,
      },
    });

    if (!existing) {
      rows.push({ slug: page.slug, verdict: "create", detail: "new page" });
      if (apply) {
        await prisma.page.create({
          data: {
            slug: page.slug,
            title: page.title,
            navLabel: page.navLabel ?? null,
            status: "PUBLISHED",
            blocks: blocks as never,
            metaTitle: page.metaTitle ?? null,
            metaDescription: page.metaDescription,
            showInHeaderNav: page.showInHeaderNav ?? false,
            showInFooterNav: page.showInFooterNav ?? false,
            navOrder: page.navOrder ?? 0,
            isSystem: page.isSystem ?? false,
            publishedAt: new Date(),
          },
        });
      }
      continue;
    }

    const nextBlocks = JSON.stringify(blocks);
    const currentBlocks = JSON.stringify(existing.blocks);
    const edited = wasEditedByAdmin(existing.createdAt, existing.updatedAt);
    const isForced = forceAll || forced.has(page.slug);

    if (nextBlocks === currentBlocks && existing.title === page.title) {
      if (!edited || isForced) {
        const metaChanged =
          (page.metaTitle ?? null) !== existing.metaTitle ||
          page.metaDescription !== existing.metaDescription;
        if (metaChanged) {
          rows.push({
            slug: page.slug,
            verdict: "update",
            detail: "refreshing search titles and descriptions",
          });
          if (apply) {
            await prisma.page.update({
              where: { id: existing.id },
              data: {
                metaTitle: page.metaTitle ?? null,
                metaDescription: page.metaDescription,
              },
            });
          }
          continue;
        }
      } else {
        const meta = fillMissingMeta(existing, page);
        if (meta) {
          rows.push({
            slug: page.slug,
            verdict: "update",
            detail: "filled blank search title or description",
          });
          if (apply) {
            await prisma.page.update({
              where: { id: existing.id },
              data: meta,
            });
          }
          continue;
        }
      }

      rows.push({ slug: page.slug, verdict: "identical", detail: "already up to date" });
      continue;
    }

    if (edited && !isForced) {
      const filled = fillMissingMedia(existing.blocks, blocks, page.slug);
      const meta = fillMissingMeta(existing, page);
      if (!filled && !meta) {
        rows.push({
          slug: page.slug,
          verdict: "skip-edited",
          detail: `edited ${existing.updatedAt.toISOString().slice(0, 10)} — re-run with --force ${page.slug}`,
        });
        continue;
      }

      const notes = [
        ...(filled ? [`filled missing media (${filled.notes.join("; ")})`] : []),
        ...(meta ? ["filled blank search title or description"] : []),
      ];

      rows.push({
        slug: page.slug,
        verdict: "update",
        detail: notes.join("; "),
      });

      if (apply) {
        await snapshotPage(
          existing.id,
          existing.title,
          existing.blocks,
          "Automatic snapshot before filling missing media",
        );
        await prisma.page.update({
          where: { id: existing.id },
          data: {
            ...(filled ? { blocks: filled.blocks as never } : {}),
            ...meta,
          },
        });
      }
      continue;
    }

    rows.push({
      slug: page.slug,
      verdict: "update",
      detail: isForced && edited ? "forced over admin edits" : "refreshing seed content",
    });

    if (apply) {
      await snapshotPage(
        existing.id,
        existing.title,
        existing.blocks,
        "Automatic snapshot before content:sync",
      );

      await prisma.page.update({
        where: { id: existing.id },
        data: {
          title: page.title,
          navLabel: page.navLabel ?? null,
          blocks: blocks as never,
          metaTitle: page.metaTitle ?? null,
          metaDescription: page.metaDescription,
          showInHeaderNav: page.showInHeaderNav ?? false,
          showInFooterNav: page.showInFooterNav ?? false,
          navOrder: page.navOrder ?? 0,
          isSystem: page.isSystem ?? false,
        },
      });
    }
  }

  for (const row of rows) {
    const marker =
      row.verdict === "create"
        ? "+"
        : row.verdict === "update"
          ? "~"
          : row.verdict === "skip-edited"
            ? "!"
            : " ";
    process.stdout.write(
      `  ${marker} /${row.slug.padEnd(28)} ${row.verdict.padEnd(12)} ${row.detail}\n`,
    );
  }

  // Redirects are additive. One exception: /alarm used to point at the
  // combined security page; retarget it when that destination was never changed.
  let redirectsAdded = 0;
  let redirectsUpdated = 0;
  const RETARGET_REDIRECTS = [
    { source: "/alarm", from: "/security-services", to: "/alarm-systems" },
  ];
  for (const entry of RETARGET_REDIRECTS) {
    const existing = await prisma.redirect.findUnique({
      where: { source: entry.source },
      select: { id: true, destination: true },
    });
    if (!existing || existing.destination === entry.to) continue;
    if (existing.destination !== entry.from) continue;
    redirectsUpdated += 1;
    if (apply) {
      await prisma.redirect.update({
        where: { source: entry.source },
        data: { destination: entry.to },
      });
    }
  }
  for (const entry of SEED_REDIRECTS) {
    const exists = await prisma.redirect.findUnique({
      where: { source: entry.source },
      select: { id: true },
    });
    if (exists) continue;
    redirectsAdded += 1;
    if (apply) {
      await prisma.redirect.create({
        data: { source: entry.source, destination: entry.destination },
      });
    }
  }

  // Navigation is additive in both directions: missing top-level items are
  // created, and missing children are appended to items that already exist so
  // newly introduced sections reach a menu an admin has already customized.
  let navAdded = 0;
  for (const item of SEED_NAV) {
    const existing = await prisma.navItem.findFirst({
      where: { label: item.label, location: item.location, parentId: null },
      select: { id: true, children: { select: { label: true, order: true } } },
    });

    let parentId = existing?.id ?? null;
    const presentChildren = new Set(
      (existing?.children ?? []).map((child) => child.label),
    );
    let nextOrder = (existing?.children ?? []).reduce(
      (max, child) => Math.max(max, child.order + 1),
      0,
    );

    if (!existing) {
      navAdded += 1;
      if (apply) {
        const parent = await prisma.navItem.create({
          data: {
            label: item.label,
            href: item.href,
            location: item.location,
            order: item.order,
          },
        });
        parentId = parent.id;
      }
      nextOrder = 0;
    }

    for (const child of item.children ?? []) {
      if (presentChildren.has(child.label)) continue;
      navAdded += 1;
      if (apply && parentId) {
        await prisma.navItem.create({
          data: {
            label: child.label,
            href: child.href,
            location: item.location,
            order: nextOrder,
            openInNewTab: child.openInNewTab ?? false,
            parentId,
          },
        });
      }
      nextOrder += 1;
    }
  }

  const counts = rows.reduce<Record<Verdict, number>>(
    (acc, row) => {
      acc[row.verdict] += 1;
      return acc;
    },
    { create: 0, update: 0, "skip-edited": 0, identical: 0 },
  );

  process.stdout.write(
    [
      "",
      `  ${counts.create} to create, ${counts.update} to update, ${counts["skip-edited"]} skipped (admin-edited), ${counts.identical} unchanged`,
      `  ${redirectsAdded} redirects to add, ${redirectsUpdated} redirects to retarget, ${navAdded} menu entries to add`,
      "",
      apply
        ? "  Applied. Previous page content is recoverable from Revisions in the admin.\n"
        : "  Dry run only. Re-run with `-- --apply` to write these changes.\n",
      "",
    ].join("\n"),
  );
}

main()
  .catch((error) => {
    process.stderr.write(`\ncontent:sync failed — ${error.message}\n\n`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
