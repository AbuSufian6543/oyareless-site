/**
 * Shared pixel helpers for service photos and app icons: flatten onto white,
 * fill a thin uniform letterbox (not a dark photograph), and stamp the
 * WirelessCom lockup in the centre.
 */
import sharp from "sharp";

export function luma(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function flattenOntoWhite(rgba) {
  for (let i = 0; i < rgba.length; i += 4) {
    const alpha = rgba[i + 3] / 255;
    if (alpha >= 0.999) {
      rgba[i + 3] = 255;
      continue;
    }
    const inv = 1 - alpha;
    rgba[i] = Math.round(rgba[i] * alpha + 255 * inv);
    rgba[i + 1] = Math.round(rgba[i + 1] * alpha + 255 * inv);
    rgba[i + 2] = Math.round(rgba[i + 2] * alpha + 255 * inv);
    rgba[i + 3] = 255;
  }
}

function cornerLumas(rgba, width, height) {
  const pts = [
    [2, 2],
    [width - 3, 2],
    [2, height - 3],
    [width - 3, height - 3],
  ];
  return pts.map(([x, y]) => {
    const i = (y * width + x) * 4;
    return luma(rgba[i], rgba[i + 1], rgba[i + 2]);
  });
}

function collectDarkEdgeRegion(rgba, width, height, maxLuma) {
  const seen = new Uint8Array(width * height);
  const stack = [];

  const seed = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (seen[idx]) return;
    const i = idx * 4;
    if (luma(rgba[i], rgba[i + 1], rgba[i + 2]) > maxLuma) return;
    seen[idx] = 1;
    stack.push(idx);
  };

  for (let x = 0; x < width; x += 1) {
    seed(x, 0);
    seed(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    seed(0, y);
    seed(width - 1, y);
  }

  let count = 0;
  let sum = 0;
  let sumSq = 0;
  let nearEdge = 0;
  const marginX = Math.max(8, Math.round(width * 0.12));
  const marginY = Math.max(8, Math.round(height * 0.12));

  while (stack.length > 0) {
    const idx = stack.pop();
    const x = idx % width;
    const y = (idx - x) / width;
    const i = idx * 4;
    const value = luma(rgba[i], rgba[i + 1], rgba[i + 2]);
    count += 1;
    sum += value;
    sumSq += value * value;
    if (x < marginX || x >= width - marginX || y < marginY || y >= height - marginY) {
      nearEdge += 1;
    }
    seed(x + 1, y);
    seed(x - 1, y);
    seed(x, y + 1);
    seed(x, y - 1);
  }

  return { seen, count, sum, sumSq, nearEdge };
}

/**
 * True only for a thin, uniform letterbox or studio frame — not a dark wall
 * in a real photograph. Digital Marketing 2 is the canonical counterexample:
 * near-black corners with textured brick that must not be flood-filled.
 */
export function isUniformLetterbox(coverage, variance, mean, nearEdgeRatio) {
  return (
    coverage > 0.004 &&
    coverage <= 0.22 &&
    variance <= 4 &&
    mean <= 3 &&
    nearEdgeRatio >= 0.97
  );
}

/**
 * If every corner is a near-black studio or letterbox, flood-fill that
 * connected backdrop to white. Stops at real photo/product pixels.
 */
export function fillDarkBackdrop(rgba, width, height, maxLuma = 16) {
  const corners = cornerLumas(rgba, width, height);
  if (!corners.every((value) => value <= maxLuma + 6)) return false;

  const region = collectDarkEdgeRegion(rgba, width, height, maxLuma);
  if (region.count === 0) return false;

  const coverage = region.count / (width * height);
  const mean = region.sum / region.count;
  const variance = region.sumSq / region.count - mean * mean;
  const nearEdgeRatio = region.nearEdge / region.count;
  if (!isUniformLetterbox(coverage, variance, mean, nearEdgeRatio)) return false;

  for (let idx = 0; idx < region.seen.length; idx += 1) {
    if (!region.seen[idx]) continue;
    const i = idx * 4;
    rgba[i] = 255;
    rgba[i + 1] = 255;
    rgba[i + 2] = 255;
    rgba[i + 3] = 255;
  }

  return true;
}

export async function withOpacity(png, opacity) {
  const alpha = Math.round(255 * opacity);
  return sharp(png)
    .ensureAlpha()
    .composite([
      {
        input: Buffer.from([255, 255, 255, alpha]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();
}

/**
 * Centre the full WirelessCom lockup. A faint white copy sits underneath so
 * the colour logo still reads on dark photography.
 */
export async function watermarkCenter(rgba, width, height, logoPng, logoInversePng) {
  const logo = sharp(logoPng);
  const meta = await logo.metadata();
  const ratio = (meta.height ?? 1) / (meta.width ?? 1);
  let stampWidth = Math.round(width * 0.5);
  let stampHeight = Math.round(stampWidth * ratio);
  const maxHeight = Math.round(height * 0.2);
  if (stampHeight > maxHeight) {
    stampHeight = maxHeight;
    stampWidth = Math.round(stampHeight / ratio);
  }
  stampWidth = Math.max(72, stampWidth);
  stampHeight = Math.max(16, Math.round(stampWidth * ratio));

  const colour = await sharp(logoPng)
    .resize({ width: stampWidth, height: stampHeight, fit: "inside" })
    .png()
    .toBuffer();
  const halo = await sharp(logoInversePng)
    .resize({
      width: Math.round(stampWidth * 1.04),
      height: Math.round(stampHeight * 1.04),
      fit: "inside",
    })
    .png()
    .toBuffer();

  const colourFade = await withOpacity(colour, 0.72);
  const haloFade = await withOpacity(halo, 0.4);
  const haloMeta = await sharp(haloFade).metadata();
  const colourMeta = await sharp(colourFade).metadata();
  const haloW = haloMeta.width ?? stampWidth;
  const haloH = haloMeta.height ?? stampHeight;
  const colourW = colourMeta.width ?? stampWidth;
  const colourH = colourMeta.height ?? stampHeight;

  return sharp(rgba, {
    raw: { width, height, channels: 4 },
  })
    .composite([
      {
        input: haloFade,
        left: Math.round((width - haloW) / 2),
        top: Math.round((height - haloH) / 2),
        blend: "over",
      },
      {
        input: colourFade,
        left: Math.round((width - colourW) / 2),
        top: Math.round((height - colourH) / 2),
        blend: "over",
      },
    ]);
}

export async function prepareServiceBitmap(inputPath, logoPng, logoInversePng, { maxEdge = 1600 } = {}) {
  const image = sharp(inputPath, { failOn: "none", animated: false }).rotate();
  const meta = await image.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) throw new Error(`Could not read ${inputPath}`);

  const resized =
    Math.max(width, height) > maxEdge
      ? image.resize({
          width: width >= height ? maxEdge : undefined,
          height: height > width ? maxEdge : undefined,
          fit: "inside",
          withoutEnlargement: true,
          kernel: sharp.kernel.lanczos3,
        })
      : image;

  const { data, info } = await resized
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = Buffer.from(data);
  flattenOntoWhite(rgba);
  fillDarkBackdrop(rgba, info.width, info.height, 16);
  return watermarkCenter(rgba, info.width, info.height, logoPng, logoInversePng);
}
