"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { blocksSchema } from "@/lib/blocks";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "login",
  "news",
  "live",
  "careers",
  "uploads",
  "brand",
  "sitemap.xml",
  "robots.txt",
  "subscription",
  "_next",
]);

const pagePayload = z.object({
  title: z.string().trim().min(1, "A title is required.").max(200),
  slug: z.string().trim().min(1).max(200),
  navLabel: z.string().trim().max(120).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  metaTitle: z.string().trim().max(200).optional().or(z.literal("")),
  metaDescription: z.string().trim().max(400).optional().or(z.literal("")),
  ogImageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  noIndex: z.boolean(),
  showInHeaderNav: z.boolean(),
  showInFooterNav: z.boolean(),
  navOrder: z.number().int().min(0).max(999),
  blocks: z.unknown(),
});

export type SaveResult = { ok: true; slug: string } | { ok: false; error: string };

export async function savePageAction(
  pageId: string,
  payload: unknown,
): Promise<SaveResult> {
  const user = await requireRole("EDITOR").catch(() => null);
  if (!user) return { ok: false, error: "You are not signed in." };

  const parsed = pagePayload.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Some fields are invalid.",
    };
  }

  const data = parsed.data;

  const blocks = blocksSchema.safeParse(data.blocks);
  if (!blocks.success) {
    return {
      ok: false,
      error:
        "Some sections contain invalid values. Check any recently edited section.",
    };
  }

  const existing = await prisma.page.findUnique({ where: { id: pageId } });
  if (!existing) return { ok: false, error: "This page no longer exists." };

  const slug = normaliseSlug(data.slug, existing.slug);
  if (slug !== existing.slug) {
    if (RESERVED_SLUGS.has(slug)) {
      return { ok: false, error: `"${slug}" is reserved. Choose another URL.` };
    }
    const clash = await prisma.page.findUnique({ where: { slug } });
    if (clash) {
      return { ok: false, error: `Another page already uses "/${slug}".` };
    }
  }

  // Snapshot the previous content so a bad edit can be rolled back.
  await prisma.pageRevision
    .create({
      data: {
        pageId,
        title: existing.title,
        blocks: existing.blocks as never,
        authorId: user.id,
        note: "Auto-saved before update",
      },
    })
    .catch(() => undefined);

  const becomingPublished =
    data.status === "PUBLISHED" && existing.status !== "PUBLISHED";

  await prisma.page.update({
    where: { id: pageId },
    data: {
      title: data.title,
      slug,
      navLabel: data.navLabel || null,
      status: data.status,
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      ogImageUrl: data.ogImageUrl || null,
      noIndex: data.noIndex,
      showInHeaderNav: data.showInHeaderNav,
      showInFooterNav: data.showInFooterNav,
      navOrder: data.navOrder,
      blocks: blocks.data as never,
      publishedAt:
        becomingPublished && !existing.publishedAt
          ? new Date()
          : existing.publishedAt,
      authorId: existing.authorId ?? user.id,
    },
  });

  await recordAudit({
    action: becomingPublished ? "page.published" : "page.updated",
    userId: user.id,
    entityType: "Page",
    entityId: pageId,
    summary: `${data.title} (/${slug})`,
  });

  // Keep only the 20 most recent revisions per page.
  await pruneRevisions(pageId);

  revalidatePath("/");
  revalidatePath(`/${slug}`);
  revalidatePath("/admin/pages");

  return { ok: true, slug };
}

export async function createPageAction(formData: FormData): Promise<void> {
  const user = await requireRole("EDITOR");

  const title = String(formData.get("title") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const template = String(formData.get("template") ?? "blank");

  if (!title) redirect("/admin/pages/new?error=title");

  const slug = normaliseSlug(rawSlug || title, "");
  if (RESERVED_SLUGS.has(slug)) redirect("/admin/pages/new?error=reserved");

  const clash = await prisma.page.findUnique({ where: { slug } });
  if (clash) redirect("/admin/pages/new?error=duplicate");

  const page = await prisma.page.create({
    data: {
      title,
      slug,
      status: "DRAFT",
      blocks: templateBlocks(title, template) as never,
      authorId: user.id,
    },
  });

  await recordAudit({
    action: "page.created",
    userId: user.id,
    entityType: "Page",
    entityId: page.id,
    summary: `${title} (/${slug})`,
  });

  redirect(`/admin/pages/${page.id}`);
}

export async function deletePageAction(formData: FormData): Promise<void> {
  const user = await requireRole("ADMIN");
  const pageId = String(formData.get("pageId") ?? "");

  const page = await prisma.page.findUnique({ where: { id: pageId } });
  if (!page) redirect("/admin/pages");

  // System pages back hard-coded routes; they can be edited but not removed.
  if (page.isSystem) redirect("/admin/pages?error=system");

  await prisma.page.delete({ where: { id: pageId } });

  await recordAudit({
    action: "page.deleted",
    userId: user.id,
    entityType: "Page",
    entityId: pageId,
    summary: `${page.title} (/${page.slug})`,
  });

  revalidatePath("/");
  revalidatePath("/admin/pages");
  redirect("/admin/pages?deleted=1");
}

export async function duplicatePageAction(formData: FormData): Promise<void> {
  const user = await requireRole("EDITOR");
  const pageId = String(formData.get("pageId") ?? "");

  const page = await prisma.page.findUnique({ where: { id: pageId } });
  if (!page) redirect("/admin/pages");

  let slug = `${page.slug}-copy`;
  let attempt = 2;
  while (await prisma.page.findUnique({ where: { slug } })) {
    slug = `${page.slug}-copy-${attempt}`;
    attempt += 1;
  }

  const copy = await prisma.page.create({
    data: {
      title: `${page.title} (copy)`,
      slug,
      status: "DRAFT",
      blocks: page.blocks as never,
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      ogImageUrl: page.ogImageUrl,
      authorId: user.id,
    },
  });

  await recordAudit({
    action: "page.created",
    userId: user.id,
    entityType: "Page",
    entityId: copy.id,
    summary: `Duplicated ${page.title}`,
  });

  redirect(`/admin/pages/${copy.id}`);
}

export async function restoreRevisionAction(formData: FormData): Promise<void> {
  const user = await requireRole("EDITOR");
  const revisionId = String(formData.get("revisionId") ?? "");

  const revision = await prisma.pageRevision.findUnique({
    where: { id: revisionId },
    include: { page: true },
  });
  if (!revision) redirect("/admin/pages");

  await prisma.pageRevision.create({
    data: {
      pageId: revision.pageId,
      title: revision.page.title,
      blocks: revision.page.blocks as never,
      authorId: user.id,
      note: "Auto-saved before restore",
    },
  });

  await prisma.page.update({
    where: { id: revision.pageId },
    data: { blocks: revision.blocks as never, title: revision.title },
  });

  await recordAudit({
    action: "page.restored",
    userId: user.id,
    entityType: "Page",
    entityId: revision.pageId,
    summary: `Restored a revision of ${revision.title}`,
  });

  revalidatePath(`/${revision.page.slug}`);
  redirect(`/admin/pages/${revision.pageId}?restored=1`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normaliseSlug(value: string, fallback: string): string {
  const slug = slugify(value);
  return slug || fallback || `page-${Date.now().toString(36)}`;
}

async function pruneRevisions(pageId: string): Promise<void> {
  const stale = await prisma.pageRevision.findMany({
    where: { pageId },
    orderBy: { createdAt: "desc" },
    skip: 20,
    select: { id: true },
  });
  if (stale.length === 0) return;
  await prisma.pageRevision
    .deleteMany({ where: { id: { in: stale.map((item) => item.id) } } })
    .catch(() => undefined);
}

function blockId(): string {
  return `b_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

/** Starter layouts offered on the "new page" screen. */
function templateBlocks(title: string, template: string): unknown[] {
  const hero = {
    id: blockId(),
    type: "hero",
    settings: {},
    data: {
      eyebrow: "WirelessCom.Ca Inc.",
      headline: title,
      subheadline: "",
      variant: "dark",
      height: "md",
      buttons: [
        { label: "Request a quote", href: "/contact", style: "primary", openInNewTab: false },
      ],
      highlights: [],
      backgroundImageUrl: "",
      backgroundVideoUrl: "",
      overlayOpacity: 70,
    },
  };

  const cta = {
    id: blockId(),
    type: "cta",
    settings: { background: "gradient" },
    data: {
      heading: "Talk to a WirelessCom specialist",
      description: "Tell us what you need and we will put together a plan.",
      phone: "1-800-705-3189",
      variant: "banner",
      buttons: [
        { label: "Request a quote", href: "/contact", style: "primary", openInNewTab: false },
      ],
    },
  };

  if (template === "service") {
    return [
      hero,
      {
        id: blockId(),
        type: "richText",
        settings: {},
        data: {
          html: `<p>Introduce the ${title.toLowerCase()} service here.</p>`,
          columns: "1",
        },
      },
      {
        id: blockId(),
        type: "featureGrid",
        settings: { background: "light" },
        data: {
          heading: "What's included",
          description: "",
          columns: "3",
          style: "card",
          items: [
            { icon: "check", title: "Capability one", description: "" },
            { icon: "check", title: "Capability two", description: "" },
            { icon: "check", title: "Capability three", description: "" },
          ],
        },
      },
      cta,
    ];
  }

  if (template === "contact") {
    return [
      hero,
      {
        id: blockId(),
        type: "contactDetails",
        settings: {},
        data: {
          heading: "Contact us",
          showMap: true,
          mapEmbedUrl: "",
          extraNote: "",
        },
      },
      {
        id: blockId(),
        type: "contactForm",
        settings: { background: "light" },
        data: {
          heading: "Send us a message",
          description: "",
          formType: "CONTACT",
          showCompany: true,
          showAddress: false,
          showServiceInterest: true,
          successMessage:
            "Thank you — we have received your message and will be in touch.",
        },
      },
    ];
  }

  if (template === "landing") {
    return [
      { ...hero, data: { ...hero.data, height: "lg" } },
      {
        id: blockId(),
        type: "stats",
        settings: { background: "grid" },
        data: {
          heading: "",
          items: [
            { value: "2005", label: "Serving business since", suffix: "" },
            { value: "24/7", label: "Monitoring & support", suffix: "" },
            { value: "100%", label: "Certified installations", suffix: "" },
          ],
        },
      },
      {
        id: blockId(),
        type: "serviceGrid",
        settings: {},
        data: {
          heading: "How we help",
          description: "",
          columns: "3",
          items: [],
        },
      },
      {
        id: blockId(),
        type: "testimonials",
        settings: { background: "light" },
        data: {
          heading: "What our clients say",
          source: "database",
          limit: 3,
          items: [],
        },
      },
      cta,
    ];
  }

  return [hero];
}
