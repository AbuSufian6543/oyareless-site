/**
 * Copy the Real-ESRGAN restoration into the image inbox as the office hero master.
 *
 * The Weebly original is 1100x594. A 4x photo restoration lives at
 * `.stock-cache/office-white-oak-x4.png` (gitignored, produced once with
 * realesrgan-x4plus). Derivatives are what get committed.
 *
 *   node scripts/prepare-office-hero.mjs
 *   node scripts/build-site-images.mjs
 */
import { copyFile, mkdir } from "node:fs/promises";
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

async function main() {
  const meta = await sharp(X4).metadata();
  if (meta.width !== 4400 || meta.height !== 2376) {
    throw new Error(
      `Expected 4400x2376 Real-ESRGAN output, got ${meta.width}x${meta.height}`,
    );
  }

  await mkdir(path.dirname(OUT), { recursive: true });
  await copyFile(X4, OUT);
  process.stdout.write(
    `  wrote ${path.relative(ROOT, OUT)} (${meta.width}x${meta.height})\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exit(1);
});
