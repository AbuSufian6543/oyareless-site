import { z } from "zod";

/**
 * Page content is stored as an ordered array of blocks (Postgres JSON).
 * These schemas are the single source of truth: the admin API validates
 * incoming blocks against them, and the renderer switches on `type`.
 */

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

const linkSchema = z.object({
  label: z.string().default("Learn more"),
  href: z.string().default("/contact"),
  style: z.enum(["primary", "secondary", "ghost", "outline"]).default("primary"),
  openInNewTab: z.boolean().default(false),
});

const settingsSchema = z
  .object({
    background: z
      .enum(["white", "light", "dark", "navy", "gradient", "accent", "grid"])
      .default("white"),
    paddingY: z.enum(["none", "sm", "md", "lg", "xl"]).default("lg"),
    width: z.enum(["narrow", "default", "wide", "full"]).default("default"),
    anchor: z.string().default(""),
    align: z.enum(["left", "center", "right"]).default("left"),
  })
  .partial()
  .default({});

const imageSchema = z.object({
  url: z.string().default(""),
  alt: z.string().default(""),
  caption: z.string().default(""),
});

const itemIcon = z
  .enum([
    "shield",
    "network",
    "phone",
    "camera",
    "lock",
    "server",
    "wifi",
    "radio",
    "cable",
    "car",
    "map",
    "cloud",
    "monitor",
    "zap",
    "check",
    "headset",
    "eye",
    "key",
    "database",
    "activity",
    "globe",
    "megaphone",
    "hard-drive",
    "alert",
    "cctv",
    "antenna",
    "award",
    "building",
    "layers",
    "router",
    "shield-check",
    "fingerprint",
    "user-check",
    "mail",
    "bug",
    "siren",
    "segment",
    "backup",
    "assessment",
    "door",
    "gauge",
    "calculator",
    "terminal",
    "search",
    "wrench",
    "support",
    "endpoint",
    "sparkles",
    "cpu",
  ])
  .default("check");

// ---------------------------------------------------------------------------
// Block data schemas
// ---------------------------------------------------------------------------

const heroData = z.object({
  eyebrow: z.string().default(""),
  headline: z.string().default("Headline"),
  subheadline: z.string().default(""),
  backgroundImageUrl: z.string().default(""),
  backgroundImageAlt: z.string().default(""),
  backgroundVideoUrl: z.string().default(""),
  overlayOpacity: z.number().min(0).max(100).default(70),
  variant: z.enum(["dark", "light", "split", "minimal"]).default("dark"),
  height: z.enum(["sm", "md", "lg", "full"]).default("lg"),
  buttons: z.array(linkSchema).default([]),
  highlights: z.array(z.string()).default([]),
});

const headingData = z.object({
  eyebrow: z.string().default(""),
  text: z.string().default("Section heading"),
  level: z.enum(["h1", "h2", "h3"]).default("h2"),
  description: z.string().default(""),
});

const richTextData = z.object({
  /** Sanitised on render; admins may paste formatted copy here. */
  html: z.string().default("<p>Add your content…</p>"),
  columns: z.enum(["1", "2"]).default("1"),
});

const featureItem = z.object({
  icon: itemIcon,
  title: z.string().default("Feature"),
  description: z.string().default(""),
});

const featureGridData = z.object({
  heading: z.string().default(""),
  description: z.string().default(""),
  columns: z.enum(["2", "3", "4"]).default("3"),
  items: z.array(featureItem).default([]),
  style: z.enum(["card", "bordered", "plain", "numbered"]).default("card"),
});

const serviceCardItem = z.object({
  icon: itemIcon,
  title: z.string().default("Service"),
  description: z.string().default(""),
  href: z.string().default(""),
  imageUrl: z.string().default(""),
  imageAlt: z.string().default(""),
  badge: z.string().default(""),
});

const serviceGridData = z.object({
  heading: z.string().default(""),
  description: z.string().default(""),
  columns: z.enum(["2", "3", "4"]).default("3"),
  items: z.array(serviceCardItem).default([]),
});

const imageTextData = z.object({
  eyebrow: z.string().default(""),
  heading: z.string().default(""),
  html: z.string().default(""),
  image: imageSchema.default({ url: "", alt: "", caption: "" }),
  imagePosition: z.enum(["left", "right"]).default("right"),
  buttons: z.array(linkSchema).default([]),
  bullets: z.array(z.string()).default([]),
});

const ctaData = z.object({
  heading: z.string().default("Ready to get started?"),
  description: z.string().default(""),
  buttons: z.array(linkSchema).default([]),
  phone: z.string().default(""),
  variant: z.enum(["banner", "boxed", "split"]).default("banner"),
});

const statItem = z.object({
  value: z.string().default("0"),
  label: z.string().default("Metric"),
  suffix: z.string().default(""),
});

const statsData = z.object({
  heading: z.string().default(""),
  items: z.array(statItem).default([]),
});

const logoStripData = z.object({
  heading: z.string().default("Trusted partners"),
  images: z.array(imageSchema).default([]),
  grayscale: z.boolean().default(false),
});

const faqItem = z.object({
  question: z.string().default("Question"),
  answer: z.string().default("Answer"),
});

const faqData = z.object({
  heading: z.string().default("Frequently asked questions"),
  description: z.string().default(""),
  items: z.array(faqItem).default([]),
});

const testimonialsData = z.object({
  heading: z.string().default("What our clients say"),
  /** Pull from the Testimonial table instead of hard-coding copy. */
  source: z.enum(["database", "inline"]).default("database"),
  limit: z.number().min(1).max(12).default(3),
  items: z
    .array(
      z.object({
        quote: z.string().default(""),
        authorName: z.string().default(""),
        authorRole: z.string().default(""),
        company: z.string().default(""),
        rating: z.number().min(1).max(5).default(5),
      }),
    )
    .default([]),
});

const videoEmbedData = z.object({
  heading: z.string().default(""),
  description: z.string().default(""),
  /** YouTube/Vimeo watch or share URL; converted to an embed on render. */
  url: z.string().default(""),
  aspectRatio: z.enum(["16/9", "4/3", "21/9", "1/1"]).default("16/9"),
});

const liveStreamData = z.object({
  heading: z.string().default(""),
  description: z.string().default(""),
  /** References Stream.slug so the admin can swap sources centrally. */
  streamSlug: z.string().default(""),
  showTitle: z.boolean().default(true),
});

const streamGridData = z.object({
  heading: z.string().default("Live streams"),
  description: z.string().default(""),
  columns: z.enum(["1", "2", "3"]).default("2"),
  /** Empty means "all published streams". */
  slugs: z.array(z.string()).default([]),
  featuredOnly: z.boolean().default(false),
});

const embedData = z.object({
  heading: z.string().default(""),
  description: z.string().default(""),
  /** Raw markup for third-party players, maps, and dashboards. */
  html: z.string().default(""),
  minHeight: z.number().min(120).max(2000).default(480),
});

const contactFormData = z.object({
  heading: z.string().default("Send us a message"),
  description: z.string().default(""),
  formType: z
    .enum(["CONTACT", "SUPPORT", "QUOTE", "CALLBACK"])
    .default("CONTACT"),
  showCompany: z.boolean().default(true),
  showAddress: z.boolean().default(false),
  showServiceInterest: z.boolean().default(false),
  successMessage: z
    .string()
    .default("Thank you — we have received your message and will be in touch."),
});

const specTableData = z.object({
  heading: z.string().default(""),
  description: z.string().default(""),
  columns: z.array(z.string()).default(["Feature", "Detail"]),
  rows: z.array(z.array(z.string())).default([]),
});

const pricingPlan = z.object({
  name: z.string().default("Plan"),
  price: z.string().default(""),
  period: z.string().default("/month"),
  description: z.string().default(""),
  features: z.array(z.string()).default([]),
  highlighted: z.boolean().default(false),
  button: linkSchema.optional(),
});

const pricingData = z.object({
  heading: z.string().default(""),
  description: z.string().default(""),
  plans: z.array(pricingPlan).default([]),
  footnote: z.string().default(""),
});

const galleryData = z.object({
  heading: z.string().default(""),
  description: z.string().default(""),
  images: z.array(imageSchema).default([]),
  columns: z.enum(["2", "3", "4"]).default("3"),
  layout: z.enum(["grid", "carousel"]).default("grid"),
});

const stepItem = z.object({
  title: z.string().default("Step"),
  description: z.string().default(""),
});

const stepsData = z.object({
  heading: z.string().default("How it works"),
  description: z.string().default(""),
  items: z.array(stepItem).default([]),
});

const contactDetailsData = z.object({
  heading: z.string().default("Contact us"),
  showMap: z.boolean().default(true),
  mapEmbedUrl: z.string().default(""),
  extraNote: z.string().default(""),
});

const bannerData = z.object({
  text: z.string().default(""),
  tone: z.enum(["info", "warning", "success", "critical"]).default("info"),
  icon: z.boolean().default(true),
  link: linkSchema.optional(),
});

const downloadItem = z.object({
  title: z.string().default("Document"),
  url: z.string().default(""),
  fileType: z.string().default("pdf"),
  fileSize: z.string().default(""),
});

const downloadsData = z.object({
  heading: z.string().default("Downloads"),
  description: z.string().default(""),
  items: z.array(downloadItem).default([]),
});

const speedTestData = z.object({
  heading: z.string().default("Internet speed test"),
  description: z.string().default(""),
  note: z.string().default(""),
});

const postsData = z.object({
  heading: z.string().default("Latest news"),
  description: z.string().default(""),
  limit: z.number().min(1).max(12).default(3),
  columns: z.enum(["2", "3"]).default("3"),
});

const jobsData = z.object({
  heading: z.string().default("Current openings"),
  description: z.string().default(""),
  emptyMessage: z
    .string()
    .default("There are no open positions right now. Check back soon."),
});

const spacerData = z.object({
  size: z.enum(["sm", "md", "lg", "xl"]).default("md"),
  showDivider: z.boolean().default(false),
});

// ---------------------------------------------------------------------------
// Networking / cybersecurity platform blocks
// ---------------------------------------------------------------------------

const techHeroData = z.object({
  eyebrow: z.string().default(""),
  headline: z.string().default("Headline"),
  subheadline: z.string().default(""),
  /** Optional photo behind the animated mesh. The mesh alone is the default. */
  backgroundImageUrl: z.string().default(""),
  overlayOpacity: z.number().min(0).max(100).default(78),
  /** Node-mesh intensity; 0 disables the animation entirely. */
  networkDensity: z.number().min(0).max(200).default(100),
  height: z.enum(["sm", "md", "lg"]).default("lg"),
  buttons: z.array(linkSchema).default([]),
  /** Short proof points rendered as a row beneath the buttons. */
  highlights: z.array(z.string()).default([]),
});

const pillarItem = z.object({
  icon: itemIcon,
  title: z.string().default("Pillar"),
  description: z.string().default(""),
  href: z.string().default(""),
  /** Comma-free short labels listed under the description. */
  points: z.array(z.string()).default([]),
});

const pillarsData = z.object({
  eyebrow: z.string().default(""),
  heading: z.string().default(""),
  description: z.string().default(""),
  items: z.array(pillarItem).default([]),
});

const capabilityItem = z.object({
  icon: itemIcon,
  title: z.string().default("Capability"),
  description: z.string().default(""),
  href: z.string().default(""),
  imageUrl: z.string().default(""),
  imageAlt: z.string().default(""),
});

const capabilityGridData = z.object({
  eyebrow: z.string().default(""),
  heading: z.string().default(""),
  description: z.string().default(""),
  columns: z.enum(["2", "3"]).default("3"),
  showImages: z.boolean().default(true),
  items: z.array(capabilityItem).default([]),
});

const brandItem = z.object({
  name: z.string().default("Brand"),
  /** Optional logo; a typographic tile is used when empty. */
  logoUrl: z.string().default(""),
  category: z.string().default(""),
  href: z.string().default(""),
});

const brandGridData = z.object({
  eyebrow: z.string().default(""),
  heading: z.string().default(""),
  description: z.string().default(""),
  /**
   * Deliberate wording control: claims about vendor relationships must stay
   * accurate, so the qualifier sits in content rather than in code.
   */
  disclaimer: z
    .string()
    .default("Technologies we deploy and support for our customers."),
  layout: z.enum(["grid", "marquee"]).default("grid"),
  items: z.array(brandItem).default([]),
});

const statusStripData = z.object({
  heading: z.string().default("Network status"),
  description: z.string().default(""),
  /** Link to the full status page. */
  href: z.string().default("/network-status"),
  linkLabel: z.string().default("View full status"),
  /**
   * When true the block reads live probe results. When false it shows only the
   * heading and link, which is what a page should do rather than invent data.
   */
  showLiveData: z.boolean().default(true),
});

const defenseLayer = z.object({
  icon: itemIcon,
  title: z.string().default("Layer"),
  description: z.string().default(""),
  /** Short examples of controls in this layer. */
  controls: z.array(z.string()).default([]),
});

const defenseInDepthData = z.object({
  eyebrow: z.string().default(""),
  heading: z.string().default("Defence in depth"),
  description: z.string().default(""),
  centreLabel: z.string().default("Your data"),
  layers: z.array(defenseLayer).default([]),
  /** Threats the layers are intended to reduce exposure to. */
  threats: z.array(z.string()).default([]),
});

const toolItem = z.object({
  icon: itemIcon,
  title: z.string().default("Tool"),
  description: z.string().default(""),
  href: z.string().default(""),
  badge: z.string().default(""),
});

const toolGridData = z.object({
  eyebrow: z.string().default(""),
  heading: z.string().default(""),
  description: z.string().default(""),
  columns: z.enum(["2", "3", "4"]).default("3"),
  items: z.array(toolItem).default([]),
});

const caseStudyItem = z.object({
  title: z.string().default("Case study"),
  sector: z.string().default(""),
  problem: z.string().default(""),
  solution: z.string().default(""),
  result: z.string().default(""),
  href: z.string().default(""),
  imageUrl: z.string().default(""),
  imageAlt: z.string().default(""),
});

const caseStudyGridData = z.object({
  eyebrow: z.string().default(""),
  heading: z.string().default(""),
  description: z.string().default(""),
  items: z.array(caseStudyItem).default([]),
});

const kbHighlightItem = z.object({
  icon: itemIcon,
  category: z.string().default(""),
  title: z.string().default("Article"),
  description: z.string().default(""),
  href: z.string().default(""),
});

const kbHighlightsData = z.object({
  eyebrow: z.string().default(""),
  heading: z.string().default("Knowledge base"),
  description: z.string().default(""),
  columns: z.enum(["2", "3"]).default("3"),
  items: z.array(kbHighlightItem).default([]),
  buttons: z.array(linkSchema).default([]),
});

// ---------------------------------------------------------------------------
// Discriminated union
// ---------------------------------------------------------------------------

function block<T extends string, S extends z.ZodTypeAny>(type: T, data: S) {
  return z.object({
    id: z.string(),
    type: z.literal(type),
    settings: settingsSchema.optional(),
    data,
  });
}

export const blockSchema = z.discriminatedUnion("type", [
  block("hero", heroData),
  block("heading", headingData),
  block("richText", richTextData),
  block("featureGrid", featureGridData),
  block("serviceGrid", serviceGridData),
  block("imageText", imageTextData),
  block("cta", ctaData),
  block("stats", statsData),
  block("logoStrip", logoStripData),
  block("faq", faqData),
  block("testimonials", testimonialsData),
  block("videoEmbed", videoEmbedData),
  block("liveStream", liveStreamData),
  block("streamGrid", streamGridData),
  block("embed", embedData),
  block("contactForm", contactFormData),
  block("specTable", specTableData),
  block("pricing", pricingData),
  block("gallery", galleryData),
  block("steps", stepsData),
  block("contactDetails", contactDetailsData),
  block("banner", bannerData),
  block("downloads", downloadsData),
  block("speedTest", speedTestData),
  block("posts", postsData),
  block("jobs", jobsData),
  block("spacer", spacerData),
  block("techHero", techHeroData),
  block("pillars", pillarsData),
  block("capabilityGrid", capabilityGridData),
  block("brandGrid", brandGridData),
  block("statusStrip", statusStripData),
  block("defenseInDepth", defenseInDepthData),
  block("toolGrid", toolGridData),
  block("caseStudyGrid", caseStudyGridData),
  block("kbHighlights", kbHighlightsData),
]);

export const blocksSchema = z.array(blockSchema);

export type Block = z.infer<typeof blockSchema>;
export type BlockType = Block["type"];
export type BlockSettings = z.infer<typeof settingsSchema>;
export type LinkItem = z.infer<typeof linkSchema>;

/** Narrow a block union member by type, e.g. `BlockOf<"hero">`. */
export type BlockOf<T extends BlockType> = Extract<Block, { type: T }>;

/**
 * Parses stored JSON, dropping anything that no longer matches the schema so a
 * single bad block cannot take a page down.
 */
export function parseBlocks(value: unknown): Block[] {
  if (!Array.isArray(value)) return [];
  const result: Block[] = [];
  for (const candidate of value) {
    const parsed = blockSchema.safeParse(candidate);
    if (parsed.success) result.push(parsed.data);
  }
  return result;
}

export function newBlockId(): string {
  return `b_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
