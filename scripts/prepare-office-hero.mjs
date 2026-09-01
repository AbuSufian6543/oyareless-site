/**
 * Copy the Real-ESRGAN restoration into the image inbox as the office hero
 * master, then replace the mushy door vinyl with sharp
 * "97 White Oak Drive East". The gold mark under the address is left alone.
 *
 *   node scripts/prepare-office-hero.mjs
 *   node scripts/build-site-images.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const X4 = path.join(ROOT, ".stock-cache", "office-white-oak-x4.png");
const OUT = path.join(
  ROOT,
  "assets",
  "source-images",
  "office-white-oak-hero.png",
);

/** Door glass vinyl on the 4x photograph. Covers the number and two address
 *  lines only — the gold bar and circular mark below stay in the photo. */
const VINYL = {
  left: 2104,
  top: 1384,
  width: 148,
  height: 102,
};

const GOLD = "#edd9a4";
const GOLD_SHADOW = "#6b4a28";

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
}

async function addressPlate() {
  const { width, height } = VINYL;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <text x="${width / 2}" y="36" text-anchor="middle"
    font-family="Segoe UI, Arial, Helvetica, sans-serif"
    font-size="28" font-weight="600" fill="${GOLD_SHADOW}">97</text>
  <text x="${width / 2}" y="34" text-anchor="middle"
    font-family="Segoe UI, Arial, Helvetica, sans-serif"
    font-size="28" font-weight="600" fill="${GOLD}">97</text>
  <text x="${width / 2}" y="64" text-anchor="middle"
    font-family="Segoe UI, Arial, Helvetica, sans-serif"
    font-size="12" font-weight="600" letter-spacing="0.2" fill="${GOLD_SHADOW}">${escapeXml("WHITE OAK DRIVE")}</text>
  <text x="${width / 2}" y="62" text-anchor="middle"
    font-family="Segoe UI, Arial, Helvetica, sans-serif"
    font-size="12" font-weight="600" letter-spacing="0.2" fill="${GOLD}">${escapeXml("WHITE OAK DRIVE")}</text>
  <text x="${width / 2}" y="86" text-anchor="middle"
    font-family="Segoe UI, Arial, Helvetica, sans-serif"
    font-size="12" font-weight="600" letter-spacing="1.1" fill="${GOLD_SHADOW}">EAST</text>
  <text x="${width / 2}" y="84" text-anchor="middle"
    font-family="Segoe UI, Arial, Helvetica, sans-serif"
    font-size="12" font-weight="600" letter-spacing="1.1" fill="${GOLD}">EAST</text>
</svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function glassPatch(photo) {
  const { left, top, width, height } = VINYL;
  return photo
    .clone()
    .extract({ left, top, width, height })
    .median(11)
    .blur(1.4)
    .png()
    .toBuffer();
}

async function main() {
  const photo = sharp(X4);
  const meta = await photo.metadata();
  if (meta.width !== 4400 || meta.height !== 2376) {
    throw new Error(
      `Expected 4400x2376 Real-ESRGAN output, got ${meta.width}x${meta.height}`,
    );
  }

  const patch = await glassPatch(photo);
  const plate = await addressPlate();
  const softened = await sharp(plate).blur(0.45).png().toBuffer();

  const composed = await photo
    .composite([
      { input: patch, left: VINYL.left, top: VINYL.top },
      { input: softened, left: VINYL.left, top: VINYL.top },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, composed);

  process.stdout.write(
    `  wrote ${path.relative(ROOT, OUT)} (${meta.width}x${meta.height})\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
