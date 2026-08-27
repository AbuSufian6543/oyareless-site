/**
 * Single pipeline for the site's section photography.
 *
 * Only the optimised AVIF/WebP derivatives are committed. Masters live in the
 * gitignored inbox `assets/source-images/`, and every entry below records
 * exactly where its master came from — either a CC0 download or the generation
 * prompt used — so the whole set is reproducible.
 *
 *   node scripts/build-site-images.mjs
 *
 * Hero and other full-bleed backgrounds intentionally have no photograph: they
 * use src/components/visuals/TechBackdrop, which scales to any viewport and
 * carries no licence obligations.
 */
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const INBOX = path.join(ROOT, "assets", "source-images");
const OUT = path.join(ROOT, "public", "images");

/** Rendered at most ~800 CSS px wide, so 1400 covers 2x on the largest card. */
const WIDTHS = [1400, 900, 560];
const ASPECT = 0.625; // 16:10

const IMAGES = [
  {
    name: "networking",
    master: "networking.jpg",
    alt: "Dense bundles of blue and grey network patch cables terminated into a switch",
    origin: "cc0",
    title: "Feeling Wired",
    source: "rawpixel",
    landing: "https://www.rawpixel.com/image/5975692/feeling-wired",
  },
  {
    name: "cabling",
    master: "cabling.jpg",
    alt: "Fibre optic strands fanned out against a black background with light glowing at the tips",
    origin: "cc0",
    title: "Fiber Optics Close-Up",
    source: "rawpixel",
    landing: "https://www.rawpixel.com/image/5966166/fiber-optics-close-up",
  },
  {
    name: "server-rack",
    master: "gen-server-rack.png",
    alt: "Row of rack-mounted enterprise servers in a dark data centre aisle lit by blue status indicators",
    origin: "generated",
    prompt:
      "Modern enterprise server rack in a clean data centre aisle, dark navy and near-black, cyan and blue status LEDs as the only accent, neatly dressed cabling, shallow depth of field, cinematic premium B2B look.",
  },
  {
    name: "wifi",
    master: "gen-wifi.png",
    alt: "White enterprise Wi-Fi access point mounted on a dark office ceiling with a blue status ring",
    origin: "generated",
    prompt:
      "Modern white enterprise Wi-Fi access point on a dark ceiling in a contemporary office, faint cool blue status glow, blurred glass-partitioned office behind, navy colour grading.",
  },
  {
    name: "surveillance",
    master: "gen-surveillance.png",
    alt: "Dome and bullet security cameras mounted under the soffit of a modern commercial building at dusk",
    origin: "generated",
    prompt:
      "Dome and bullet security cameras on the exterior soffit of a contemporary dark grey commercial building at dusk, cool blue evening sky, cyan reflection on the housings, architectural security photography.",
  },
  {
    name: "cybersecurity",
    master: "gen-cybersecurity.png",
    alt: "Abstract shield formed from connected cyan nodes and lines over a dark navy grid",
    origin: "generated",
    prompt:
      "Abstract geometric shield built from thin cyan and blue line-work and connected nodes over deep navy with a faint grid. No padlocks, keyboards, hooded figures, matrix code or binary.",
  },
  {
    name: "voip",
    master: "gen-voip.png",
    alt: "Black executive VoIP desk phone with a colour display on a dark office desk",
    origin: "generated",
    prompt:
      "Modern black executive VoIP desk phone with colour display and corded handset on a dark desk, cool blue and cyan rim lighting, deep navy blurred office background.",
  },
  {
    name: "two-way-radio",
    master: "gen-two-way-radio.png",
    alt: "Three rugged professional handheld two-way radios on a dark surface with blue rim lighting",
    origin: "generated",
    prompt:
      "Two rugged black professional handheld two-way radios standing upright with a third lying beside them on dark charcoal, cool blue rim lighting, deep navy gradient background.",
  },
  {
    name: "remote-support",
    master: "gen-remote-support.png",
    alt: "Support technician wearing a headset at a desk with two monitors showing dashboards, seen from behind",
    origin: "generated",
    prompt:
      "Support technician at a desk in a headset viewed from behind over the shoulder, two monitors with abstract out-of-focus dashboards in cool blue, dark navy office, cyan screen glow.",
  },
  {
    name: "cabling-install",
    master: "gen-operations.png",
    alt: "Technician's hands terminating blue and white network cables into a rack-mounted patch panel",
    origin: "generated",
    prompt:
      "Technician in a dark navy work shirt terminating network cables into a rack-mounted patch panel, neatly bundled blue and white cables, cool cyan work light, face not visible.",
  },
];

async function main() {
  await mkdir(OUT, { recursive: true });

  let available;
  try {
    available = new Set(await readdir(INBOX));
  } catch {
    process.stderr.write(
      `\n  Inbox ${path.relative(ROOT, INBOX)} is missing.\n` +
        "  Place the master files listed in this script there and re-run.\n" +
        "  Committed derivatives in public/images are unaffected.\n\n",
    );
    process.exit(1);
  }

  const built = [];
  const missing = [];

  for (const image of IMAGES) {
    if (!available.has(image.master)) {
      missing.push(image);
      continue;
    }

    const input = await readFile(path.join(INBOX, image.master));

    for (const width of WIDTHS) {
      const resized = sharp(input).resize({
        width,
        height: Math.round(width * ASPECT),
        fit: "cover",
        position: "attention",
      });

      await writeFile(
        path.join(OUT, `${image.name}-${width}.avif`),
        await resized.clone().avif({ quality: 55, effort: 6 }).toBuffer(),
      );
      await writeFile(
        path.join(OUT, `${image.name}-${width}.webp`),
        await resized.clone().webp({ quality: 78 }).toBuffer(),
      );
    }

    built.push(image);
    process.stdout.write(`  ${image.name}: ${WIDTHS.length * 2} files\n`);
  }

  for (const image of missing) {
    process.stdout.write(`  ${image.name}: master "${image.master}" not in inbox — skipped\n`);
  }

  const generated = built.filter((image) => image.origin === "generated");
  const cc0 = built.filter((image) => image.origin === "cc0");

  const lines = [
    "# Image credits and provenance",
    "",
    "Derivatives in this folder are built by `node scripts/build-site-images.mjs`.",
    "Each entry below records where its master came from.",
    "",
    `Widths: ${WIDTHS.join(", ")} px, in AVIF and WebP, cropped to 16:10.`,
    "",
    "## Generated imagery",
    "",
    "Produced for this site, so there is no third-party licence attached. The",
    "prompt is recorded so a replacement can be produced in the same style.",
    "",
  ];

  for (const image of generated) {
    lines.push(`### \`${image.name}\``, "", `- **Alt text:** ${image.alt}`, `- **Prompt:** ${image.prompt}`, "");
  }

  lines.push(
    "## CC0 photography",
    "",
    "Sourced via the Openverse API filtered to CC0. CC0 places the work in the",
    "public domain and imposes no attribution requirement; sources are listed so",
    "provenance stays auditable.",
    "",
    "| File | Title | Source | Licence | Landing page |",
    "| --- | --- | --- | --- | --- |",
  );

  for (const image of cc0) {
    lines.push(
      `| \`${image.name}-*\` | ${image.title} | ${image.source} | CC0 | ${image.landing} |`,
    );
  }

  lines.push(
    "",
    "## Photographs owned by WirelessCom.Ca Inc.",
    "",
    "These live in `public/brand/` and are the company's own field photography:",
    "`home-hero.png` (the Sault Ste. Marie office at dusk), `internet-1.jpg`",
    "through `internet-5.jpg` (wireless relay and antenna installations) and",
    "`marketing-1.png` / `marketing-2.png` (digital signage installations).",
    "",
    "## Full-bleed backgrounds",
    "",
    "Hero and section backgrounds use `src/components/visuals/TechBackdrop`",
    "instead of a photograph — a gradient, grid and animated node mesh drawn in",
    "the browser. It scales to any viewport and carries no licence obligations.",
    "",
  );

  await writeFile(path.join(OUT, "CREDITS.md"), lines.join("\n"));

  process.stdout.write(
    `\n  ${built.length} images built (${generated.length} generated, ${cc0.length} CC0), ${missing.length} skipped\n` +
      "  Wrote public/images/CREDITS.md\n\n",
  );
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
