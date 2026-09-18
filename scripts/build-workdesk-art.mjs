/**
 * Fit the three workdesk illustrations onto matching 4:3 cards.
 * Sources live in assets/workdesk (the three illustrations sent for the workdesk).
 *
 *   node scripts/build-workdesk-art.mjs
 */
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "assets", "workdesk");
const OUT = path.join(ROOT, "public", "workdesk");

const WIDTH = 960;
const HEIGHT = 720;
const PAD = 52;

const JOBS = [
  {
    src: "rack.jpg",
    dest: "rack.png",
    bg: { r: 255, g: 255, b: 255 },
  },
  {
    src: "engineering.png",
    dest: "engineering.png",
    bg: { r: 251, g: 83, b: 57 },
    coverText: { top: 36, bottom: 96, color: { r: 251, g: 83, b: 57 } },
    fillFrame: true,
  },
  {
    src: "bench.jpg",
    dest: "bench.png",
    bg: { r: 255, g: 255, b: 255 },
  },
];

const STALE = [
  "tech-boy-scene.png",
  "tech-boy-avatar.png",
  "tech-girl-scene.png",
  "tech-girl-avatar.png",
  "tech-neutral-scene.png",
];

async function coverBand(file, band) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let y = band.top; y < Math.min(band.bottom, info.height); y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const i = (y * info.width + x) * 4;
      data[i] = band.color.r;
      data[i + 1] = band.color.g;
      data[i + 2] = band.color.b;
      data[i + 3] = 255;
    }
  }
  return sharp(Buffer.from(data), {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png().toBuffer();
}

async function fitCard(job) {
  const input = path.join(SRC, job.src);
  let buffer = job.coverText ? await coverBand(input, job.coverText) : await sharp(input).png().toBuffer();
  if (job.fillFrame) {
    const meta = await sharp(buffer).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    const top = job.coverText?.bottom ?? 0;
    const cropHeight = Math.min(Math.round(width * (HEIGHT / WIDTH)), height - top);
    buffer = await sharp(buffer)
      .extract({ left: 0, top, width, height: cropHeight })
      .png()
      .toBuffer();
  }
  const art = await sharp(buffer)
    .resize({
      width: WIDTH - PAD * 2,
      height: HEIGHT - PAD * 2,
      fit: "inside",
      kernel: "lanczos3",
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 3,
      background: job.bg,
    },
  })
    .composite([{ input: art, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, job.dest));
}

await mkdir(OUT, { recursive: true });
for (const job of JOBS) {
  await fitCard(job);
  console.log("wrote", job.dest);
}
for (const name of STALE) {
  await unlink(path.join(OUT, name)).catch(() => undefined);
}
console.log("removed previous male/female technician art");
