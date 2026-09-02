/**
 * Writes favicon / app icon / Apple touch icon from public/brand/app-icon.jpg
 * on a white background. Also invoked from build-brand-assets.mjs.
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import { fillDarkBackdrop, flattenOntoWhite } from "./image-backdrop.mjs";

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, "public", "brand", "app-icon.jpg");
const PUBLIC = path.join(ROOT, "public");

async function globeOnWhite() {
  const { data, info } = await sharp(SOURCE)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = Buffer.from(data);
  flattenOntoWhite(rgba);
  fillDarkBackdrop(rgba, info.width, info.height, 14);
  return sharp(rgba, {
    raw: { width: info.width, height: info.height, channels: 4 },
  });
}

async function buildAppIcon(size) {
  return (await globeOnWhite())
    .resize(size, size, { fit: "cover", kernel: "lanczos3" })
    .sharpen({ sigma: 0.5, m1: 0.5, m2: 0.3 })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

export async function writeAppIcons() {
  const icon512 = await buildAppIcon(512);
  const icon180 = await buildAppIcon(180);
  const icon64 = await buildAppIcon(64);
  const icon32 = await buildAppIcon(32);

  await writeFile(path.join(PUBLIC, "icon.png"), icon512);
  await writeFile(path.join(PUBLIC, "apple-icon.png"), icon180);
  await writeFile(path.join(PUBLIC, "favicon.png"), icon32);
  await writeFile(path.join(ROOT, "public", "brand", "logo-mark.png"), icon512);

  const href = `data:image/png;base64,${icon64.toString("base64")}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="WirelessCom.Ca">
  <rect width="64" height="64" fill="#ffffff"/>
  <image href="${href}" width="64" height="64"/>
</svg>
`;
  await writeFile(path.join(PUBLIC, "favicon.svg"), svg);

  return { icon512: icon512.length, icon180: icon180.length, icon32: icon32.length };
}

if (process.argv[1] && process.argv[1].includes("build-app-icons")) {
  const sizes = await writeAppIcons();
  process.stdout.write(
    `  icon.png ${sizes.icon512} bytes\n  apple-icon.png ${sizes.icon180} bytes\n  favicon.png ${sizes.icon32} bytes\n  favicon.svg written\n`,
  );
}
