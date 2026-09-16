/**
 * Historic Weebly stream poster: the site logo plus office contact, saved as
 * a JPEG that is rewritten onto /uploads/4/6/3/6/46366157/416823.jpg.
 *
 * Run after replacing public/brand/logo-inverse.png:
 *   node scripts/build-legacy-stream-logo.mjs
 *
 * Contact lines match src/lib/settings-defaults.ts. The JPEG is committed so
 * production does not need sharp at image-build time.
 */
import { Buffer } from "node:buffer";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const BRAND = path.join(ROOT, "public", "brand");
const LOGO = path.join(BRAND, "logo-inverse.png");
const OUT = path.join(BRAND, "legacy-stream-logo.jpg");

const WIDTH = 1280;
const HEIGHT = 720;

async function main() {
  const logo = await sharp(LOGO)
    .resize({ width: 960, kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  const logoMeta = await sharp(logo).metadata();
  const logoWidth = logoMeta.width ?? 960;
  const logoHeight = logoMeta.height ?? 190;
  const logoLeft = Math.round((WIDTH - logoWidth) / 2);
  const contactBlock = 220;
  const logoTop = Math.max(72, Math.round((HEIGHT - 8 - logoHeight - contactBlock) / 2));

  const backdrop = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#041325"/>
      <stop offset="55%" stop-color="#0a2a4e"/>
      <stop offset="100%" stop-color="#072b45"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="16%" r="58%">
      <stop offset="0%" stop-color="#22b8d8" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="#22b8d8" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
  <rect x="0" y="${HEIGHT - 8}" width="${WIDTH}" height="8" fill="#22b8d8"/>
</svg>`);

  const contactY = logoTop + logoHeight + 56;
  const contact = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <style>
    .line { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; fill: #eef4fb; }
    .muted { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; fill: #9fe3f2; }
  </style>
  <rect x="430" y="${contactY - 28}" width="420" height="1.5" fill="#22b8d8" fill-opacity="0.55"/>
  <text class="line" text-anchor="middle" x="640" y="${contactY + 18}" font-size="26">97 White Oak Drive, East</text>
  <text class="line" text-anchor="middle" x="640" y="${contactY + 56}" font-size="26">Sault Ste. Marie, ON P6B 4J7, Canada</text>
  <text class="muted" text-anchor="middle" x="640" y="${contactY + 112}" font-size="23">1-800-705-3189 &#183; service@wirelesscom.ca</text>
  <text class="muted" text-anchor="middle" x="640" y="${contactY + 152}" font-size="23">wirelesscom.org</text>
</svg>`);

  await sharp(backdrop)
    .composite([
      { input: logo, top: logoTop, left: logoLeft },
      { input: contact, top: 0, left: 0 },
    ])
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(OUT);

  process.stdout.write(
    `Wrote ${path.relative(ROOT, OUT)} (${WIDTH}x${HEIGHT}, logo ${logoWidth}x${logoHeight})\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
