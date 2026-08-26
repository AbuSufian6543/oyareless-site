import { blockSchema, newBlockId, type Block, type BlockType } from "@/lib/blocks";

export type BlockCategory =
  | "Layout"
  | "Content"
  | "Services"
  | "Media & Live"
  | "Conversion"
  | "Dynamic";

export type BlockDefinition = {
  type: BlockType;
  label: string;
  description: string;
  category: BlockCategory;
  icon: string;
  /** Starter content so a freshly added section never renders empty. */
  seed?: Record<string, unknown>;
};

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    type: "hero",
    label: "Hero banner",
    description: "Full-width headline with background image and buttons.",
    category: "Layout",
    icon: "LayoutTemplate",
    seed: {
      eyebrow: "WirelessCom.Ca Inc.",
      headline: "Technology Service Provider",
      subheadline:
        "Networking, cybersecurity, telecom, and security systems for businesses across Northern Ontario.",
      buttons: [
        { label: "Request a quote", href: "/contact", style: "primary" },
        { label: "Call 1-800-705-3189", href: "tel:18007053189", style: "outline" },
      ],
    },
  },
  {
    type: "heading",
    label: "Section heading",
    description: "Eyebrow, heading, and short intro paragraph.",
    category: "Layout",
    icon: "Heading",
  },
  {
    type: "spacer",
    label: "Spacer / divider",
    description: "Vertical spacing with an optional divider line.",
    category: "Layout",
    icon: "SeparatorHorizontal",
  },
  {
    type: "richText",
    label: "Rich text",
    description: "Formatted paragraphs, lists, and links.",
    category: "Content",
    icon: "AlignLeft",
  },
  {
    type: "imageText",
    label: "Image + text",
    description: "Two-column image beside copy with bullets and buttons.",
    category: "Content",
    icon: "Columns2",
    seed: {
      heading: "Built for reliability",
      html: "<p>Describe the service in a short paragraph.</p>",
      bullets: ["Key benefit one", "Key benefit two", "Key benefit three"],
    },
  },
  {
    type: "featureGrid",
    label: "Feature grid",
    description: "Icon cards for capabilities or inclusions.",
    category: "Services",
    icon: "Grid3x3",
    seed: {
      heading: "What's included",
      items: [
        { icon: "shield", title: "Layered security", description: "Firewall, endpoint, and monitoring." },
        { icon: "network", title: "Network design", description: "VLAN segmentation and secure Wi-Fi." },
        { icon: "headset", title: "Local support", description: "Sault Ste. Marie based technicians." },
      ],
    },
  },
  {
    type: "serviceGrid",
    label: "Service cards",
    description: "Linked cards for service pages.",
    category: "Services",
    icon: "LayoutGrid",
    seed: {
      heading: "Our services",
      items: [
        { icon: "server", title: "IT Services", description: "Infrastructure, servers, and endpoints.", href: "/it-services" },
        { icon: "lock", title: "Cybersecurity", description: "Firewalls, EDR, and assessments.", href: "/cybersecurity" },
        { icon: "camera", title: "Security Systems", description: "CCTV, alarms, and access control.", href: "/security-services" },
      ],
    },
  },
  {
    type: "steps",
    label: "Process steps",
    description: "Numbered steps describing how you work.",
    category: "Services",
    icon: "ListOrdered",
    seed: {
      items: [
        { title: "Assess", description: "We review your current environment." },
        { title: "Design", description: "We propose a right-sized solution." },
        { title: "Deploy", description: "We install and configure everything." },
        { title: "Support", description: "We monitor and maintain it." },
      ],
    },
  },
  {
    type: "specTable",
    label: "Specification table",
    description: "Comparison or spec sheet table.",
    category: "Services",
    icon: "Table",
    seed: {
      columns: ["Specification", "Detail"],
      rows: [
        ["Power output", "40A, 10 kW"],
        ["Connector", "J1772"],
      ],
    },
  },
  {
    type: "pricing",
    label: "Pricing / plans",
    description: "Plan cards with feature lists.",
    category: "Services",
    icon: "CreditCard",
  },
  {
    type: "stats",
    label: "Statistics",
    description: "Headline numbers such as years in business.",
    category: "Content",
    icon: "TrendingUp",
    seed: {
      items: [
        { value: "2005", label: "Serving business since" },
        { value: "24/7", label: "Monitoring & support" },
        { value: "100%", label: "ESA certified installs" },
      ],
    },
  },
  {
    type: "logoStrip",
    label: "Partner logos",
    description: "Row of manufacturer or certification logos.",
    category: "Content",
    icon: "Building2",
  },
  {
    type: "gallery",
    label: "Image gallery",
    description: "Grid or carousel of photos.",
    category: "Media & Live",
    icon: "Images",
  },
  {
    type: "videoEmbed",
    label: "Video embed",
    description: "YouTube or Vimeo player from a share link.",
    category: "Media & Live",
    icon: "Video",
  },
  {
    type: "liveStream",
    label: "Live stream player",
    description: "Embed one stream managed under Live Streams.",
    category: "Media & Live",
    icon: "Radio",
  },
  {
    type: "streamGrid",
    label: "Live stream grid",
    description: "Show several live cameras or broadcasts at once.",
    category: "Media & Live",
    icon: "MonitorPlay",
  },
  {
    type: "embed",
    label: "Custom embed / iframe",
    description: "Paste any third-party player, map, or dashboard markup.",
    category: "Media & Live",
    icon: "Code",
  },
  {
    type: "cta",
    label: "Call to action",
    description: "Prompt with buttons and a phone number.",
    category: "Conversion",
    icon: "Megaphone",
    seed: {
      heading: "Talk to a WirelessCom specialist",
      description: "Tell us what you need and we will put together a plan.",
      phone: "1-800-705-3189",
      buttons: [{ label: "Request a quote", href: "/contact", style: "primary" }],
    },
  },
  {
    type: "contactForm",
    label: "Form",
    description: "Contact, support, quote, or callback form.",
    category: "Conversion",
    icon: "Mail",
  },
  {
    type: "faq",
    label: "FAQ accordion",
    description: "Expandable questions and answers.",
    category: "Conversion",
    icon: "CircleHelp",
  },
  {
    type: "testimonials",
    label: "Testimonials",
    description: "Client quotes, from the database or typed inline.",
    category: "Conversion",
    icon: "Quote",
  },
  {
    type: "banner",
    label: "Notice banner",
    description: "Inline alert for outages or important notes.",
    category: "Conversion",
    icon: "TriangleAlert",
  },
  {
    type: "contactDetails",
    label: "Contact details + map",
    description: "Address, phone, email, and an embedded map.",
    category: "Conversion",
    icon: "MapPin",
  },
  {
    type: "downloads",
    label: "File downloads",
    description: "List of PDFs and documents.",
    category: "Content",
    icon: "Download",
  },
  {
    type: "speedTest",
    label: "Internet speed test",
    description: "Built-in download/upload speed measurement.",
    category: "Dynamic",
    icon: "Gauge",
  },
  {
    type: "posts",
    label: "Latest news",
    description: "Automatically lists recent published posts.",
    category: "Dynamic",
    icon: "Newspaper",
  },
  {
    type: "jobs",
    label: "Job openings",
    description: "Automatically lists published job postings.",
    category: "Dynamic",
    icon: "Briefcase",
  },
];

export const BLOCK_CATEGORIES: BlockCategory[] = [
  "Layout",
  "Content",
  "Services",
  "Media & Live",
  "Conversion",
  "Dynamic",
];

const definitionByType = new Map(
  BLOCK_DEFINITIONS.map((definition) => [definition.type, definition]),
);

export function getBlockDefinition(type: BlockType): BlockDefinition | undefined {
  return definitionByType.get(type);
}

export function blockLabel(type: BlockType): string {
  return definitionByType.get(type)?.label ?? type;
}

/**
 * Builds a new block with schema defaults, then layers the registry seed on
 * top. Defaults live in the zod schema so they cannot drift out of sync.
 */
export function createBlock(type: BlockType): Block {
  const definition = definitionByType.get(type);
  const parsed = blockSchema.safeParse({
    id: newBlockId(),
    type,
    data: definition?.seed ?? {},
    settings: {},
  });

  if (parsed.success) return parsed.data;

  // A seed that fails validation should not block the editor.
  const fallback = blockSchema.safeParse({
    id: newBlockId(),
    type,
    data: {},
    settings: {},
  });
  if (fallback.success) return fallback.data;

  throw new Error(`Unable to construct block of type "${type}"`);
}
