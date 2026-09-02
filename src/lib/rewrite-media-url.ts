import { prisma } from "@/lib/prisma";

/**
 * Rewrites every stored reference to an image URL after an admin replaces a
 * shipped file. The new file lives under /uploads so the change survives a
 * container rebuild.
 */

const BUILT_PHOTO =
  /^\/images\/([a-z0-9-]+)-(?:560|900|1400)\.(?:avif|webp)$/;

export function urlVariants(url: string): string[] {
  const variants = new Set([url]);
  const match = BUILT_PHOTO.exec(url);
  if (match) {
    for (const width of [560, 900, 1400] as const) {
      for (const extension of ["webp", "avif"] as const) {
        variants.add(`/images/${match[1]}-${width}.${extension}`);
      }
    }
  }
  return [...variants];
}

function rewriteText(value: string | null | undefined, from: string[], to: string): string | null | undefined {
  if (value == null) return value;
  let next = value;
  for (const variant of from) {
    if (variant && next.includes(variant)) next = next.split(variant).join(to);
  }
  return next;
}

function rewriteJson(value: unknown, from: string[], to: string): { next: unknown; changed: boolean } {
  const encoded = JSON.stringify(value);
  if (!encoded) return { next: value, changed: false };
  let next = encoded;
  for (const variant of from) {
    if (variant && next.includes(variant)) {
      next = next.split(variant).join(to);
    }
  }
  if (next === encoded) return { next: value, changed: false };
  return { next: JSON.parse(next) as unknown, changed: true };
}

export async function rewriteMediaUrl(fromUrl: string, toUrl: string): Promise<number> {
  if (!fromUrl || fromUrl === toUrl) return 0;
  const from = urlVariants(fromUrl);
  let touched = 0;

  const pages = await prisma.page.findMany({
    select: { id: true, blocks: true, ogImageUrl: true, slideshow: true },
  });
  for (const page of pages) {
    const blocks = rewriteJson(page.blocks, from, toUrl);
    const slideshow = rewriteJson(page.slideshow, from, toUrl);
    const og = rewriteText(page.ogImageUrl, from, toUrl);
    if (!blocks.changed && !slideshow.changed && og === page.ogImageUrl) continue;
    await prisma.page.update({
      where: { id: page.id },
      data: {
        ...(blocks.changed ? { blocks: blocks.next as never } : {}),
        ...(slideshow.changed ? { slideshow: slideshow.next as never } : {}),
        ...(og !== page.ogImageUrl ? { ogImageUrl: og ?? null } : {}),
      },
    });
    touched += 1;
  }

  const services = await prisma.service.findMany({
    select: { id: true, blocks: true, imageUrl: true },
  });
  for (const service of services) {
    const blocks = rewriteJson(service.blocks, from, toUrl);
    const imageUrl = rewriteText(service.imageUrl, from, toUrl);
    if (!blocks.changed && imageUrl === service.imageUrl) continue;
    await prisma.service.update({
      where: { id: service.id },
      data: {
        ...(blocks.changed ? { blocks: blocks.next as never } : {}),
        ...(imageUrl !== service.imageUrl ? { imageUrl: imageUrl ?? null } : {}),
      },
    });
    touched += 1;
  }

  const studies = await prisma.caseStudy.findMany({
    select: { id: true, blocks: true, imageUrl: true },
  });
  for (const study of studies) {
    const blocks = rewriteJson(study.blocks, from, toUrl);
    const imageUrl = rewriteText(study.imageUrl, from, toUrl);
    if (!blocks.changed && imageUrl === study.imageUrl) continue;
    await prisma.caseStudy.update({
      where: { id: study.id },
      data: {
        ...(blocks.changed ? { blocks: blocks.next as never } : {}),
        ...(imageUrl !== study.imageUrl ? { imageUrl: imageUrl ?? null } : {}),
      },
    });
    touched += 1;
  }

  const posts = await prisma.post.findMany({
    select: { id: true, blocks: true, coverImageUrl: true },
  });
  for (const post of posts) {
    const blocks = rewriteJson(post.blocks, from, toUrl);
    const coverImageUrl = rewriteText(post.coverImageUrl, from, toUrl);
    if (!blocks.changed && coverImageUrl === post.coverImageUrl) continue;
    await prisma.post.update({
      where: { id: post.id },
      data: {
        ...(blocks.changed ? { blocks: blocks.next as never } : {}),
        ...(coverImageUrl !== post.coverImageUrl
          ? { coverImageUrl: coverImageUrl ?? null }
          : {}),
      },
    });
    touched += 1;
  }

  const brands = await prisma.brand.findMany({ select: { id: true, logoUrl: true } });
  for (const brand of brands) {
    const logoUrl = rewriteText(brand.logoUrl, from, toUrl);
    if (logoUrl === brand.logoUrl) continue;
    await prisma.brand.update({
      where: { id: brand.id },
      data: { logoUrl: logoUrl ?? null },
    });
    touched += 1;
  }

  const testimonials = await prisma.testimonial.findMany({
    select: { id: true, avatarUrl: true },
  });
  for (const row of testimonials) {
    const avatarUrl = rewriteText(row.avatarUrl, from, toUrl);
    if (avatarUrl === row.avatarUrl) continue;
    await prisma.testimonial.update({
      where: { id: row.id },
      data: { avatarUrl: avatarUrl ?? null },
    });
    touched += 1;
  }

  const jobs = await prisma.jobPosting.findMany({
    select: { id: true, attachmentUrl: true },
  });
  for (const job of jobs) {
    const attachmentUrl = rewriteText(job.attachmentUrl, from, toUrl);
    if (attachmentUrl === job.attachmentUrl) continue;
    await prisma.jobPosting.update({
      where: { id: job.id },
      data: { attachmentUrl: attachmentUrl ?? null },
    });
    touched += 1;
  }

  const streams = await prisma.stream.findMany({
    select: { id: true, posterUrl: true },
  });
  for (const stream of streams) {
    const posterUrl = rewriteText(stream.posterUrl, from, toUrl);
    if (posterUrl === stream.posterUrl) continue;
    await prisma.stream.update({
      where: { id: stream.id },
      data: { posterUrl: posterUrl ?? null },
    });
    touched += 1;
  }

  const settings = await prisma.siteSetting.findMany({
    select: { key: true, value: true },
  });
  for (const row of settings) {
    const rewritten = rewriteJson(row.value, from, toUrl);
    if (!rewritten.changed) continue;
    await prisma.siteSetting.update({
      where: { key: row.key },
      data: { value: rewritten.next as never },
    });
    touched += 1;
  }

  return touched;
}
