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
 *     cards and brand tiles are still appended, and a missing home stats
 *     cards and brand tiles are still appended, and a missing home stats
 *     strip or defense-in-depth section is still inserted;

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
 * On pages an admin has already edited, still fill empty photos and logos,
 * append missing service cards and brand tiles, and insert a stats strip
 * or defense-in-depth section when the seed has one and the live page does
 * not. Copy, headlines, and photos the admin set are left alone.
 */
function fillMissingMedia(
  current: unknown,
  seed: ReturnType<typeof buildBlocks>,
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
    "defenseInDepth",
    ["imageText", "stats", "statusStrip", "pillars"],
    notes,
    "defense in depth",
  );

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

    if (nextBlocks === currentBlocks && existing.title === page.title) {
      rows.push({ slug: page.slug, verdict: "identical", detail: "already up to date" });
      continue;
    }

    const edited = wasEditedByAdmin(existing.createdAt, existing.updatedAt);
    const isForced = forceAll || forced.has(page.slug);

    if (edited && !isForced) {
      const filled = fillMissingMedia(existing.blocks, blocks);
      if (!filled) {
        rows.push({
          slug: page.slug,
          verdict: "skip-edited",
          detail: `edited ${existing.updatedAt.toISOString().slice(0, 10)} — re-run with --force ${page.slug}`,
        });
        continue;
      }

      rows.push({
        slug: page.slug,
        verdict: "update",
        detail: `filled missing media without replacing copy (${filled.notes.join("; ")})`,
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
          data: { blocks: filled.blocks as never },
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

  // Redirects and nav are additive only: an admin may have added their own.
  let redirectsAdded = 0;
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
      `  ${redirectsAdded} redirects and ${navAdded} menu entries to add`,
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
