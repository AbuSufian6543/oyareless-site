/**
 * Encode the service pictures from the Desktop `logos` folder (or a
 * previously copied source tree) into committed WebP files with a white
 * backdrop where needed — no watermark — then write the ordered manifest
 * the seed and media library read.
 *
 *   node scripts/prepare-service-photos.mjs
 *
 * Source search order:
 *   1. SERVICE_PHOTOS_DIR
 *   2. C:\Users\abu\Desktop\logos
 *   3. assets/source-images/services  (gitignored copy from a previous run)
 */
import { copyFile, mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import sharp from "sharp";

import { prepareServiceBitmap } from "./image-backdrop.mjs";

const ROOT = process.cwd();
const MAX_EDGE = 1600;
const WEBP_QUALITY = 84;
const MIN_COUNT = 81;

const DESKTOP_DIR = "C:\\Users\\abu\\Desktop\\logos";
const SOURCE_COPY = path.join(ROOT, "assets", "source-images", "services");
const PUBLIC_DIR = path.join(ROOT, "public", "images", "services");
const MANIFEST = path.join(ROOT, "src", "lib", "service-photos.generated.json");

/** Longest prefix first. Filenames are matched case-insensitively. */
const PREFIXES = [
  ["data cabling and fiber", "data-cabling-fiber-optic", "Data cabling and fiber"],
  ["internet services", "internet-services", "Internet services"],
  ["digital marketing", "digital-marketing", "Digital marketing"],
  ["web development", "web-development", "Web development"],
  ["security sytems", "security-services", "Security systems"],
  ["security systems", "security-services", "Security systems"],
  ["two way radio", "two-way-radios", "Two-way radios"],
  ["panic button", "panic-buttons", "Panic buttons"],
  ["fleet tracker", "fleet-vehicle-tracking", "Fleet tracking"],
  ["access control", "access-control", "Access control"],
  ["alarm system", "alarm-systems", "Alarm systems"],
  ["cybersecurity", "cybersecurity", "Cybersecurity"],
  ["ev charging", "ev-charging-solutions", "EV charging"],
  ["it services", "it-services", "IT services"],
  ["ai camera", "ai-services", "AI camera systems"],
  ["firewall", "firewalls", "Firewalls"],
  ["intercom", "door-intercom", "Door intercom"],
  ["voip", "telephone-services", "VoIP telephone systems"],
];

function imageFiles(names) {
  return names.filter((name) => {
    if (name.startsWith(".")) return false;
    return /\.(jpe?g|png|webp|avif)$/i.test(name);
  });
}

function matchPrefix(filename) {
  const stem = filename
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  for (const [prefix, slug, label] of PREFIXES) {
    if (stem === prefix || stem.startsWith(`${prefix} `)) {
      return { slug, label };
    }
  }
  return null;
}

function sortKey(filename) {
  const stem = filename.replace(/\.[^.]+$/, "");
  const edited = /edited/i.test(stem);
  const numbered = stem.match(/(\d+)\s*$/);
  const num = numbered ? Number.parseInt(numbered[1], 10) : 999;
  return { num, edited, filename: filename.toLowerCase() };
}

function compareFiles(a, b) {
  const left = sortKey(a);
  const right = sortKey(b);
  if (left.num !== right.num) return left.num - right.num;
  if (left.edited !== right.edited) return left.edited ? 1 : -1;
  return left.filename.localeCompare(right.filename);
}

async function resolveSourceDir() {
  const candidates = [
    process.env.SERVICE_PHOTOS_DIR,
    DESKTOP_DIR,
    SOURCE_COPY,
  ].filter(Boolean);

  for (const dir of candidates) {
    const names = await readdir(dir).catch(() => null);
    if (!names) continue;
    const files = imageFiles(names);
    if (files.length > 0) return { dir, files };
  }

  throw new Error(
    "No service pictures found. Put them in C:\\Users\\abu\\Desktop\\logos or set SERVICE_PHOTOS_DIR.",
  );
}

/** Original photos that must ship as-is — no watermark, fill, resize, or re-encode. */
const PASSTHROUGH = new Set(["digital marketing 2.png"]);

function sniffImageExtension(buffer, fallback) {
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return ".jpg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return ".png";
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45
  ) {
    return ".webp";
  }
  return fallback;
}

async function encodeOne(inputPath, outputPath, originalName) {
  if (PASSTHROUGH.has(originalName.toLowerCase())) {
    const bytes = await readFile(inputPath);
    const ext = sniffImageExtension(
      bytes,
      path.extname(originalName).toLowerCase() || ".jpg",
    );
    const dest = outputPath.replace(/\.webp$/i, ext);
    await writeFile(dest, bytes);
    if (dest !== outputPath) {
      await unlink(outputPath).catch(() => undefined);
    }
    return path.basename(dest);
  }

  await (
    await prepareServiceBitmap(inputPath, { maxEdge: MAX_EDGE })
  )
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toFile(outputPath);
  return path.basename(outputPath);
}

async function main() {
  const { dir: sourceDir, files } = await resolveSourceDir();
  if (files.length < MIN_COUNT) {
    throw new Error(
      `Expected at least ${MIN_COUNT} pictures in ${sourceDir}, found ${files.length}.`,
    );
  }

  await mkdir(SOURCE_COPY, { recursive: true });
  await mkdir(PUBLIC_DIR, { recursive: true });

  /** @type {Record<string, Array<{ url: string; alt: string; originalName: string }>>} */
  const bySlug = {};
  const unmatched = [];

  for (const filename of files) {
    const mapped = matchPrefix(filename);
    if (!mapped) {
      unmatched.push(filename);
      continue;
    }
    (bySlug[mapped.slug] ??= []).push({
      originalName: filename,
      slug: mapped.slug,
      label: mapped.label,
    });
    await copyFile(path.join(sourceDir, filename), path.join(SOURCE_COPY, filename));
  }

  if (unmatched.length > 0) {
    throw new Error(`Unmapped files:\n  ${unmatched.join("\n  ")}`);
  }

  const manifest = {};
  let encoded = 0;

  for (const slug of Object.keys(bySlug).sort()) {
    const group = bySlug[slug].sort((a, b) => compareFiles(a.originalName, b.originalName));
    const outDir = path.join(PUBLIC_DIR, slug);
    await mkdir(outDir, { recursive: true });
    manifest[slug] = [];

    const kept = new Set();
    for (const [index, item] of group.entries()) {
      const stem = String(index + 1).padStart(2, "0");
      const filename = `${stem}.webp`;
      const outputPath = path.join(outDir, filename);
      const written = await encodeOne(
        path.join(sourceDir, item.originalName),
        outputPath,
        item.originalName,
      );
      kept.add(written);
      manifest[slug].push({
        url: `/images/services/${slug}/${written}`,
        alt: `${item.label} from WirelessCom.Ca Inc. Photo ${index + 1}.`,
        originalName: item.originalName,
      });
      encoded += 1;
    }

    for (const name of await readdir(outDir)) {
      if (!kept.has(name)) await unlink(path.join(outDir, name));
    }
  }

  if (encoded !== files.length) {
    throw new Error(`Encoded ${encoded} files, expected ${files.length}.`);
  }

  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const summary = Object.entries(manifest)
    .map(([slug, photos]) => `  ${slug}: ${photos.length}`)
    .join("\n");
  process.stdout.write(
    `Encoded ${encoded} service pictures from ${sourceDir}\n${summary}\nWrote ${path.relative(ROOT, MANIFEST)}\n`,
  );
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invoked) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
    process.exit(1);
  });
}
