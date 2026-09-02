/**
 * Derives every brand asset the site needs from the single source logo.
 *
 * Run with `npm run brand:build` after replacing public/brand/logo.jpg. The
 * outputs are committed so a fresh clone (and the Docker build) has them
 * without needing sharp at image-build time.
 */
import { Buffer } from "node:buffer";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import { writeAppIcons } from "./build-app-icons.mjs";

const ROOT = process.cwd();
const BRAND = path.join(ROOT, "public", "brand");
const SOURCE = path.join(BRAND, "logo.jpg");

const NAVY_DEEP = "#041325";

/**
 * The source logo is a JPEG on a white background. Alpha is derived from how
 * far each pixel is from white, which keeps anti-aliased edges soft. RGB is
 * left untouched so the brand colours are never shifted.
 *
 * When `forDarkBackground` is set, every dark pixel that is not part of the
 * green artwork is turned white so the lockup reads on navy sections. The green
 * globe and tagline keep their colour, which is what carries the brand.
 */
async function toTransparent(forDarkBackground) {
  const { data, info } = await sharp(SOURCE)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const out = Buffer.alloc(info.width * info.height * 4);

  for (let i = 0, o = 0; i < data.length; i += channels, o += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const alpha = 255 - Math.min(r, g, b);
    const isGreen = g > r + 22 && g > b + 22;

    if (!forDarkBackground) {
      out[o] = r;
      out[o + 1] = g;
      out[o + 2] = b;
      out[o + 3] = alpha;
      continue;
    }

    if (isGreen) {
      // Lift the green 40% toward white: the print green is too dark to read
      // against navy at small sizes.
      out[o] = Math.round(r + (255 - r) * 0.4);
      out[o + 1] = Math.round(g + (255 - g) * 0.4);
      out[o + 2] = Math.round(b + (255 - b) * 0.4);
    } else {
      // Flat white for every non-green pixel. Anti-aliased edges keep their
      // partial alpha, so tinting them white removes the grey halo that a
      // luminance threshold would leave behind.
      out[o] = 255;
      out[o + 1] = 255;
      out[o + 2] = 255;
    }
    out[o + 3] = alpha;
  }

  return sharp(out, {
    raw: { width: info.width, height: info.height, channels: 4 },
  });
}

/** 1200x630 social card: deep navy, faint grid, logo, tagline. */
async function buildOpenGraph() {
  const W = 1200;
  const H = 630;

  const logo = await (await toTransparent(true))
    .resize({ width: 560 })
    .png()
    .toBuffer();

  const backdrop = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#041325"/>
      <stop offset="55%" stop-color="#0a2a4e"/>
      <stop offset="100%" stop-color="#072b45"/>
    </linearGradient>
    <radialGradient id="glow" cx="78%" cy="18%" r="62%">
      <stop offset="0%" stop-color="#22b8d8" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="#22b8d8" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect x="0" y="${H - 8}" width="${W}" height="8" fill="#22b8d8"/>
</svg>`);

  const caption = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <style>
    .h { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; font-weight: 700; fill: #ffffff; }
    .s { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; font-weight: 500; fill: #9fe3f2; letter-spacing: 3px; }
  </style>
  <text class="s" x="90" y="322" font-size="21">NETWORKING &#183; CYBERSECURITY &#183; TELECOM</text>
  <text class="h" x="90" y="392" font-size="46">Data. Voice. Video. Security.</text>
  <text class="s" x="90" y="452" font-size="22" letter-spacing="0">Serving Northern Ontario since 2005</text>
</svg>`);

  return sharp(backdrop)
    .composite([
      { input: logo, top: 128, left: 84 },
      { input: caption, top: 0, left: 0 },
    ])
    .png({ compressionLevel: 9 });
}

async function main() {
  await mkdir(BRAND, { recursive: true });

  const light = await (await toTransparent(false)).resize({ width: 800 }).png({ compressionLevel: 9 }).toBuffer();
  await writeFile(path.join(BRAND, "logo.png"), light);

  const inverse = await (await toTransparent(true)).resize({ width: 800 }).png({ compressionLevel: 9 }).toBuffer();
  await writeFile(path.join(BRAND, "logo-inverse.png"), inverse);

  await writeAppIcons();
  await writeFile(path.join(BRAND, "og-default.png"), await (await buildOpenGraph()).toBuffer());

  process.stdout.write(
    [
      "Brand assets written:",
      "  public/brand/logo.png          transparent, original colours",
      "  public/brand/logo-inverse.png  transparent, white wordmark for dark sections",
      "  public/brand/logo-mark.png     512 square 3D globe mark on white",
      "  public/icon.png                512 app icon on white",
      "  public/apple-icon.png          180 apple touch icon on white",
      "  public/favicon.png             32 tab icon on white",
      "  public/favicon.svg             64 globe on white, wrapped as SVG",
      "  public/brand/og-default.png    1200x630 social card",
      `  backdrop base colour ${NAVY_DEEP}`,
      "",
    ].join("\n"),
  );
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
