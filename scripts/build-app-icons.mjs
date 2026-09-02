/**
 * Writes favicon / app icon / Apple touch icon from public/brand/app-icon.jpg.
 * The source is a square JPEG of the 3D globe on white. Also invoked from
 * build-brand-assets.mjs.
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import { flattenOntoWhite } from "./image-backdrop.mjs";

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, "public", "brand", "app-icon.jpg");
const PUBLIC = path.join(ROOT, "public");

/** PNG-in-ICO, which every current browser understands. */
function encodeIco(pngs) {
  const count = pngs.length;
  const header = 6 + 16 * count;
  let offset = header;
  const entries = pngs.map((item) => {
    const entry = { bytes: item.png.length, offset };
    offset += item.png.length;
    return entry;
  });

  const out = Buffer.alloc(offset);
  out.writeUInt16LE(0, 0);
  out.writeUInt16LE(1, 2);
  out.writeUInt16LE(count, 4);

  for (let i = 0; i < count; i += 1) {
    const size = pngs[i].size;
    const cursor = 6 + i * 16;
    out.writeUInt8(size >= 256 ? 0 : size, cursor);
    out.writeUInt8(size >= 256 ? 0 : size, cursor + 1);
    out.writeUInt8(0, cursor + 2);
    out.writeUInt8(0, cursor + 3);
    out.writeUInt16LE(1, cursor + 4);
    out.writeUInt16LE(32, cursor + 6);
    out.writeUInt32LE(entries[i].bytes, cursor + 8);
    out.writeUInt32LE(entries[i].offset, cursor + 12);
  }

  for (let i = 0; i < count; i += 1) {
    pngs[i].png.copy(out, entries[i].offset);
  }

  return out;
}

async function sourceOnWhite() {
  const { data, info } = await sharp(SOURCE)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = Buffer.from(data);
  flattenOntoWhite(rgba);
  return sharp(rgba, {
    raw: { width: info.width, height: info.height, channels: 4 },
  });
}

async function buildAppIcon(size) {
  const pipeline = (await sourceOnWhite()).resize(size, size, {
    fit: "contain",
    background: { r: 255, g: 255, b: 255, alpha: 1 },
    kernel: "lanczos3",
  });

  // Small tab icons need a touch of extra bite; 180/512 already have it.
  if (size <= 64) {
    pipeline.sharpen({ sigma: 0.55, m1: 0.6, m2: 0.3 });
  }

  // Apple (and most launchers) fill transparent pixels with black. The mark
  // is already composed on white, so strip the alpha channel entirely.
  return pipeline
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
}

export async function writeAppIcons() {
  const icon512 = await buildAppIcon(512);
  const icon192 = await buildAppIcon(192);
  const icon180 = await buildAppIcon(180);
  const icon64 = await buildAppIcon(64);
  const icon48 = await buildAppIcon(48);
  const icon32 = await buildAppIcon(32);
  const icon16 = await buildAppIcon(16);

  const ico = encodeIco([
    { size: 16, png: icon16 },
    { size: 32, png: icon32 },
    { size: 48, png: icon48 },
  ]);

  await writeFile(path.join(PUBLIC, "icon.png"), icon512);
  await writeFile(path.join(PUBLIC, "icon-192.png"), icon192);
  await writeFile(path.join(PUBLIC, "apple-icon.png"), icon180);
  await writeFile(path.join(PUBLIC, "apple-touch-icon.png"), icon180);
  await writeFile(path.join(PUBLIC, "apple-touch-icon-precomposed.png"), icon180);
  await writeFile(path.join(PUBLIC, "favicon.png"), icon32);
  await writeFile(path.join(PUBLIC, "favicon.ico"), ico);
  await writeFile(path.join(ROOT, "public", "brand", "logo-mark.png"), icon512);

  const href = `data:image/png;base64,${icon64.toString("base64")}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="WirelessCom.Ca">
  <rect width="64" height="64" fill="#ffffff"/>
  <image href="${href}" width="64" height="64"/>
</svg>
`;
  await writeFile(path.join(PUBLIC, "favicon.svg"), svg);

  return {
    icon512: icon512.length,
    icon192: icon192.length,
    icon180: icon180.length,
    icon32: icon32.length,
    ico: ico.length,
  };
}

if (process.argv[1] && process.argv[1].includes("build-app-icons")) {
  const sizes = await writeAppIcons();
  process.stdout.write(
    `  icon.png ${sizes.icon512} bytes\n  icon-192.png ${sizes.icon192} bytes\n  apple-icon.png ${sizes.icon180} bytes\n  favicon.png ${sizes.icon32} bytes\n  favicon.ico ${sizes.ico} bytes\n  favicon.svg written\n`,
  );
}
