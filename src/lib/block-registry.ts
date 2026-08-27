import { blockSchema, newBlockId, type Block, type BlockType } from "@/lib/blocks";

export type BlockCategory =
  | "Layout"
  | "Content"
  | "Services"
  | "Networking & Security"
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
    type: "techHero",
    label: "Tech hero (animated)",
    description:
      "Hero with an animated network mesh, optional photo, buttons and proof points.",
    category: "Layout",
    icon: "Radar",
    seed: {
      eyebrow: "WirelessCom.Ca Inc.",
      headline: "Networks and security built to stay up",
      subheadline:
        "Design, installation and ongoing support for business networking, cybersecurity, telecom and security systems across Northern Ontario.",
      buttons: [
        { label: "Request a quote", href: "/request-quote", style: "primary" },
        { label: "Talk to an engineer", href: "/contact", style: "outline" },
      ],
      highlights: [
        "Serving business since 2005",
        "Sault Ste. Marie based technicians",
        "24/7 monitoring available",
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
  {
    type: "pillars",
    label: "Service pillars",
    description: "Four columns for Data, Voice, Video and Security.",
    category: "Networking & Security",
    icon: "Columns4",
    seed: {
      eyebrow: "What we do",
      heading: "Four pillars, one provider",
      description:
        "Most sites need all four. Buying them from one team means they are designed to work together.",
      items: [
        {
          icon: "network",
          title: "Data",
          description: "Wired and wireless networks that hold up under load.",
          points: ["Switching & routing", "Wi-Fi design & surveys", "Fibre & structured cabling"],
          href: "/networking",
        },
        {
          icon: "phone",
          title: "Voice",
          description: "Business phone systems and two-way radio.",
          points: ["Hosted & on-premise PBX", "SIP trunking", "Hytera two-way radio"],
          href: "/two-way-radio",
        },
        {
          icon: "cctv",
          title: "Video",
          description: "Surveillance you can actually review after an incident.",
          points: ["IP camera systems", "Recording & retention", "Remote viewing"],
          href: "/security-services",
        },
        {
          icon: "shield-check",
          title: "Security",
          description: "Layered protection for the network and the building.",
          points: ["Firewalls & segmentation", "Endpoint protection", "Alarms & access control"],
          href: "/cybersecurity",
        },
      ],
    },
  },
  {
    type: "capabilityGrid",
    label: "Capability cards",
    description: "Photo-led cards for core capabilities, three across.",
    category: "Networking & Security",
    icon: "LayoutPanelTop",
    seed: {
      eyebrow: "Capabilities",
      heading: "What we design, install and support",
      items: [
        {
          icon: "network",
          title: "Business networking",
          description: "Switching, routing, VLAN segmentation and secure remote access.",
          href: "/networking",
        },
        {
          icon: "wifi",
          title: "Wireless & Wi-Fi",
          description: "Site surveys, access point placement and interference remediation.",
          href: "/networking",
        },
        {
          icon: "lock",
          title: "Cybersecurity",
          description: "Firewalls, endpoint protection, patching and security assessments.",
          href: "/cybersecurity",
        },
        {
          icon: "cctv",
          title: "Video surveillance",
          description: "IP cameras, recorders, retention planning and remote viewing.",
          href: "/security-services",
        },
        {
          icon: "siren",
          title: "Alarm & access control",
          description: "Intrusion detection, door controllers and credential management.",
          href: "/security-services",
        },
        {
          icon: "radio",
          title: "Two-way radio",
          description: "Hytera portables, repeaters and licensing support.",
          href: "/two-way-radio",
        },
        {
          icon: "antenna",
          title: "Cellular coverage",
          description: "SureCall boosters and DAS for buildings with dead zones.",
          href: "/internet-services",
        },
        {
          icon: "support",
          title: "Managed IT & support",
          description: "Monitoring, helpdesk and on-site response.",
          href: "/it-services",
        },
        {
          icon: "endpoint",
          title: "Remote support",
          description: "Screen-sharing support sessions over RustDesk.",
          href: "/remote-support",
        },
      ],
    },
  },
  {
    type: "brandGrid",
    label: "Brand / vendor grid",
    description: "Vendor tiles in a grid or looping marquee, with a qualifier line.",
    category: "Networking & Security",
    icon: "Boxes",
    seed: {
      heading: "Technologies we deploy and support",
      disclaimer:
        "Vendor names are listed to describe the equipment we install and support. They do not imply endorsement unless stated.",
      items: [
        { name: "Hytera", category: "Two-way radio" },
        { name: "Ubiquiti", category: "Networking & Wi-Fi" },
        { name: "Tait Communications", category: "Critical comms" },
        { name: "SureCall", category: "Cellular boosters" },
        { name: "Genetec", category: "Access control" },
        { name: "Rogers", category: "Connectivity" },
      ],
    },
  },
  {
    type: "statusStrip",
    label: "Live status strip",
    description:
      "Shows real probe results for monitored endpoints, or says so when none are configured.",
    category: "Dynamic",
    icon: "Activity",
    seed: {
      heading: "Network status",
      href: "/network-status",
      linkLabel: "View full status",
    },
  },
  {
    type: "defenseInDepth",
    label: "Defence in depth",
    description: "Concentric security layers with the controls in each and a threat list.",
    category: "Networking & Security",
    icon: "ShieldHalf",
    seed: {
      eyebrow: "Our approach",
      heading: "Defence in depth",
      description:
        "No single control stops everything. Layering them means one failure does not become a breach.",
      centreLabel: "Your data",
      layers: [
        {
          icon: "user-check",
          title: "People",
          description: "The layer attackers target first.",
          controls: ["Security awareness", "Phishing simulation", "Clear reporting path"],
        },
        {
          icon: "door",
          title: "Perimeter",
          description: "Filtering traffic before it reaches your network.",
          controls: ["Next-gen firewall", "DNS filtering", "Email security"],
        },
        {
          icon: "segment",
          title: "Network",
          description: "Limiting how far an intruder can move.",
          controls: ["VLAN segmentation", "Least-privilege ACLs", "Secure remote access"],
        },
        {
          icon: "endpoint",
          title: "Endpoint",
          description: "Detecting and containing activity on devices.",
          controls: ["EDR", "Patch management", "Disk encryption"],
        },
        {
          icon: "backup",
          title: "Data & recovery",
          description: "Making an incident survivable.",
          controls: ["Offsite backups", "Immutable copies", "Restore testing"],
        },
      ],
      threats: [
        "Ransomware",
        "Business email compromise",
        "Credential theft",
        "Phishing",
        "Unpatched vulnerabilities",
        "Insider mistakes",
        "Lost or stolen devices",
      ],
    },
  },
  {
    type: "toolGrid",
    label: "Tool directory",
    description: "Compact cards linking to the network and security tools.",
    category: "Networking & Security",
    icon: "Wrench",
    seed: {
      eyebrow: "Free tools",
      heading: "Diagnose it yourself",
      items: [
        {
          icon: "gauge",
          title: "Internet speed test",
          description: "Measure download, upload, ping and jitter from your browser.",
          href: "/speed-test",
        },
        {
          icon: "search",
          title: "DNS lookup",
          description: "A, AAAA, MX, TXT, NS, CNAME and PTR records.",
          href: "/network-tools#dns",
        },
        {
          icon: "calculator",
          title: "Subnet calculator",
          description: "IPv4 and IPv6 CIDR maths, entirely in your browser.",
          href: "/network-tools#subnet",
        },
        {
          icon: "shield-check",
          title: "Security headers check",
          description: "See which protective headers a site is missing.",
          href: "/cybersecurity-tools#headers",
        },
        {
          icon: "key",
          title: "Password strength",
          description: "Checked locally — nothing you type is transmitted.",
          href: "/cybersecurity-tools#password",
        },
        {
          icon: "mail",
          title: "SPF, DKIM & DMARC",
          description: "Verify the DNS records that stop email spoofing.",
          href: "/cybersecurity-tools#email",
        },
      ],
    },
  },
  {
    type: "caseStudyGrid",
    label: "Case studies",
    description: "Problem, solution and result cards with optional photos.",
    category: "Networking & Security",
    icon: "FileText",
    seed: {
      eyebrow: "Case studies",
      heading: "How this works in practice",
      items: [
        {
          sector: "Manufacturing",
          title: "Replacing a flat network across a production site",
          problem: "One flat network meant a single infected PC could reach the plant floor.",
          solution: "Segmented VLANs, a next-gen firewall and monitored switching.",
          result: "Office and production traffic are now isolated from each other.",
        },
        {
          sector: "Municipal",
          title: "Wireless coverage across a spread-out facility",
          problem: "Staff lost connectivity moving between buildings.",
          solution: "A site survey, repositioned access points and a licensed backhaul link.",
          result: "Continuous coverage across the whole site.",
        },
      ],
    },
  },
  {
    type: "kbHighlights",
    label: "Knowledge base highlights",
    description: "Featured how-to articles with a link to the full library.",
    category: "Networking & Security",
    icon: "BookOpen",
    seed: {
      eyebrow: "Knowledge base",
      heading: "Guides and how-tos",
      items: [
        {
          icon: "wifi",
          category: "Networking",
          title: "Why your Wi-Fi slows down in the afternoon",
          description: "Channel contention, client density and what actually helps.",
          href: "/knowledge-base",
        },
        {
          icon: "lock",
          category: "Security",
          title: "Multi-factor authentication, explained simply",
          description: "What it stops, what it does not, and where to start.",
          href: "/knowledge-base",
        },
        {
          icon: "support",
          category: "Support",
          title: "How to start a remote support session",
          description: "Downloading RustDesk and sharing your Support ID safely.",
          href: "/remote-support",
        },
      ],
      buttons: [
        { label: "Browse the knowledge base", href: "/knowledge-base", style: "primary" },
      ],
    },
  },
];

export const BLOCK_CATEGORIES: BlockCategory[] = [
  "Layout",
  "Content",
  "Services",
  "Networking & Security",
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
