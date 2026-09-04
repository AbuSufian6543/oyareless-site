/**
 * Download public marks for the network-status board and encode them as WebP.
 *
 * Sources, in order: explicit override, homepage icon/apple-touch links,
 * Google S2 favicon, DuckDuckGo icons, then common files on the site origin.
 * Open Graph photos are ignored. Banner, photo, and blank images are skipped
 * so the slug can fall through to a later candidate or initials.
 *
 *   npx tsx scripts/prepare-status-logos.ts
 */
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import {
  PUBLIC_STATUS_MONITORS,
  statusLogoUrl,
} from "../src/lib/status-monitor-catalog";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "brand", "status-logos");
const QA_DIR = path.join(ROOT, "tmp", "status-logo-qa");
const SIZE = 256;
const TIMEOUT_MS = 18000;

const UA =
  "Mozilla/5.0 (compatible; StatusLogoPrep/1.0; +https://www.rfc-editor.org/rfc/rfc9110)";

/** Higher-quality marks for well-known brands whose favicons are tiny. */
const OVERRIDES: Record<string, string[]> = {
  youtube: [
    "https://www.youtube.com/s/desktop/d6431b94/img/favicon_144x144.png",
    "https://www.google.com/s2/favicons?domain=youtube.com&sz=128",
  ],
  facebook: [
    "https://www.facebook.com/images/fb_icon_325x325.png",
    "https://www.google.com/s2/favicons?domain=facebook.com&sz=128",
  ],
  instagram: [
    "https://static.cdninstagram.com/rsrc.php/v3/yI/r/VsNE-OHk_8a.png",
    "https://www.google.com/s2/favicons?domain=instagram.com&sz=128",
  ],
  whatsapp: [
    "https://static.whatsapp.net/rsrc.php/v3/yP/r/rYZqPCBaG70.png",
    "https://www.google.com/s2/favicons?domain=whatsapp.com&sz=128",
  ],
  cra: [
    "https://www.canada.ca/etc/designs/canada/wet-boew/assets/favicon-mobile.png",
    "https://www.google.com/s2/favicons?domain=canada.ca&sz=128",
  ],
  "service-canada": [
    "https://www.canada.ca/etc/designs/canada/wet-boew/assets/favicon-mobile.png",
    "https://www.google.com/s2/favicons?domain=canada.ca&sz=128",
  ],
  "canada-post": [
    "https://www.google.com/s2/favicons?domain=canadapost-postescanada.ca&sz=128",
  ],
  "weather-canada": [
    "https://www.canada.ca/etc/designs/canada/wet-boew/assets/favicon-mobile.png",
    "https://www.google.com/s2/favicons?domain=weather.gc.ca&sz=128",
  ],
  "cmha-algoma": [
    "https://www.google.com/s2/favicons?domain=ssm-algoma.cmha.ca&sz=128",
    "https://www.google.com/s2/favicons?domain=cmha.ca&sz=128",
  ],
  "station-mall": [
    "https://www.google.com/s2/favicons?domain=thestationmall.com&sz=128",
  ],
  "united-way-algoma": [
    "https://www.google.com/s2/favicons?domain=uwssmalgoma.ca&sz=128",
    "https://www.google.com/s2/favicons?domain=unitedway.ca&sz=128",
  ],
  canada: [
    "https://www.canada.ca/etc/designs/canada/wet-boew/assets/favicon-mobile.png",
    "https://www.google.com/s2/favicons?domain=canada.ca&sz=128",
  ],
  ircc: [
    "https://www.canada.ca/etc/designs/canada/wet-boew/assets/favicon-mobile.png",
    "https://www.google.com/s2/favicons?domain=canada.ca&sz=128",
  ],
  "health-canada": [
    "https://www.canada.ca/etc/designs/canada/wet-boew/assets/favicon-mobile.png",
    "https://www.google.com/s2/favicons?domain=canada.ca&sz=128",
  ],
  "employment-insurance": [
    "https://www.canada.ca/etc/designs/canada/wet-boew/assets/favicon-mobile.png",
    "https://www.google.com/s2/favicons?domain=canada.ca&sz=128",
  ],
  cpp: [
    "https://www.canada.ca/etc/designs/canada/wet-boew/assets/favicon-mobile.png",
    "https://www.google.com/s2/favicons?domain=canada.ca&sz=128",
  ],
  passports: [
    "https://www.canada.ca/etc/designs/canada/wet-boew/assets/favicon-mobile.png",
    "https://www.google.com/s2/favicons?domain=canada.ca&sz=128",
  ],
  "transport-canada": [
    "https://www.canada.ca/etc/designs/canada/wet-boew/assets/favicon-mobile.png",
    "https://www.google.com/s2/favicons?domain=canada.ca&sz=128",
  ],
  cbc: [
    "https://www.cbc.ca/premier/favicons/favicon-192x192.png",
    "https://www.google.com/s2/favicons?domain=cbc.ca&sz=128",
  ],
  "radio-canada": [
    "https://ici.radio-canada.ca/favicon.ico",
    "https://www.google.com/s2/favicons?domain=ici.radio-canada.ca&sz=128",
  ],
  "ontario-parks": [
    "https://www.google.com/s2/favicons?domain=ontarioparks.com&sz=128",
  ],
  "science-north": [
    "https://www.google.com/s2/favicons?domain=sciencenorth.ca&sz=128",
  ],
  "prince-township": [
    "https://www.google.com/s2/favicons?domain=princetownship.ca&sz=128",
  ],
  thessalon: [
    "https://www.google.com/s2/favicons?domain=thessalon.ca&sz=128",
  ],
  sudbury: [
    "https://www.google.com/s2/favicons?domain=greatersudbury.ca&sz=128",
  ],
  "algoma-legal-clinic": [
    "https://www.google.com/s2/favicons?domain=algomalegalclinic.com&sz=128",
  ],
  eastlink: [
    "https://www.google.com/s2/favicons?domain=eastlink.ca&sz=128",
  ],
  "go-transit": [
    "https://www.google.com/s2/favicons?domain=gotransit.com&sz=128",
  ],
  wawa: [
    "https://www.google.com/s2/favicons?domain=wawa.cc&sz=128",
  ],
  "blind-river": [
    "https://www.google.com/s2/favicons?domain=blindriver.ca&sz=128",
  ],
  "elliot-lake": [
    "https://www.google.com/s2/favicons?domain=elliotlake.ca&sz=128",
  ],
};

/** Sites whose favicon/og fetch returns a blank or unrelated mark. */
const INITIALS_ONLY = new Set([
  "prince-township",
  "sudbury",
  "algoma-legal-clinic",
  "eastlink",
  "rcmp",
  "ieso",
]);

function originOf(url: string): string {
  return new URL(url).origin;
}

function hostOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

function candidateUrls(slug: string, websiteUrl: string, fromHtml: string[]): string[] {
  const origin = originOf(websiteUrl);
  const host = hostOf(websiteUrl);
  const listed = OVERRIDES[slug] ?? [];
  return [
    ...listed,
    ...fromHtml,
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`,
    `https://icons.duckduckgo.com/ip3/${host}.ico`,
    `${origin}/apple-touch-icon.png`,
    `${origin}/apple-touch-icon-precomposed.png`,
    `${origin}/favicon.ico`,
    `${origin}/favicon.png`,
    `${origin}/favicon.svg`,
  ];
}

function absolutize(href: string, base: string): string | null {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

async function iconsFromHomepage(websiteUrl: string): Promise<string[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(websiteUrl, {
      redirect: "follow",
      headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": UA },
      signal: controller.signal,
    });
    if (!response.ok) return [];
    const html = (await response.text()).slice(0, 200_000);
    const found: string[] = [];
    const patterns = [
      /<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]*>/gi,
      /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*>/gi,
    ];
    for (const pattern of patterns) {
      for (const tag of html.match(pattern) ?? []) {
        const href = tag.match(/href=["']([^"']+)["']/i)?.[1]
          ?? tag.match(/content=["']([^"']+)["']/i)?.[1];
        if (!href) continue;
        const absolute = absolutize(href, response.url || websiteUrl);
        if (absolute) found.push(absolute);
      }
    }
    return [...new Set(found)];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function fetchBuffer(url: string): Promise<Buffer | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { Accept: "image/*,*/*;q=0.8", "User-Agent": UA },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const type = (response.headers.get("content-type") ?? "").toLowerCase();
    if (type.includes("text/html")) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 32 || bytes.length > 2_500_000) return null;
    return bytes;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function looksLikeMark(input: Buffer): Promise<boolean> {
  try {
    const meta = await sharp(input, { animated: false, failOn: "none" }).metadata();
    if (!meta.width || !meta.height) return false;
    if (meta.width < 16 || meta.height < 16) return false;

    const longest = Math.max(meta.width, meta.height);
    const shortest = Math.min(meta.width, meta.height);
    if (longest / shortest > 1.55) return false;

    const format = (meta.format ?? "").toLowerCase();
    if (
      longest >= 400 &&
      shortest >= 400 &&
      (format === "jpeg" || format === "jpg")
    ) {
      return false;
    }

    const stats = await sharp(input, { animated: false, failOn: "none" }).stats();
    const rgb = stats.channels.slice(0, 3);
    if (rgb.length === 0) return false;
    const meanStd =
      rgb.reduce((sum, channel) => sum + channel.stdev, 0) / rgb.length;
    const meanBright =
      rgb.reduce((sum, channel) => sum + channel.mean, 0) / rgb.length;
    if (meanStd < 10 || meanBright < 16) return false;

    return true;
  } catch {
    return false;
  }
}

async function encodeWebp(input: Buffer): Promise<Buffer | null> {
  try {
    if (!(await looksLikeMark(input))) return null;

    const image = sharp(input, { animated: false, failOn: "none" }).rotate();
    const meta = await image.metadata();
    if (!meta.width || !meta.height) return null;

    return await image
      .resize(SIZE, SIZE, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .webp({ quality: 88, effort: 4 })
      .toBuffer();
  } catch {
    return null;
  }
}

async function encodeOne(slug: string, websiteUrl: string): Promise<boolean> {
  if (INITIALS_ONLY.has(slug)) {
    const forced = await initialsMark(slug);
    if (forced) {
      await writeFile(path.join(OUT_DIR, `${slug}.webp`), forced);
      return true;
    }
  }

  const fromHtml = await iconsFromHomepage(websiteUrl);
  for (const url of candidateUrls(slug, websiteUrl, fromHtml)) {
    const raw = await fetchBuffer(url);
    if (!raw) continue;
    const webp = await encodeWebp(raw);
    if (!webp) continue;
    await writeFile(path.join(OUT_DIR, `${slug}.webp`), webp);
    return true;
  }

  const fallback = await initialsMark(slug);
  if (fallback) {
    await writeFile(path.join(OUT_DIR, `${slug}.webp`), fallback);
    return true;
  }
  return false;
}

async function initialsMark(slug: string): Promise<Buffer | null> {
  const monitor = PUBLIC_STATUS_MONITORS.find((item) => item.slug === slug);
  const label = fallbackLabel(slug, monitor?.name ?? slug);
  if (!label) return null;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
  <rect width="256" height="256" rx="36" fill="#0f3a68"/>
  <text x="128" y="148" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${label.length > 3 ? 48 : 72}" font-weight="700" fill="#ffffff">${escapeXml(label)}</text>
</svg>`;
  try {
    return await sharp(Buffer.from(svg)).webp({ quality: 90 }).toBuffer();
  } catch {
    return null;
  }
}

function fallbackLabel(slug: string, name: string): string {
  if (!slug.includes("-") && slug.length >= 2 && slug.length <= 8) {
    return slug.toUpperCase();
  }
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function writeQaSheet(slugs: string[]): Promise<void> {
  const tiles = await Promise.all(
    slugs.map(async (slug) => {
      const file = path.join(OUT_DIR, `${slug}.webp`);
      try {
        return await sharp(file)
          .resize(96, 96, {
            fit: "contain",
            background: { r: 241, g: 245, b: 249, alpha: 1 },
          })
          .png()
          .toBuffer();
      } catch {
        return sharp({
          create: {
            width: 96,
            height: 96,
            channels: 3,
            background: { r: 226, g: 232, b: 240 },
          },
        })
          .png()
          .toBuffer();
      }
    }),
  );

  const columns = 8;
  const rows = Math.ceil(tiles.length / columns);
  const composites = tiles.map((input, index) => ({
    input,
    left: (index % columns) * 104 + 8,
    top: Math.floor(index / columns) * 104 + 8,
  }));

  await mkdir(QA_DIR, { recursive: true });
  await sharp({
    create: {
      width: columns * 104 + 8,
      height: rows * 104 + 8,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite(composites)
    .png()
    .toFile(path.join(QA_DIR, "sheet.png"));
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });

  const args = process.argv.slice(2);
  const skipExisting = args.includes("--skip-existing");
  const only = new Set(args.filter((arg) => arg !== "--skip-existing"));
  const monitors =
    only.size > 0
      ? PUBLIC_STATUS_MONITORS.filter((monitor) => only.has(monitor.slug))
      : PUBLIC_STATUS_MONITORS;

  let ok = 0;
  const missing: string[] = [];

  for (const monitor of monitors) {
    const outFile = path.join(OUT_DIR, `${monitor.slug}.webp`);
    if (skipExisting) {
      const already = await access(outFile).then(() => true).catch(() => false);
      if (already) {
        ok += 1;
        process.stdout.write(`  skip ${monitor.slug}\n`);
        continue;
      }
    }
    const written = await encodeOne(monitor.slug, monitor.websiteUrl);
    if (written) {
      ok += 1;
      process.stdout.write(`  ok  ${monitor.slug} → ${statusLogoUrl(monitor.slug)}\n`);
    } else {
      missing.push(monitor.slug);
      process.stdout.write(`  miss ${monitor.slug}\n`);
    }
  }

  await writeQaSheet(monitors.map((monitor) => monitor.slug));

  process.stdout.write(
    `\nWrote ${ok}/${monitors.length} logos to ${path.relative(ROOT, OUT_DIR)}\n`,
  );
  if (missing.length > 0) {
    process.stdout.write(`Missing: ${missing.join(", ")}\n`);
  }
}

main().catch((error) => {
  process.stderr.write(`${(error as Error).message}\n`);
  process.exitCode = 1;
});
