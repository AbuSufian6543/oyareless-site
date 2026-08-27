/**
 * Page content migrated from the legacy wirelesscom.org site, expressed as
 * blocks so every word stays editable in the admin page builder.
 */

import { blocksSchema, type Block } from "../src/lib/blocks";

type BlockInput = {
  type: Block["type"];
  data: Record<string, unknown>;
  settings?: Record<string, unknown>;
};

export type SeedPage = {
  slug: string;
  title: string;
  navLabel?: string;
  metaTitle?: string;
  metaDescription: string;
  showInHeaderNav?: boolean;
  showInFooterNav?: boolean;
  navOrder?: number;
  isSystem?: boolean;
  blocks: BlockInput[];
};

const PHONE = "1-800-705-3189";

function photo(name: string, alt: string) {
  return { url: `/images/${name}-1400.webp`, alt };
}

/** Section photography used on the home Services grid and each service page. */
const photos = {
  it: photo(
    "server-rack",
    "Row of rack-mounted enterprise servers in a dark data center aisle lit by blue status indicators",
  ),
  cybersecurity: photo(
    "cybersecurity",
    "Abstract shield formed from connected cyan nodes and lines over a dark navy grid",
  ),
  firewall: photo(
    "firewall",
    "Rack-mounted next-generation firewall appliances in a dark cabinet with cyan status lights and dressed ethernet",
  ),
  security: photo(
    "surveillance",
    "Dome and bullet security cameras mounted under the soffit of a modern commercial building at dusk",
  ),
  ai: photo(
    "ai-camera",
    "IP dome camera in the foreground with a security monitor showing cyan AI detection overlays on a night-time scene",
  ),
  telephone: photo(
    "voip",
    "Black executive VoIP desk phone with a color display on a dark office desk",
  ),
  internet: photo(
    "wifi",
    "White enterprise Wi-Fi access point mounted on a dark office ceiling with a blue status ring",
  ),
  access: photo(
    "access-control",
    "Slim black card reader with a cyan LED beside a glass commercial entrance at dusk",
  ),
  cabling: photo(
    "cabling-install",
    "Technician's hands terminating blue and white network cables into a rack-mounted patch panel",
  ),
  video: photo(
    "video-broadcast",
    "Professional video cameras on tripods in a dark studio with cyan rim lighting",
  ),
  ev: photo(
    "ev-charging",
    "Wall-mounted Level 2 EV charging station with a cyan status light on a dark commercial wall",
  ),
  radio: photo(
    "two-way-radio",
    "Three rugged professional handheld two-way radios on a dark surface with blue rim lighting",
  ),
  fleet: photo(
    "fleet-tracking",
    "GPS tracker unit in the foreground with a commercial pickup truck in a dusk lot behind",
  ),
  signage: photo(
    "digital-signage",
    "Large digital signage display in a dark modern lobby showing an abstract navy and cyan graphic",
  ),
  support: photo(
    "remote-support",
    "Support technician wearing a headset at a desk with two monitors showing dashboards, seen from behind",
  ),
  contact: photo(
    "networking",
    "Dense bundles of blue and gray network patch cables terminated into a switch",
  ),
};

function quoteButtons(label = "Request a quote") {
  return [
    { label, href: "/request-quote", style: "primary", openInNewTab: false },
    { label: `Call ${PHONE}`, href: `tel:${PHONE}`, style: "outline", openInNewTab: false },
  ];
}

/** Standard closing call-to-action reused across the service pages. */
function closingCta(heading: string, description: string): BlockInput {
  return {
    type: "cta",
    settings: { background: "gradient", paddingY: "lg" },
    data: {
      heading,
      description,
      phone: PHONE,
      variant: "banner",
      buttons: [
        { label: "Request a quote", href: "/request-quote", style: "primary", openInNewTab: false },
      ],
    },
  };
}

function serviceHero(
  eyebrow: string,
  headline: string,
  subheadline: string,
  highlights: string[] = [],
  image?: { url: string; alt: string },
): BlockInput {
  return {
    type: "hero",
    settings: {},
    data: {
      eyebrow,
      headline,
      subheadline,
      variant: image ? "split" : "dark",
      height: "md",
      overlayOpacity: 78,
      backgroundImageUrl: image?.url ?? "",
      backgroundImageAlt: image?.alt ?? "",
      buttons: quoteButtons(),
      highlights,
    },
  };
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

const home: SeedPage = {
  slug: "home",
  title: "Home",
  navLabel: "Home",
  metaTitle: "IT, Networking, Cybersecurity & Security Systems in Northern Ontario",
  metaDescription:
    "WirelessCom.Ca Inc. delivers managed IT, cybersecurity, Barracuda, Fortinet, and Juniper firewalls, AI camera analytics, VoIP with AI attendants, video surveillance, and alarm security to businesses across Northern Ontario. Serving Sault Ste. Marie since 2005.",
  showInHeaderNav: true,
  navOrder: 0,
  isSystem: true,
  blocks: [
    {
      type: "techHero",
      settings: {},
      data: {
        eyebrow: "Technology Service Provider · Sault Ste. Marie, Ontario",
        headline: "IT, networks and security that keep your business running",
        subheadline:
          "WirelessCom.Ca Inc. designs, installs and manages the technology Northern Ontario businesses depend on — from firewalls and servers to cameras, access control and VoIP telephone systems.",
        backgroundImageUrl: "",
        overlayOpacity: 78,
        networkDensity: 100,
        height: "lg",
        buttons: [
          { label: "Request a quote", href: "/request-quote", style: "primary", openInNewTab: false },
          { label: "Talk to support", href: "/support", style: "outline", openInNewTab: false },
        ],
        highlights: [
          "Serving businesses since 2005",
          "Windows & macOS environments",
          "24/7 monitored alarm & video",
          "Certified, permitted installations",
        ],
      },
    },
    {
      type: "pillars",
      settings: { background: "white", paddingY: "xl" },
      data: {
        eyebrow: "What we do",
        heading: "Four pillars, one provider",
        description:
          "Most sites need all four. Buying them from one team means they are designed, installed and supported to work together.",
        items: [
          {
            icon: "network",
            title: "Data",
            description: "Wired and wireless networks that hold up under load.",
            points: [
              "Switching, routing and VLAN segmentation",
              "Wi-Fi design and site surveys",
              "Structured cabling and fiber",
            ],
            href: "/it-services",
          },
          {
            icon: "phone",
            title: "Voice",
            description: "Business telephony and licensed two-way radio.",
            points: [
              "Cloud-hosted VoIP and desk phones",
              "AI attendant, routing and transcription",
              "Hytera DMR radios and repeaters",
            ],
            href: "/telephone-services",
          },
          {
            icon: "cctv",
            title: "Video",
            description: "Surveillance you can actually review after an incident.",
            points: [
              "IP cameras and network video recorders",
              "AI analytics for people, vehicles and search",
              "Live event and job site broadcasting",
            ],
            href: "/security-services",
          },
          {
            icon: "shield-check",
            title: "Security",
            description: "Layered protection for the network and the building.",
            points: [
              "Firewalls, endpoint protection and patching",
              "Barracuda, Fortinet, Juniper and similar NGFWs",
              "Access control and smart locks",
            ],
            href: "/cybersecurity",
          },
        ],
      },
    },
    {
      type: "statusStrip",
      settings: { background: "grid", paddingY: "md" },
      data: {
        heading: "Network status",
        description: "",
        href: "/network-status",
        linkLabel: "View full status",
        showLiveData: true,
      },
    },
    {
      type: "serviceGrid",
      settings: { background: "white", paddingY: "xl" },
      data: {
        heading: "One provider for everything connected",
        description:
          "Most of our clients start with a single project and stay because the same team already understands their network, their building and their business.",
        columns: "3",
        items: [
          {
            icon: "monitor",
            title: "IT Services",
            description:
              "Network infrastructure, Windows and macOS support, server administration and proactive maintenance.",
            href: "/it-services",
            imageUrl: photos.it.url,
            imageAlt: photos.it.alt,
            badge: "",
          },
          {
            icon: "shield",
            title: "Cybersecurity",
            description:
              "Firewalls, endpoint protection, vulnerability assessments, ransomware defense, and backup with disaster recovery.",
            href: "/cybersecurity",
            imageUrl: photos.cybersecurity.url,
            imageAlt: photos.cybersecurity.alt,
            badge: "",
          },
          {
            icon: "router",
            title: "Firewalls",
            description:
              "Next-generation firewalls we design, install and support — Barracuda, Fortinet, Juniper and other platforms we are trained on.",
            href: "/firewalls",
            imageUrl: photos.firewall.url,
            imageAlt: photos.firewall.alt,
            badge: "",
          },
          {
            icon: "camera",
            title: "Security Systems",
            description:
              "IP CCTV, network video recorders, intrusion detection and 24/7 monitored alarm systems.",
            href: "/security-services",
            imageUrl: photos.security.url,
            imageAlt: photos.security.alt,
            badge: "",
          },
          {
            icon: "sparkles",
            title: "AI for cameras & phones",
            description:
              "Analytics on your cameras and intelligent features on your telephone system — installed and supported by the same local team.",
            href: "/ai-services",
            imageUrl: photos.ai.url,
            imageAlt: photos.ai.alt,
            badge: "",
          },
          {
            icon: "phone",
            title: "Telephone Services",
            description:
              "Cloud-hosted IP VoIP with auto-attendants, voicemail-to-email, mobile apps and a full range of desk phones.",
            href: "/telephone-services",
            imageUrl: photos.telephone.url,
            imageAlt: photos.telephone.alt,
            badge: "",
          },
          {
            icon: "wifi",
            title: "Internet Services",
            description:
              "Fixed wireless, cable, fiber, satellite, LTE and DSL access, plus design and operations for ISPs.",
            href: "/internet-services",
            imageUrl: photos.internet.url,
            imageAlt: photos.internet.alt,
            badge: "",
          },
          {
            icon: "key",
            title: "Access Control",
            description:
              "Card readers, biometrics, Schlage smart locks and parking control gates — installed and serviced.",
            href: "/access-control",
            imageUrl: photos.access.url,
            imageAlt: photos.access.alt,
            badge: "",
          },
          {
            icon: "cable",
            title: "Data Cabling & Fiber",
            description:
              "Cat5e and Cat6 structured cabling, network racks, cable TV pre-wire and single or multimode fiber fusion splicing.",
            href: "/data-cabling-fiber-optic",
            imageUrl: photos.cabling.url,
            imageAlt: photos.cabling.alt,
            badge: "",
          },
          {
            icon: "activity",
            title: "Video & Live Broadcasting",
            description:
              "Live events, press conferences, job site cameras and fixed weather cameras streamed to any device.",
            href: "/video-services",
            imageUrl: photos.video.url,
            imageAlt: photos.video.alt,
            badge: "",
          },
          {
            icon: "zap",
            title: "EV Charging",
            description:
              "Level 2 charging stations for home, fleet and multi-unit sites with ESA-certified installation.",
            href: "/ev-charging-solutions",
            imageUrl: photos.ev.url,
            imageAlt: photos.ev.alt,
            badge: "",
          },
          {
            icon: "radio",
            title: "Two-Way Radios",
            description:
              "Authorized Hytera dealer for DMR handhelds, mobiles and repeaters, with sales, rentals and service.",
            href: "/two-way-radios",
            imageUrl: photos.radio.url,
            imageAlt: photos.radio.alt,
            badge: "Hytera dealer",
          },
          {
            icon: "car",
            title: "Fleet Vehicle Tracking",
            description:
              "Real-time GPS tracking for vehicles, trailers and equipment.",
            href: "/fleet-vehicle-tracking",
            imageUrl: photos.fleet.url,
            imageAlt: photos.fleet.alt,
            badge: "",
          },
          {
            icon: "megaphone",
            title: "Digital Marketing",
            description:
              "Digital signage displays and graphic design that keeps your brand consistent everywhere.",
            href: "/digital-marketing",
            imageUrl: photos.signage.url,
            imageAlt: photos.signage.alt,
            badge: "",
          },
        ],
      },
    },
    {
      type: "imageText",
      settings: { background: "light", paddingY: "xl" },
      data: {
        eyebrow: "Why WirelessCom",
        heading: "Local expertise, standards-based work",
        html: "<p>We have been providing internet and wireless services since 2005, and today we cover the whole technology stack for business: the network, the servers, the phones, the cameras and the doors. Because one team designs and maintains all of it, security controls work together instead of fighting each other.</p><p>Everything is installed to industry standards, documented, and supported by people you can reach in Sault Ste. Marie.</p>",
        image: {
          url: "/images/cabling-install-1400.webp",
          alt: "Technician's hands terminating blue and white network cables into a rack-mounted patch panel",
          caption: "",
        },
        imagePosition: "right",
        bullets: [
          "Expertise across Windows and macOS environments",
          "Proactive monitoring and preventive maintenance",
          "ESA-certified electrical work with permits and inspection",
          "Responsive local support, not an offshore queue",
        ],
        buttons: [
          { label: "About our services", href: "/it-services", style: "secondary", openInNewTab: false },
        ],
      },
    },
    {
      type: "featureGrid",
      settings: { background: "white", paddingY: "lg" },
      data: {
        heading: "Industries we support",
        description:
          "We work with organizations of every size across Northern Ontario.",
        columns: "3",
        style: "plain",
        items: [
          { icon: "check", title: "Small and medium business", description: "" },
          { icon: "check", title: "Professional offices", description: "" },
          { icon: "check", title: "Healthcare providers", description: "" },
          { icon: "check", title: "Retail", description: "" },
          { icon: "check", title: "Manufacturing", description: "" },
          { icon: "check", title: "Construction", description: "" },
          { icon: "check", title: "Municipal organizations", description: "" },
          { icon: "check", title: "Nonprofits", description: "" },
          { icon: "check", title: "Educational facilities", description: "" },
        ],
      },
    },
    {
      type: "toolGrid",
      settings: { background: "dark", paddingY: "xl" },
      data: {
        eyebrow: "Free tools",
        heading: "Diagnose it yourself",
        description:
          "Run the same checks our technicians start with. Nothing is stored against your name, and the password tools never send what you type.",
        columns: "3",
        items: [
          {
            icon: "gauge",
            title: "Internet speed test",
            description: "Download, upload, ping and jitter measured from your browser.",
            href: "/speed-test",
            badge: "",
          },
          {
            icon: "search",
            title: "Network tools",
            description: "DNS lookups, port checks, WHOIS, subnet and cable calculators.",
            href: "/network-tools",
            badge: "",
          },
          {
            icon: "shield-check",
            title: "Security tools",
            description: "TLS certificates, security headers, SPF/DKIM/DMARC and password checks.",
            href: "/cybersecurity-tools",
            badge: "",
          },
        ],
      },
    },
    {
      type: "brandGrid",
      settings: { background: "light", paddingY: "lg" },
      data: {
        eyebrow: "",
        heading: "Technologies we deploy and support",
        description:
          "We design around equipment we are trained on and can support long term.",
        layout: "grid",
        disclaimer:
          "Vendor names describe the equipment we install and support. WirelessCom.Ca Inc. is an authorized Hytera dealer; other names are listed as supported technologies and do not imply a formal partnership.",
        items: [
          { name: "Hytera", category: "Two-way radio · authorized dealer", logoUrl: "", href: "/two-way-radios" },
          { name: "Barracuda", category: "Firewall & email security", logoUrl: "", href: "/firewalls" },
          { name: "Fortinet", category: "Next-generation firewall", logoUrl: "", href: "/firewalls" },
          { name: "Juniper", category: "Firewall & routing", logoUrl: "", href: "/firewalls" },
          { name: "Rogers", category: "Connectivity", logoUrl: "", href: "" },
          { name: "Tait Communications", category: "Critical communications", logoUrl: "", href: "" },
          { name: "Ubiquiti Networks", category: "Networking & Wi-Fi", logoUrl: "", href: "" },
          { name: "SureCall", category: "Cellular boosters", logoUrl: "", href: "" },
          { name: "Genetec", category: "Access control", logoUrl: "", href: "" },
        ],
      },
    },
    {
      type: "testimonials",
      settings: { background: "white", paddingY: "xl" },
      data: {
        heading: "What our clients say",
        source: "database",
        limit: 3,
      },
    },
    {
      type: "posts",
      settings: { background: "light", paddingY: "lg" },
      data: {
        heading: "Latest news and advisories",
        description: "",
        limit: 3,
        columns: "3",
      },
    },
    {
      type: "cta",
      settings: { background: "gradient", paddingY: "lg" },
      data: {
        heading: "Let's talk about your network",
        description:
          "Tell us what you need and we will put together a plan and a fixed quote. Already a client and need help now? Start a remote support session or open a ticket.",
        phone: PHONE,
        variant: "banner",
        buttons: [
          { label: "Request a quote", href: "/request-quote", style: "primary", openInNewTab: false },
          { label: "Remote support", href: "/remote-support", style: "outline", openInNewTab: false },
          { label: "Contact us", href: "/contact", style: "ghost", openInNewTab: false },
        ],
      },
    },
  ],
};

const itServices: SeedPage = {
  slug: "it-services",
  title: "IT Services",
  metaDescription:
    "Professional IT infrastructure, network management, server administration and cybersecurity for Windows and macOS business environments.",
  showInHeaderNav: true,
  navOrder: 10,
  blocks: [
    serviceHero(
      "IT Services",
      "IT infrastructure built for uptime",
      "WirelessCom provides professional IT infrastructure, network management, server administration, and cybersecurity services for business environments running Windows and macOS. We design, implement, and maintain secure, high-availability systems aligned with industry best practices.",
      ["Network design", "Endpoint support", "Server administration", "Security"],
      photos.it,
    ),
    {
      type: "featureGrid",
      settings: { background: "white", paddingY: "xl" },
      data: {
        heading: "Network infrastructure & management",
        description:
          "We deploy and manage reliable, secure network infrastructures tailored to business requirements. Our designs prioritize security, scalability, and uptime.",
        columns: "2",
        style: "bordered",
        items: [
          { icon: "network", title: "Layered wired and wireless network design", description: "" },
          { icon: "network", title: "VLAN configuration and traffic segmentation", description: "" },
          { icon: "activity", title: "Network performance analysis and optimization", description: "" },
          { icon: "lock", title: "Secure VPN and remote access solutions", description: "" },
          { icon: "eye", title: "Network monitoring and fault resolution", description: "" },
        ],
      },
    },
    {
      type: "featureGrid",
      settings: { background: "light", paddingY: "xl" },
      data: {
        heading: "Windows & macOS system support",
        description:
          "Cross-platform desktop and endpoint support for mixed operating environments.",
        columns: "2",
        style: "bordered",
        items: [
          { icon: "monitor", title: "Windows and macOS deployment and configuration", description: "" },
          { icon: "check", title: "Patch management and OS lifecycle support", description: "" },
          { icon: "shield", title: "Endpoint security and policy enforcement", description: "" },
          { icon: "key", title: "User account and access control management", description: "" },
          { icon: "headset", title: "Application support and compatibility management", description: "" },
        ],
      },
    },
    {
      type: "featureGrid",
      settings: { background: "white", paddingY: "xl" },
      data: {
        heading: "Server administration & maintenance",
        description:
          "Full lifecycle management for business server environments, focused on stability, performance and recoverability.",
        columns: "2",
        style: "bordered",
        items: [
          { icon: "server", title: "Windows Server deployment and administration", description: "" },
          { icon: "database", title: "Active Directory, DNS, DHCP and Group Policy", description: "" },
          { icon: "hard-drive", title: "Virtualization and resource optimization", description: "" },
          { icon: "cloud", title: "Backup, recovery and redundancy planning", description: "" },
          { icon: "globe", title: "On-premises and cloud-based server solutions", description: "" },
        ],
      },
    },
    {
      type: "featureGrid",
      settings: { background: "light", paddingY: "xl" },
      data: {
        heading: "Cybersecurity services",
        description:
          "Layered cybersecurity controls to mitigate threats and reduce risk, aligning security with operational efficiency.",
        columns: "2",
        style: "bordered",
        items: [
          { icon: "shield", title: "Firewall deployment and rule management", description: "" },
          { icon: "alert", title: "Endpoint protection and threat detection", description: "" },
          { icon: "eye", title: "Vulnerability assessments and security audits", description: "" },
          { icon: "lock", title: "Malware and ransomware mitigation", description: "" },
          { icon: "database", title: "Data backup, encryption and recovery strategies", description: "" },
        ],
      },
    },
    {
      type: "featureGrid",
      settings: { background: "white", paddingY: "lg" },
      data: {
        heading: "Why WirelessCom",
        description: "",
        columns: "3",
        style: "card",
        items: [
          {
            icon: "monitor",
            title: "Cross-platform expertise",
            description: "Windows and macOS enterprise environments, side by side.",
          },
          {
            icon: "shield",
            title: "Security and reliability first",
            description: "Standards-based infrastructure design, not shortcuts.",
          },
          {
            icon: "activity",
            title: "Proactive maintenance",
            description: "Monitoring and patching before problems reach your staff.",
          },
          {
            icon: "headset",
            title: "Responsive support",
            description: "Professional IT support from people who know your site.",
          },
        ],
      },
    },
    closingCta(
      "Ready for IT that just works?",
      "Book an infrastructure review and we will show you exactly where the risks are.",
    ),
  ],
};

const cybersecurity: SeedPage = {
  slug: "cybersecurity",
  title: "Cybersecurity",
  metaTitle: "Cybersecurity Services for Business",
  metaDescription:
    "Enterprise-grade cybersecurity for Ontario businesses: Barracuda, Fortinet, and Juniper firewalls, endpoint protection, vulnerability assessments, ransomware defense, backup, and disaster recovery.",
  showInHeaderNav: true,
  navOrder: 20,
  blocks: [
    serviceHero(
      "Cybersecurity",
      "Protect your business with enterprise-grade cybersecurity",
      "Cyber threats continue to evolve, placing businesses of every size at risk of data breaches, ransomware, phishing attacks and network compromise. WirelessCom.Ca Inc. delivers practical, business-focused security that protects your systems, data, employees and reputation.",
      ["Layered defense", "Managed monitoring", "Incident response"],
      photos.cybersecurity,
    ),
    {
      type: "richText",
      settings: { background: "white", paddingY: "lg", width: "narrow" },
      data: {
        html: "<p>Whether you operate a small office, a multi-site business or a growing enterprise, our experienced IT professionals implement layered security strategies that reduce risk while keeping your business productive.</p>",
        columns: "1",
      },
    },
    {
      type: "featureGrid",
      settings: { background: "light", paddingY: "xl" },
      data: {
        heading: "Network security",
        description:
          "Your network is the foundation of your business. We design, deploy and manage secure network environments that help prevent unauthorized access and protect sensitive information.",
        columns: "3",
        style: "card",
        items: [
          { icon: "shield", title: "Firewall installation and management", description: "" },
          { icon: "network", title: "Secure network architecture", description: "" },
          { icon: "network", title: "VLAN segmentation", description: "" },
          { icon: "lock", title: "VPN deployment for remote users", description: "" },
          { icon: "wifi", title: "Wireless network security", description: "" },
          { icon: "eye", title: "Continuous network monitoring", description: "" },
        ],
      },
    },
    {
      type: "featureGrid",
      settings: { background: "white", paddingY: "xl" },
      data: {
        heading: "Endpoint protection",
        description:
          "Every workstation, laptop and mobile device connected to your network represents a potential attack point.",
        columns: "3",
        style: "card",
        items: [
          { icon: "shield", title: "Antivirus and anti-malware", description: "" },
          { icon: "alert", title: "Endpoint Detection & Response (EDR)", description: "" },
          { icon: "lock", title: "Device encryption", description: "" },
          { icon: "check", title: "Patch management", description: "" },
          { icon: "monitor", title: "Application control", description: "" },
          { icon: "hard-drive", title: "USB device protection", description: "" },
        ],
      },
    },
    {
      type: "featureGrid",
      settings: { background: "light", paddingY: "xl" },
      data: {
        heading: "Firewall & perimeter security",
        description:
          "A properly configured next-generation firewall is the first serious control on the network. We design, install and support the platforms we are trained on — Barracuda, Fortinet, Juniper and similar appliances — rather than dropping a box in and walking away.",
        columns: "3",
        style: "card",
        items: [
          { icon: "shield", title: "Next-generation firewalls (NGFW)", description: "Application-aware rules, IPS and encrypted inspection where the site needs it." },
          { icon: "router", title: "Barracuda, Fortinet, Juniper and similar", description: "We size, install and support the appliance that fits the site — not a single-vendor lock-in." },
          { icon: "alert", title: "Intrusion prevention (IPS/IDS)", description: "" },
          { icon: "globe", title: "Web content filtering", description: "" },
          { icon: "map", title: "Geo-blocking", description: "" },
          { icon: "lock", title: "Site-to-site and remote-access VPN", description: "" },
        ],
      },
    },
    {
      type: "imageText",
      settings: { background: "white", paddingY: "xl" },
      data: {
        eyebrow: "Firewalls we deploy",
        heading: "The right appliance for the site, then ongoing support",
        html: "<p>Most businesses do not need a data-center chassis. They need a firewall that is sized for their internet circuit, their VPN users and the applications they actually run — then someone who will still answer the phone when a rule change is required.</p><p>WirelessCom.Ca Inc. designs, installs and supports next-generation firewalls including <strong>Barracuda</strong>, <strong>Fortinet</strong> and <strong>Juniper</strong>, along with other platforms we are trained on such as SonicWall, WatchGuard, Palo Alto and Cisco. These are technologies we deploy and support; listing them does not imply a formal partnership unless we say so.</p>",
        image: {
          url: "/images/firewall-1400.webp",
          alt: "Rack-mounted next-generation firewall appliances in a dark cabinet with cyan status lights and dressed ethernet",
          caption: "",
        },
        imagePosition: "left",
        bullets: [
          "Site survey, sizing and a documented rule base",
          "High availability where downtime is not acceptable",
          "VPN for staff, partners and other sites",
          "Firmware, backups of the config, and change control",
        ],
        buttons: [
          { label: "Firewall services", href: "/firewalls", style: "secondary", openInNewTab: false },
        ],
      },
    },
    {
      type: "featureGrid",
      settings: { background: "white", paddingY: "xl" },
      data: {
        heading: "Vulnerability assessments",
        description:
          "Cybersecurity begins with knowing where your weaknesses are. After each assessment we provide a detailed report with recommendations to improve your security posture.",
        columns: "3",
        style: "numbered",
        items: [
          { icon: "check", title: "Outdated software", description: "" },
          { icon: "check", title: "Missing security patches", description: "" },
          { icon: "check", title: "Weak passwords", description: "" },
          { icon: "check", title: "Configuration errors", description: "" },
          { icon: "check", title: "Network vulnerabilities", description: "" },
          { icon: "check", title: "Risks found before attackers find them", description: "" },
        ],
      },
    },
    {
      type: "featureGrid",
      settings: { background: "light", paddingY: "xl" },
      data: {
        heading: "Ransomware protection",
        description:
          "Ransomware attacks can halt business operations within minutes. We minimize that risk with:",
        columns: "3",
        style: "card",
        items: [
          { icon: "database", title: "Immutable backups", description: "" },
          { icon: "check", title: "Secure backup verification", description: "" },
          { icon: "alert", title: "Endpoint detection", description: "" },
          { icon: "key", title: "User privilege management", description: "" },
          { icon: "network", title: "Network segmentation", description: "" },
          { icon: "cloud", title: "Disaster recovery planning", description: "" },
        ],
      },
    },
    {
      type: "featureGrid",
      settings: { background: "white", paddingY: "xl" },
      data: {
        heading: "Backup & disaster recovery",
        description:
          "Protect your business from hardware failure, cyberattack and accidental data loss.",
        columns: "3",
        style: "card",
        items: [
          { icon: "database", title: "Automated backups", description: "" },
          { icon: "cloud", title: "Cloud backup solutions", description: "" },
          { icon: "hard-drive", title: "Hybrid backup systems", description: "" },
          { icon: "check", title: "Disaster recovery planning", description: "" },
          { icon: "zap", title: "Rapid data restoration", description: "" },
          { icon: "activity", title: "Business continuity strategies", description: "" },
        ],
      },
    },
    {
      type: "featureGrid",
      settings: { background: "light", paddingY: "xl" },
      data: {
        heading: "Security monitoring, maintenance & consulting",
        description:
          "Cybersecurity requires continuous attention. Our managed services cover monitoring, updates, patching, threat detection and preventive maintenance — and our consultants help with planning, risk assessments, policy development, compliance readiness and infrastructure reviews.",
        columns: "3",
        style: "bordered",
        items: [
          { icon: "eye", title: "Security monitoring", description: "" },
          { icon: "check", title: "Software updates and patch management", description: "" },
          { icon: "alert", title: "Threat detection", description: "" },
          { icon: "activity", title: "Performance monitoring", description: "" },
          { icon: "shield", title: "Cybersecurity planning and risk assessments", description: "" },
          { icon: "lock", title: "Security policy and compliance readiness", description: "" },
        ],
      },
    },
    {
      type: "imageText",
      settings: { background: "white", paddingY: "xl" },
      data: {
        eyebrow: "Why choose WirelessCom",
        heading: "Networking experience plus practical security expertise",
        html: "<p>Businesses throughout Ontario trust WirelessCom because we combine decades of networking experience with practical cybersecurity expertise. Our team understands both information technology and communications infrastructure, so we build security solutions that work together instead of creating unnecessary complexity.</p>",
        image: {
          url: "/images/cybersecurity-1400.webp",
          alt: "Abstract shield formed from connected cyan nodes and lines over a dark navy grid",
          caption: "",
        },
        imagePosition: "left",
        bullets: [
          "Reliable protection",
          "Practical security solutions",
          "Fast response times",
          "Professional implementation",
          "Ongoing support",
          "Long-term technology partnerships",
        ],
        buttons: [],
      },
    },
    {
      type: "banner",
      settings: { background: "white", paddingY: "sm" },
      data: {
        text: "Cybersecurity is no longer optional. Every connected business needs proactive protection against today's evolving threats.",
        tone: "warning",
        icon: true,
      },
    },
    {
      type: "defenseInDepth",
      settings: { background: "navy", paddingY: "xl" },
      data: {
        eyebrow: "How we think about risk",
        heading: "Defense in depth",
        description:
          "No single control is enough. We layer prevention, detection, and recovery so a failure in one place does not become an outage or a breach. The wording is deliberate: we help protect systems and reduce risk — we do not claim to eliminate it.",
        centreLabel: "Your data",
        layers: [
          {
            icon: "shield",
            title: "Perimeter",
            description: "Firewalls, filtering and remote-access controls.",
            controls: ["NGFW", "VPN", "geo-blocking"],
          },
          {
            icon: "network",
            title: "Network",
            description: "Segmentation so a compromised endpoint cannot roam.",
            controls: ["VLANs", "ACLs", "Wi-Fi isolation"],
          },
          {
            icon: "monitor",
            title: "Endpoint",
            description: "The devices people actually use.",
            controls: ["EDR", "patching", "encryption"],
          },
          {
            icon: "database",
            title: "Data & recovery",
            description: "Backups that still work after ransomware.",
            controls: ["immutable backups", "restore tests", "DR runbooks"],
          },
        ],
        threats: [
          "Phishing and credential theft",
          "Ransomware",
          "Business email compromise",
          "Unpatched internet-facing services",
          "Weak or reused passwords",
          "Unsecured remote access",
          "Lost or stolen laptops",
          "Supply-chain and vendor access",
        ],
      },
    },
    closingCta(
      "Request a security assessment",
      "We will review the path an attacker would actually take and tell you what would help protect it — without inventing a residual-risk score.",
    ),
  ],
};

const securityServices: SeedPage = {
  slug: "security-services",
  title: "Security Services",
  navLabel: "Security Systems",
  metaDescription:
    "IP CCTV surveillance with optional AI analytics, access control, intrusion detection and 24/7 monitored alarm systems for businesses in Sault Ste. Marie and Northern Ontario.",
  showInHeaderNav: true,
  navOrder: 30,
  blocks: [
    serviceHero(
      "Security Services",
      "Comprehensive security for your business, assets and people",
      "WirelessCom.Ca Inc. is committed to providing security services that safeguard your business, assets and personnel. Based in Sault Ste. Marie, Ontario, we specialize in tailored solutions designed around the real risks at your site.",
      ["IP CCTV & NVRs", "Access control", "24/7 monitoring"],
      photos.security,
    ),
    {
      type: "steps",
      settings: { background: "white", paddingY: "xl" },
      data: {
        heading: "Our security services",
        description: "",
        items: [
          {
            title: "Surveillance systems",
            description:
              "Advanced CCTV and IP camera systems that monitor your premises, deter theft and vandalism and improve overall security. We offer a range of high-definition cameras and recording solutions tailored to your requirements.",
          },
          {
            title: "Access control systems",
            description:
              "Control and manage access to your facilities with card readers, biometric scanners and integration with your existing security infrastructure to secure every entry and exit point.",
          },
          {
            title: "Intrusion detection and alarm systems",
            description:
              "Protect your property against unauthorized access with 24/7 monitoring, instant alerts and rapid response to potential breaches to minimize risk and loss.",
          },
          {
            title: "Security consultation and assessment",
            description:
              "We evaluate your current security posture, identify vulnerabilities and recommend tailored solutions to mitigate risk effectively.",
          },
          {
            title: "Integration and support",
            description:
              "Expert installation and configuration, then ongoing support, maintenance and training so your security investment keeps working.",
          },
        ],
      },
    },
    {
      type: "featureGrid",
      settings: { background: "light", paddingY: "xl" },
      data: {
        heading: "What we install and service",
        description: "",
        columns: "3",
        style: "card",
        items: [
          {
            icon: "camera",
            title: "IP CCTV cameras & network video recorders",
            description:
              "High-definition IP cameras with on-site or cloud recording, remote viewing and retention that meets your policy.",
          },
          {
            icon: "sparkles",
            title: "AI camera analytics",
            description:
              "People, vehicle and line-crossing detection, smarter search of recorded video, and fewer false alarms — running on the system we install.",
          },
          {
            icon: "phone",
            title: "VoIP telephone entry systems",
            description:
              "Door and gate entry that rings your phones and mobiles, with video verification where required.",
          },
        ],
      },
    },
    {
      type: "imageText",
      settings: { background: "white", paddingY: "xl" },
      data: {
        eyebrow: "AI on your cameras",
        heading: "See what matters, not every leaf in the wind",
        html: "<p>A camera that records everything is only useful if you can find the event afterwards. We install and support IP camera systems with optional <strong>AI analytics</strong>: person and vehicle detection, line crossing, loitering, and search across recorded video so a technician is not scrubbing hours of footage by hand.</p><p>Analytics run on the camera, the recorder, or a service you choose — we will say which, and we will not send your video to a third party unless you ask us to. The same team that pulls the cable also sets the rules.</p>",
        image: {
          url: "/images/ai-camera-1400.webp",
          alt: "IP dome camera in the foreground with a security monitor showing cyan AI detection overlays on a night-time scene",
          caption: "",
        },
        imagePosition: "right",
        bullets: [
          "Fewer nuisance alarms from weather, headlights and wildlife",
          "Search recorded video by object type and time window",
          "Alerts to staff phones when a rule actually matches",
          "Designed with the network, storage and retention in one plan",
        ],
        buttons: [
          { label: "AI for cameras & phones", href: "/ai-services", style: "secondary", openInNewTab: false },
        ],
      },
    },
    {
      type: "featureGrid",
      settings: { background: "white", paddingY: "lg" },
      data: {
        heading: "Why choose WirelessCom.Ca Inc.?",
        description: "",
        columns: "3",
        style: "card",
        items: [
          {
            icon: "map",
            title: "Local expertise",
            description:
              "A deep understanding of security needs in Sault Ste. Marie and the surrounding area, with solutions built for local conditions.",
          },
          {
            icon: "check",
            title: "Quality and reliability",
            description:
              "We partner with trusted brands and proven technologies that meet industry standards.",
          },
          {
            icon: "headset",
            title: "Customer satisfaction",
            description:
              "Responsive service, personalized solutions and ongoing support for genuine peace of mind.",
          },
        ],
      },
    },
    closingCta(
      "Secure what matters most",
      `Contact us to schedule a consultation and discuss your security needs. Call today ${PHONE}.`,
    ),
  ],
};

const telephoneServices: SeedPage = {
  slug: "telephone-services",
  title: "Telephone Services",
  navLabel: "Telephone (VoIP)",
  metaDescription:
    "Cloud-hosted IP VoIP telephone service for business: desk phones, AI attendants, call transcription, mobile apps and local support from Sault Ste. Marie.",
  showInHeaderNav: true,
  navOrder: 40,
  blocks: [
    serviceHero(
      "Telephone Services",
      "Cloud-hosted IP VoIP telephone service",
      "WirelessCom.Ca Inc. offers advanced cloud-hosted IP VoIP telephone service designed to modernize your communications with flexibility, reliability, and cost-effectiveness — with local support from Sault Ste. Marie.",
      ["Scalable", "Mobile-friendly", "Locally supported"],
      photos.telephone,
    ),
    {
      type: "featureGrid",
      settings: { background: "white", paddingY: "xl" },
      data: {
        heading: "Key features",
        description: "",
        columns: "3",
        style: "card",
        items: [
          {
            icon: "activity",
            title: "Scalability and flexibility",
            description:
              "Add or remove users and features effortlessly as your business changes.",
          },
          {
            icon: "check",
            title: "Cost efficiency",
            description:
              "Competitive pricing, lower international calling rates and no expensive hardware maintenance.",
          },
          {
            icon: "phone",
            title: "Enhanced mobility",
            description:
              "Reach your business phone system from a smartphone, laptop or tablet, wherever you are.",
          },
          {
            icon: "headset",
            title: "Advanced features",
            description:
              "Voicemail-to-email, call forwarding, auto-attendants, conference calling and more.",
          },
          {
            icon: "sparkles",
            title: "AI attendant, routing and transcription",
            description:
              "Intelligent auto-attendants, call summaries and voicemail transcription on the telephone system we install — so callers reach the right person without a maze of menus.",
          },
          {
            icon: "lock",
            title: "Reliability and security",
            description:
              "A robust cloud platform with encryption protecting your communications and a focus on uptime.",
          },
          {
            icon: "map",
            title: "Local support and service",
            description:
              "Installation, configuration, training and ongoing support from our team in Sault Ste. Marie.",
          },
        ],
      },
    },
    {
      type: "specTable",
      settings: { background: "light", paddingY: "xl" },
      data: {
        heading: "A handset for every role",
        description:
          "We offer a wide range of IP phones so every user gets the right device.",
        columns: ["Device", "Best for"],
        rows: [
          ["Basic IP phones", "Simple and easy to use for occasional callers"],
          ["Mid-range IP phones", "Mid-range capacity with a high-end design"],
          ["High-end IP phones", "Users who are on the phone most of the day"],
          ["IP video phones for Android", "Powerful voice, video and web portal in one device"],
          ["DECT cordless IP phones", "Mobilizing your VoIP solution around a building or yard"],
          ["Softphone app", "Any SIP account on any mobile device"],
        ],
      },
    },
    {
      type: "imageText",
      settings: { background: "white", paddingY: "xl" },
      data: {
        eyebrow: "AI on your phones",
        heading: "A receptionist that never misses the first ring",
        html: "<p>Business telephone systems now include practical AI: an attendant that understands what the caller is asking, routes to the right queue, transcribes voicemail, and summarizes a long call so staff are not starting from a blank note.</p><p>We install and support those features on the VoIP platforms we already put in — desk phones, DECT, and the mobile app — with the same local team that handles the rest of the PBX. Nothing is sent to a mystery cloud unless you choose that option and we document it.</p>",
        image: {
          url: "/images/ai-phone-1400.webp",
          alt: "Black executive VoIP desk phone whose display shows an abstract cyan assistant waveform",
          caption: "",
        },
        imagePosition: "left",
        bullets: [
          "Natural-language auto-attendant instead of a deep DTMF tree",
          "Voicemail and call transcription into email",
          "After-hours coverage without adding a night receptionist",
          "Works with the handsets and softphones we already supply",
        ],
        buttons: [
          { label: "AI for cameras & phones", href: "/ai-services", style: "secondary", openInNewTab: false },
        ],
      },
    },
    {
      type: "featureGrid",
      settings: { background: "white", paddingY: "lg" },
      data: {
        heading: "Why choose WirelessCom.Ca Inc.?",
        description: "",
        columns: "3",
        style: "plain",
        items: [
          {
            icon: "map",
            title: "Local presence",
            description:
              "We understand the needs of businesses in Sault Ste. Marie and build to local requirements.",
          },
          {
            icon: "check",
            title: "Expertise",
            description:
              "Years of telecommunications experience, reliable advice and seamless implementation.",
          },
          {
            icon: "zap",
            title: "Future-ready",
            description:
              "Innovative VoIP that improves efficiency and adapts as you grow.",
          },
        ],
      },
    },
    {
      type: "banner",
      settings: { background: "light", paddingY: "sm" },
      data: {
        text: "VoIP phone emergency 9-1-1 features differ from traditional 9-1-1 emergency services. Savings vary depending on your current service.",
        tone: "critical",
        icon: true,
        link: {
          label: "Read our E-911 notice",
          href: "/e-911",
          style: "ghost",
          openInNewTab: false,
        },
      },
    },
    closingCta(
      "Transform your business communications",
      "Contact us to learn more about our VoIP services and schedule a consultation.",
    ),
  ],
};

const internetServices: SeedPage = {
  slug: "internet-services",
  title: "Internet Services",
  metaDescription:
    "Fast, affordable business and residential internet: fixed wireless, cable, fiber, satellite, LTE and DSL access across Northern Ontario, plus design and operations for ISPs.",
  showInHeaderNav: true,
  navOrder: 50,
  blocks: [
    serviceHero(
      "Internet Services",
      "Looking for affordable, reliable internet?",
      "WirelessCom.Ca Inc. offers fixed access to wireless, cable, fiber, satellite, LTE and DSL internet. Call us today to discuss the options available at your location.",
      ["Fixed wireless", "Fiber & cable", "Satellite & LTE"],
      photos.internet,
    ),
    {
      type: "richText",
      settings: { background: "white", paddingY: "lg", width: "narrow" },
      data: {
        html: "<p>Wireless internet comes in a variety of speeds; however, not all speeds are available at every tower. We upgrade sites as quickly as possible, but available speed can be limited by older equipment on a tower, distance from the tower, and blockage from trees and terrain. Call us for information on the services available in your area.</p><p>The team at WirelessCom has been providing internet and wireless services since 2005. We can also offer design and construction, plus implementation and operations services, for internet service providers (ISPs).</p>",
        columns: "1",
      },
    },
    {
      type: "featureGrid",
      settings: { background: "white", paddingY: "lg" },
      data: {
        heading: "Services for internet service providers",
        description: "",
        columns: "3",
        style: "card",
        items: [
          { icon: "network", title: "Network design", description: "RF planning, capacity and backhaul design." },
          { icon: "cable", title: "Construction", description: "Tower, rooftop and fiber build-out." },
          { icon: "activity", title: "Operations", description: "Implementation, monitoring and ongoing operations support." },
        ],
      },
    },
    closingCta(
      "Check availability at your address",
      `Call ${PHONE} or send us your address and we will tell you exactly what is available.`,
    ),
  ],
};

const videoServices: SeedPage = {
  slug: "video-services",
  title: "Video Services",
  navLabel: "Video & Broadcasting",
  metaDescription:
    "Live video streaming for events, press conferences, job sites and fixed weather cameras, produced and hosted by WirelessCom.Ca Inc.",
  showInHeaderNav: true,
  navOrder: 60,
  blocks: [
    serviceHero(
      "Video Services",
      "Video broadcasting service",
      "At WirelessCom we offer various types of video streaming, from live events and press conferences to job site and fixed weather cameras. If you would like to broadcast your event or conference, give us a call to discuss your video streaming needs.",
      ["Live events", "Job site cameras", "Weather cameras"],
      photos.video,
    ),
    {
      type: "featureGrid",
      settings: { background: "white", paddingY: "xl" },
      data: {
        heading: "What we broadcast",
        description: "",
        columns: "2",
        style: "card",
        items: [
          {
            icon: "activity",
            title: "Live events and press conferences",
            description:
              "Multi-camera production, on-site encoding and a stream your audience can watch on any device.",
          },
          {
            icon: "camera",
            title: "Job site cameras",
            description:
              "Document progress and keep stakeholders informed with continuous or time-lapse site coverage.",
          },
          {
            icon: "cloud",
            title: "Fixed weather cameras",
            description:
              "Always-on views of waterfronts, highways and yards, embedded anywhere you need them.",
          },
          {
            icon: "lock",
            title: "Private and password-protected streams",
            description:
              "Restrict a feed to specific staff or clients with a password, without exposing the source URL.",
          },
        ],
      },
    },
    {
      type: "streamGrid",
      settings: { background: "light", paddingY: "xl" },
      data: {
        heading: "Live streams",
        description:
          "Public cameras and broadcasts currently available. Private feeds require a password.",
        columns: "2",
        slugs: [],
        featuredOnly: false,
      },
    },
    closingCta(
      "Broadcast your next event",
      "Tell us about the venue and audience and we will scope the production and bandwidth you need.",
    ),
  ],
};

const liveBroadcasting: SeedPage = {
  slug: "live-video-broadcasting",
  title: "Live Video Broadcasting",
  metaDescription:
    "Password-protected live video broadcasting from WirelessCom.Ca Inc. Client and staff feeds are available after sign-in.",
  showInHeaderNav: false,
  blocks: [
    serviceHero(
      "Live Video Broadcasting",
      "Client and private broadcasts",
      "Private feeds are protected by a password supplied by WirelessCom. Enter it on the stream you have been given access to.",
      [],
      photos.video,
    ),
    {
      type: "streamGrid",
      settings: { background: "white", paddingY: "xl" },
      data: {
        heading: "Available broadcasts",
        description:
          "If a stream asks for a password, use the one provided with your access details. Contact us if you need it reissued.",
        columns: "2",
        slugs: [],
        featuredOnly: false,
      },
    },
    closingCta(
      "Need a private broadcast set up?",
      "We can stand up a password-protected stream for your event, board meeting or job site.",
    ),
  ],
};

const accessControl: SeedPage = {
  slug: "access-control",
  title: "Access Control",
  metaDescription:
    "Access control and parking gate systems. We install and service Honeywell, Paradox, Kantech, Eyeongate and the full Schlage Engage smart lock line.",
  showInHeaderNav: true,
  navOrder: 70,
  blocks: [
    serviceHero(
      "Access Control",
      "Access control and parking gate systems",
      "Card readers, biometrics, smart locks and vehicle gates — specified, installed and serviced by one team.",
      ["Honeywell", "Paradox", "Kantech", "Schlage"],
      photos.access,
    ),
    {
      type: "featureGrid",
      settings: { background: "white", paddingY: "xl" },
      data: {
        heading: "What we install and service",
        description: "",
        columns: "3",
        style: "card",
        items: [
          {
            icon: "car",
            title: "Parking gate installation & service",
            description:
              "We install and service all makes and models of parking control gates.",
          },
          {
            icon: "key",
            title: "Building access control systems",
            description:
              "We install and service Honeywell, Paradox, Kantech, Eyeongate and Schlage access systems.",
          },
          {
            icon: "lock",
            title: "Schlage Engage smart locks",
            description:
              "The complete line of Schlage electronic door smart locking systems, installed and supported.",
          },
        ],
      },
    },
    {
      type: "featureGrid",
      settings: { background: "light", paddingY: "lg" },
      data: {
        heading: "Built to work with the rest of your security",
        description:
          "Because we also handle cameras, alarms and the network, your access events, video and alerts line up instead of living in separate silos.",
        columns: "2",
        style: "bordered",
        items: [
          { icon: "camera", title: "Door events linked to camera footage", description: "" },
          { icon: "phone", title: "VoIP telephone entry and intercom integration", description: "" },
          { icon: "network", title: "Controllers on a segmented, monitored network", description: "" },
          { icon: "check", title: "Credential and schedule management support", description: "" },
        ],
      },
    },
    closingCta(
      "Control who gets in, and when",
      "We will walk your site and design an access plan around your doors, gates and shift patterns.",
    ),
  ],
};

const dataCabling: SeedPage = {
  slug: "data-cabling-fiber-optic",
  title: "Data Cabling & Fiber Optic Services",
  navLabel: "Data Cabling & Fiber",
  metaDescription:
    "Cat5e and Cat6 structured data cabling, network rack installation, cable TV pre-wire and single and multimode fiber optic fusion splicing.",
  showInHeaderNav: true,
  navOrder: 80,
  blocks: [
    serviceHero(
      "Data Cabling & Fiber Optic Services",
      "Structured cabling and fiber optic splicing",
      "The physical layer decides how well everything above it performs. We install and certify structured cabling, network racks and fiber for commercial and residential buildings.",
      ["Cat5e & Cat6", "Network racks", "Fiber fusion splicing"],
      photos.cabling,
    ),
    {
      type: "featureGrid",
      settings: { background: "white", paddingY: "xl" },
      data: {
        heading: "Our cabling services",
        description: "",
        columns: "3",
        style: "card",
        items: [
          {
            icon: "cable",
            title: "Cat5e & Cat6 data cabling",
            description:
              "Network rack and structured cable installations, dressed, labeled and tested.",
          },
          {
            icon: "monitor",
            title: "Cable TV pre-wire installations",
            description:
              "Cable TV pre-wire service for residential and commercial buildings.",
          },
          {
            icon: "zap",
            title: "Fiber optic fusion splicing",
            description:
              "Fusion splicing of single-mode and multimode fiber cables.",
          },
        ],
      },
    },
    closingCta(
      "Planning a build or a move?",
      "Get the cabling right the first time — send us your floor plans and we will quote the structured cabling.",
    ),
  ],
};

const evCharging: SeedPage = {
  slug: "ev-charging-solutions",
  title: "EV Charging Solutions",
  navLabel: "EV Charging",
  metaDescription:
    "Level 2 EV charging stations for home, fleet and multi-unit properties. GrizzLE EV Charge, EvoCharge and SWTCH Charge, with ESA-certified installation.",
  showInHeaderNav: true,
  navOrder: 90,
  blocks: [
    serviceHero(
      "EV Charging Solutions",
      "Level 2 EV charging, installed and certified",
      "Compatible with every EV and PHEV sold in North America. All installations are ESA-certified with electrical permits and inspection provided, and all chargers are in stock.",
      ["ESA certified", "Permits & inspection", "In stock"],
      photos.ev,
    ),
    {
      type: "specTable",
      settings: { background: "white", paddingY: "xl" },
      data: {
        heading: "GrizzLE EV Charge",
        description:
          "UL tested and certified, IP67 water and fire-resistant indoor aluminum cast enclosure, eligible for rebates in Quebec and BC.",
        columns: ["Specification", "Detail"],
        rows: [
          ["Maximum power output", "40 A, 10 kW — configurable to 16 A, 24 A or 32 A"],
          [
            "Charge rate",
            "28–30 miles/hour at 40 A · 22–25 at 32 A · 15–18 at 24 A · 10–12 at 16 A",
          ],
          [
            "Power requirements",
            "Dedicated 240 V 50 A breaker for 40 A; 40 A breaker for 32 A; 30 A breaker for 24 A; 20 A breaker for 16 A",
          ],
          ["Protections", "Over current, over voltage, under voltage, missing diode, ground fault, over temperature, built-in GFCI"],
          ["Charging level", "Level 2"],
          ["Plug", "NEMA 14-50P · 24 ft output cable"],
          ["Connector", "J1772"],
          ["Mounting", "Wall mounted, bracket with anti-theft features"],
          ["Enclosure", "Indoor and outdoor, NEMA 4 aluminum cast"],
          ["Operating temperature", "−30 °C to +50 °C (−22 °F to 122 °F)"],
        ],
      },
    },
    {
      type: "specTable",
      settings: { background: "light", paddingY: "xl" },
      data: {
        heading: "EvoCharge with Wi-Fi app",
        description:
          "Fast, reliable Level 2 charging up to eight times faster than Level 1. UL listed. Works with all EVs sold in North America, including Tesla with the J1772 adapter.",
        columns: ["Specification", "Detail"],
        rows: [
          ["Installation", "208–240 V receptacle with NEMA 6-50 plug; hardwire installation by a licensed electrician"],
          ["App", "EvoCharge mobile app over 2.4 GHz Wi-Fi — schedule charging, manage multiple stations, track history and usage (Android and Apple)"],
          [
            "Power requirements",
            "Dedicated 240 V 50 A breaker for 40 A; 40 A breaker for 32 A; 30 A breaker for 24 A; 20 A breaker for 16 A",
          ],
          ["Charging level", "Level 2"],
          ["Connector", "J1772"],
          ["Mounting", "Wall mounted, bracket with anti-theft features"],
        ],
      },
    },
    {
      type: "specTable",
      settings: { background: "white", paddingY: "xl" },
      data: {
        heading: "SWTCH Charge",
        description:
          "Open-access charging station common in residential and fleet use. UL safety certified in the US and Canada with all-weather durability.",
        columns: ["Specification", "Detail"],
        rows: [
          ["Compatibility", "All EVs (BEVs and PHEVs) sold in North America"],
          ["Output", "7.6 kW, adjustable to 5.8 kW or 3.8 kW · 18 ft cable"],
          ["Installation", "Plug-in (NEMA 6-50) or hardwire for outdoor install"],
          [
            "Power requirements",
            "Dedicated 240 V 50 A breaker for 40 A; 40 A breaker for 32 A; 30 A breaker for 24 A; 20 A breaker for 16 A",
          ],
          ["Charging level", "Level 2"],
          ["Connector", "J1772"],
          ["Mounting", "Wall mounted, bracket with anti-theft features"],
        ],
      },
    },
    {
      type: "banner",
      settings: { background: "light", paddingY: "sm" },
      data: {
        text: "All installations are ESA-certified with electrical permits and inspections provided. All chargers in stock.",
        tone: "success",
        icon: true,
      },
    },
    closingCta(
      "Add EV charging to your property",
      "Home, workplace, fleet depot or condo — we will size the service and handle the permit.",
    ),
  ],
};

const twoWayRadios: SeedPage = {
  slug: "two-way-radios",
  title: "Two-Way Radios",
  metaDescription:
    "Authorized Hytera dealer for digital and analog two-way radios: DMR handhelds, mobiles, repeaters and accessories, with sales, rentals, training and service.",
  showInHeaderNav: true,
  navOrder: 100,
  blocks: [
    serviceHero(
      "Two-Way Radios",
      "Your Hytera communications dealer",
      "Digital and analog two-way radios from leading brands, suitable for many industries and applications, with clear and dependable communication indoors and outdoors.",
      ["Authorized Hytera dealer", "Sales & rentals", "Service & training"],
      photos.radio,
    ),
    {
      type: "richText",
      settings: { background: "white", paddingY: "lg", width: "narrow" },
      data: {
        html: "<p>WirelessCom.Ca Inc. is an authorized dealer of Hytera Communications, a global leader in professional mobile radio (DMR) solutions and radio communication systems. Hytera is known for its commitment to excellence and cutting-edge technology, whether you need robust radios for public safety, efficient communication for an enterprise, or versatile devices for personal use.</p>",
        columns: "1",
      },
    },
    {
      type: "steps",
      settings: { background: "light", paddingY: "xl" },
      data: {
        heading: "Our products and services",
        description: "",
        items: [
          {
            title: "Hytera radios and devices",
            description:
              "A wide selection of digital mobile radios (DMR), handheld radios, repeaters and accessories, built to withstand tough environments and deliver clear, secure communication.",
          },
          {
            title: "Custom solutions",
            description:
              "We start by understanding your communication requirements, then integrate Hytera technology to optimize operational efficiency and productivity.",
          },
          {
            title: "Consulting and support",
            description:
              "Help selecting the right products, optimizing your communication infrastructure, and integrating with existing systems.",
          },
          {
            title: "Training and maintenance",
            description:
              "Training programs on radio operation and maintenance, plus comprehensive service to keep your fleet reliable.",
          },
        ],
      },
    },
    {
      type: "imageText",
      settings: { background: "white", paddingY: "xl" },
      data: {
        eyebrow: "Radio rentals",
        heading: "Short-term or long-term rentals",
        html: "<p>Flexible rental options for two-way radios to cover temporary needs. Whether it is for events, projects or emergencies, our rental service keeps you connected when it matters most.</p>",
        image: { url: "", alt: "", caption: "" },
        imagePosition: "right",
        bullets: [
          "Local expertise in Sault Ste. Marie",
          "Quality products from trusted brands",
          "Customer-focused service and support",
        ],
        buttons: [
          { label: "Browse Hytera radios", href: "https://hyteraradios.ca", style: "primary", openInNewTab: true },
          { label: "Ask about rentals", href: "/request-quote", style: "outline", openInNewTab: false },
        ],
      },
    },
    closingCta(
      "Keep your team talking",
      `Contact us to learn more about Hytera products and custom solutions. Call today ${PHONE}.`,
    ),
  ],
};

const fleetTracking: SeedPage = {
  slug: "fleet-vehicle-tracking",
  title: "Fleet Vehicle Tracking",
  navLabel: "Fleet Tracking",
  metaDescription:
    "Real-time GPS tracking for fleet vehicles, trailers and equipment, supplied and supported by WirelessCom.Ca Inc.",
  showInHeaderNav: true,
  navOrder: 110,
  blocks: [
    serviceHero(
      "Fleet Vehicle Tracking",
      "Know where your fleet is, in real time",
      "Real-time, accurate GPS tracking for vehicles, trailers and equipment. The Tracki GPS tracker is the world's smallest and lightest, at only 1.26 ounces.",
      ["Real-time location", "History & reports", "Asset tracking"],
      photos.fleet,
    ),
    {
      type: "featureGrid",
      settings: { background: "white", paddingY: "xl" },
      data: {
        heading: "What tracking gives you",
        description: "",
        columns: "3",
        style: "card",
        items: [
          { icon: "map", title: "Live vehicle location", description: "See where every unit is right now." },
          { icon: "activity", title: "Trip history", description: "Review routes, stops and idle time." },
          { icon: "alert", title: "Movement alerts", description: "Get notified when an asset moves outside its schedule." },
        ],
      },
    },
    {
      type: "cta",
      settings: { background: "light", paddingY: "md" },
      data: {
        heading: "Already a tracking customer?",
        description: "Sign in to the Tracki GPS portal to view your fleet.",
        phone: "",
        variant: "boxed",
        buttons: [
          {
            label: "Log in to Tracki GPS",
            href: "https://tracki.com/login",
            style: "secondary",
            openInNewTab: true,
          },
        ],
      },
    },
    closingCta(
      "Track your fleet with confidence",
      "We will recommend the right hardware and plan for the number of vehicles you run.",
    ),
  ],
};

const digitalMarketing: SeedPage = {
  slug: "digital-marketing",
  title: "Digital Marketing",
  navLabel: "Digital Marketing",
  metaDescription:
    "Digital signage displays and professional graphic design that help businesses promote products, services and brand messaging in real time.",
  showInHeaderNav: true,
  navOrder: 120,
  blocks: [
    serviceHero(
      "Digital Marketing",
      "Digital marketing & graphic design",
      "We help businesses capture attention and communicate their message through powerful visual solutions — dynamic digital screens backed by professional design.",
      ["Digital signage", "Graphic design", "Brand consistency"],
      photos.signage,
    ),
    {
      type: "richText",
      settings: { background: "white", paddingY: "lg", width: "narrow" },
      data: {
        html: "<p>Our digital marketing screens provide a dynamic way to promote products, services and brand messaging in real time. Whether installed in retail spaces, office lobbies, trade shows or public venues, these screens deliver engaging content that is flexible and impactful. We specialize in sourcing and setting up high-quality displays, so your marketing is always clear, modern and visually striking.</p><p>To complement our digital screens, we also offer professional graphic design services. From custom advertisements and social media visuals to brand identity assets and digital content for display, our design team creates visuals that reflect your business's personality and goals. Every design is tailored to your audience, with a focus on clarity, creativity and brand consistency.</p><p>By combining cutting-edge display technology with expert graphic design, WirelessCom enables businesses to stand out, strengthen their brand presence and connect with customers in meaningful ways.</p>",
        columns: "2",
      },
    },
    closingCta(
      "Make your message impossible to miss",
      "Talk to us about screens, content and design that fit your space and your brand.",
    ),
  ],
};

const support: SeedPage = {
  slug: "support",
  title: "Support",
  metaDescription:
    "Technical support from WirelessCom.Ca Inc. Run an internet speed test and submit a support request, or call 1-800-705-3189.",
  showInHeaderNav: true,
  showInFooterNav: true,
  navOrder: 200,
  isSystem: true,
  blocks: [
    serviceHero(
      "Support",
      "Technical support",
      `Run a speed test, send us the details, or call ${PHONE}. Contracted clients also have 24/7 emergency access.`,
      [],
      photos.support,
    ),
    {
      type: "speedTest",
      settings: { background: "white", paddingY: "xl" },
      data: {
        heading: "Internet speed test",
        description:
          "Please close all file sharing software and stop all downloads before beginning the speed test.",
        note: `Speed test results are approximate and are best interpreted with the assistance of WirelessCom technical support. Phone: ${PHONE}.`,
      },
    },
    {
      type: "contactForm",
      settings: { background: "light", paddingY: "xl" },
      data: {
        heading: "Technical support request",
        description:
          "Tell us what is happening and the best number to reach you at. Include any error messages you are seeing.",
        formType: "SUPPORT",
        showCompany: true,
        showAddress: false,
        showServiceInterest: true,
        successMessage:
          "Thank you — your support request has been logged and a technician will be in touch.",
      },
    },
    {
      type: "faq",
      settings: { background: "white", paddingY: "xl" },
      data: {
        heading: "Before you call",
        description: "A few checks that resolve a surprising number of issues.",
        items: [
          {
            question: "My internet is slow — what should I check first?",
            answer:
              "Run the speed test above on a wired connection if you can, with downloads and file sharing stopped. Then restart your router and radio, and note the result and time of day so we can compare it with our tower data.",
          },
          {
            question: "Nothing is working at all. What now?",
            answer:
              "Check that the power supply for your radio or modem has a light on, and that the cable into your building has not been damaged. If the equipment is dark, call us — that usually means a power or hardware fault we need to attend.",
          },
          {
            question: "How do I reach you outside business hours?",
            answer:
              `Call ${PHONE}. Contracted clients with monitored systems have 24/7 emergency support; other requests are answered the next business day.`,
          },
          {
            question: "Can you support our staff working from home?",
            answer:
              "Yes. We deploy secure VPN and remote access, and we can support endpoints wherever they are as part of a managed IT agreement.",
          },
        ],
      },
    },
  ],
};

const contact: SeedPage = {
  slug: "contact",
  title: "Contact",
  metaDescription:
    "Contact WirelessCom.Ca Inc. at 97 White Oak Drive East, Sault Ste. Marie, Ontario. Phone 1-800-705-3189.",
  showInHeaderNav: true,
  showInFooterNav: true,
  navOrder: 210,
  isSystem: true,
  blocks: [
    serviceHero(
      "Contact",
      "Talk to WirelessCom",
      "Tell us what you need and the right person will get back to you. For urgent service, call us directly.",
      [],
      photos.contact,
    ),
    {
      type: "contactDetails",
      settings: { background: "white", paddingY: "xl" },
      data: {
        heading: "Our office",
        showMap: true,
        mapEmbedUrl: "",
        extraNote:
          "Visits are by appointment so the technician you need is on site rather than in the field.",
      },
    },
    {
      type: "contactForm",
      settings: { background: "light", paddingY: "xl" },
      data: {
        heading: "Send us a message",
        description:
          "Fields marked with an asterisk are required. We reply to every inquiry.",
        formType: "CONTACT",
        showCompany: true,
        showAddress: true,
        showServiceInterest: true,
        successMessage:
          "Thank you — we have received your message and will be in touch shortly.",
      },
    },
  ],
};

const privacyPolicy: SeedPage = {
  slug: "privacy-policy",
  title: "Privacy Policy",
  metaDescription:
    "How WirelessCom.Ca Inc. collects, uses, discloses and safeguards your personal information.",
  showInFooterNav: true,
  navOrder: 900,
  isSystem: true,
  blocks: [
    {
      type: "hero",
      settings: {},
      data: {
        eyebrow: "Legal",
        headline: "Privacy Policy",
        subheadline: "Effective date: December 1, 2024",
        variant: "minimal",
        height: "sm",
        overlayOpacity: 70,
        buttons: [],
        highlights: [],
      },
    },
    {
      type: "richText",
      settings: { background: "white", paddingY: "xl", width: "narrow" },
      data: {
        columns: "1",
        html: `<p>WirelessCom.Ca Inc. ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy describes how we collect, use, disclose and safeguard your personal information when you visit our website or engage with our products and services. By using our website or services, you consent to the practices described in this policy.</p>

<h2>1. Information we collect</h2>
<ul>
<li><strong>Personal information:</strong> your name, address, email address, phone number and payment details. We collect this when you sign up for an account, purchase products or services, or contact us directly.</li>
<li><strong>Technical information:</strong> information about your device, browser type, IP address, location and browsing activity on our website, collected through cookies, web beacons and other tracking technologies.</li>
<li><strong>Transaction information:</strong> the products or services you have bought, payment method and transaction history.</li>
<li><strong>Communication information:</strong> if you contact us by email, phone or through our website, we may keep the content of your communication to help us respond or resolve an issue.</li>
</ul>

<h2>2. Purpose of collection and use of information</h2>
<ul>
<li><strong>To provide and improve our services:</strong> to process orders, deliver products and services and manage customer relationships, including improving our website, products and customer service.</li>
<li><strong>To communicate with you:</strong> to send updates, promotional material and information about our services, and to respond to inquiries and provide support.</li>
<li><strong>To personalize your experience:</strong> using your preferences, purchase history and browsing behavior to offer relevant content and services.</li>
<li><strong>For security and legal compliance:</strong> to protect the security of our services, prevent fraud and comply with legal requirements or requests from law enforcement.</li>
</ul>

<h2>3. Disclosure of information</h2>
<ul>
<li><strong>Service providers:</strong> third parties that assist our operations, such as payment processors, shipping companies, marketing and IT support providers. These providers must handle your data in compliance with applicable privacy laws.</li>
<li><strong>Legal and regulatory compliance:</strong> to comply with applicable laws, regulations or legal processes such as court orders and government requests, or to protect our rights, property and safety and that of our users and others.</li>
<li><strong>Business transfers:</strong> in the event of a merger, acquisition or sale of all or part of our business, your information may be transferred as part of that transaction. We will notify you by posting an updated Privacy Policy.</li>
<li><strong>Consent:</strong> we may share your information with other parties where you have given us consent to do so.</li>
</ul>

<h2>4. Security practices</h2>
<p>We take the protection of your personal information seriously and implement reasonable technical, administrative, and physical security measures to safeguard it from unauthorized access, disclosure, alteration, or destruction. These measures include encryption, secure servers, and access controls. However, no security system is impenetrable, and while we strive to protect your information, we cannot guarantee the absolute security of data transmitted over the internet.</p>

<h2>5. Your rights and choices</h2>
<p>As a resident of Ontario, Canada, you have certain rights under applicable privacy laws, including:</p>
<ul>
<li><strong>Access:</strong> you may request access to the personal information we hold about you.</li>
<li><strong>Correction:</strong> you may request that we correct any inaccuracies.</li>
<li><strong>Deletion:</strong> you may request deletion of your personal information, subject to certain legal exceptions.</li>
<li><strong>Opt out:</strong> you may opt out of marketing communications by following the instructions in our emails or by contacting us directly.</li>
</ul>

<h2>6. Cookies and tracking technologies</h2>
<p>We use cookies and similar technologies to collect information about your browsing activity on our website. These help us improve your experience, analyze trends and gather demographic information. You can control cookies through your browser settings, though disabling them may limit some functionality.</p>

<h2>7. Third-party websites</h2>
<p>Our website may contain links to third-party websites, including social media platforms, advertisers and business partners. These sites have their own privacy policies and we are not responsible for their practices. We encourage you to review their policies before providing any personal information.</p>

<h2>8. Changes to this Privacy Policy</h2>
<p>We may update this policy from time to time to reflect changes in our practices or legal requirements. When we make material changes, we will post the revised policy on our website and update the effective date. Please review this policy periodically.</p>

<h2>9. Contact information</h2>
<p>If you have questions or concerns about this Privacy Policy or our privacy practices, contact us at:</p>
<p>WirelessCom.Ca Inc.<br>97 White Oak Drive East<br>Sault Ste. Marie, Ontario, Canada<br>Email: service@wirelesscom.ca<br>Phone: ${PHONE}</p>
<p>By using our website or services, you acknowledge that you have read and understood this Privacy Policy.</p>`,
      },
    },
  ],
};

const e911: SeedPage = {
  slug: "e-911",
  title: "E-911 Notice",
  navLabel: "E-911",
  metaDescription:
    "Important information about how 9-1-1 emergency calling works with VoIP telephone service from WirelessCom.Ca Inc.",
  showInFooterNav: true,
  navOrder: 910,
  isSystem: true,
  blocks: [
    {
      type: "hero",
      settings: {},
      data: {
        eyebrow: "Important safety information",
        headline: "VoIP 9-1-1 (E-911) notice",
        subheadline:
          "Emergency calling with an internet telephone service does not work the same way as a traditional landline. Please read this carefully and make sure everyone at your location understands it.",
        variant: "minimal",
        height: "sm",
        overlayOpacity: 70,
        buttons: [],
        highlights: [],
      },
    },
    {
      type: "banner",
      settings: { background: "white", paddingY: "sm" },
      data: {
        text: "VoIP phone emergency 9-1-1 features differ from traditional 9-1-1 emergency services.",
        tone: "critical",
        icon: true,
      },
    },
    {
      type: "richText",
      settings: { background: "white", paddingY: "lg", width: "narrow" },
      data: {
        columns: "1",
        html: `<h2>How VoIP 9-1-1 differs</h2>
<p>With traditional telephone service, a 9-1-1 call is automatically routed to the emergency center for the physical address of the line. A VoIP call travels over the internet, so the emergency operator may not automatically receive your location. Always be prepared to state your address and phone number to the operator.</p>

<h2>Keep your service address current</h2>
<p>Emergency calls are routed using the service address registered for your line. If you move a phone, an office or a whole site, you must tell WirelessCom so the registered address can be updated. Until it is updated, an emergency call may be routed to the wrong center.</p>

<h2>Power and internet outages</h2>
<p>VoIP service requires both power and a working internet connection. During a power failure or internet outage, and if your equipment has no battery backup, you will not be able to place or receive calls, including calls to 9-1-1. We recommend keeping a mobile phone available as a backup.</p>

<h2>What to do in an emergency</h2>
<ul>
<li>State the nature of the emergency, your exact address and your callback number immediately.</li>
<li>Do not hang up. If the call drops, call back.</li>
<li>If you cannot complete a call, use a mobile phone or another line.</li>
</ul>

<h2>Tell everyone at your location</h2>
<p>Make sure staff, family members, guests and anyone else who may use the phones understands these limitations. Labels on or near each handset are a simple and effective reminder.</p>

<h2>Questions</h2>
<p>If anything here is unclear, or you need to update the service address on your account, contact us at ${PHONE} or email service@wirelesscom.ca.</p>`,
      },
    },
    closingCta(
      "Need to update a service address?",
      "Contact us right away so emergency routing stays accurate.",
    ),
  ],
};

const aiServices: SeedPage = {
  slug: "ai-services",
  title: "AI for cameras & phones",
  navLabel: "AI cameras & phones",
  metaTitle: "AI Camera Analytics and AI Telephone Systems",
  metaDescription:
    "WirelessCom.Ca Inc. installs and supports AI analytics on business cameras and intelligent features on VoIP phones — person and vehicle detection, smarter search, AI attendants and call transcription in Sault Ste. Marie and Northern Ontario.",
  showInHeaderNav: true,
  navOrder: 25,
  blocks: [
    serviceHero(
      "AI services",
      "AI on the cameras and phones you already need",
      "We install and support practical AI on two systems every site already runs: video surveillance and the telephone system. You get analytics that find a person in last night's recording, and an attendant that routes a caller without a maze of menus — designed, installed, and supported by the same local team.",
      ["Camera analytics", "AI attendants", "Local support"],
      photos.ai,
    ),
    {
      type: "imageText",
      settings: { background: "white", paddingY: "xl" },
      data: {
        eyebrow: "Cameras",
        heading: "AI that watches with you, not instead of you",
        html: "<p>A recorder full of video is only useful if you can find the incident. We add <strong>AI analytics</strong> to the IP camera systems we design: person and vehicle detection, line crossing, loitering, license-plate capture where it is lawful, and search across recorded footage so staff are not scrubbing hours by hand.</p><p>Rules run on the camera, the network video recorder, or a service you choose. We will tell you which, and we will not send video off-site unless you ask us to and we document it.</p>",
        image: {
          url: "/images/ai-camera-1400.webp",
          alt: "IP dome camera in the foreground with a security monitor showing cyan AI detection overlays on a night-time scene",
          caption: "",
        },
        imagePosition: "right",
        bullets: [
          "Fewer false alarms from weather, headlights and wildlife",
          "Search recorded video by object type and time",
          "Alerts to phones when a rule actually matches",
          "Sized with storage, bandwidth and retention in one design",
        ],
        buttons: [
          { label: "Security systems", href: "/security-services", style: "secondary", openInNewTab: false },
        ],
      },
    },
    {
      type: "featureGrid",
      settings: { background: "light", paddingY: "xl" },
      data: {
        heading: "What AI on the cameras actually does",
        description:
          "These are features we turn on and support. They are not a replacement for a guard, and they are not a marketing score.",
        columns: "3",
        style: "card",
        items: [
          {
            icon: "cctv",
            title: "People and vehicles",
            description:
              "Detect a person or a vehicle in a defined zone so the recorder is not treating every shadow as an event.",
          },
          {
            icon: "activity",
            title: "Line crossing and loitering",
            description:
              "Fence lines, loading docks and after-hours lots — alerts when something crosses a line you drew.",
          },
          {
            icon: "search",
            title: "Search recorded video",
            description:
              "Find a red truck at 2 a.m. without watching the whole night. Time window plus object type is enough to start.",
          },
          {
            icon: "siren",
            title: "Fewer nuisance alarms",
            description:
              "Weather, insects and headlights generate motion. Analytics cut the noise so staff still look at the real ones.",
          },
          {
            icon: "phone",
            title: "Alerts to the people on site",
            description:
              "A match can ring a phone, send a snapshot, or open the live view — using the same numbers we already support.",
          },
          {
            icon: "lock",
            title: "On the equipment you own",
            description:
              "Prefer the analytics on the camera or NVR. Cloud processing is optional and only if you choose it.",
          },
        ],
      },
    },
    {
      type: "imageText",
      settings: { background: "white", paddingY: "xl" },
      data: {
        eyebrow: "Phones",
        heading: "An attendant that understands the first sentence",
        html: "<p>The same idea on the telephone system: <strong>AI attendants</strong> that understand what the caller is asking, route to the right queue, transcribe voicemail, and summarize a long call so staff are not starting from a blank note.</p><p>We turn those features on in the VoIP platforms we already install — desk phones, DECT cordless, video phones and the mobile app — with training for your receptionist and a documented after-hours plan. E-911 behavior does not change; read the notice if you are moving to VoIP.</p>",
        image: {
          url: "/images/ai-phone-1400.webp",
          alt: "Black executive VoIP desk phone whose display shows an abstract cyan assistant waveform",
          caption: "",
        },
        imagePosition: "left",
        bullets: [
          "Natural-language auto-attendant instead of a deep keypad tree",
          "Voicemail and call transcription into email",
          "After-hours coverage without adding a night receptionist",
          "Works with the handsets we already supply",
        ],
        buttons: [
          { label: "Telephone services", href: "/telephone-services", style: "secondary", openInNewTab: false },
        ],
      },
    },
    {
      type: "featureGrid",
      settings: { background: "light", paddingY: "xl" },
      data: {
        heading: "What AI on the phones actually does",
        description: "",
        columns: "3",
        style: "card",
        items: [
          {
            icon: "sparkles",
            title: "Intelligent attendant",
            description:
              "Callers say what they need. The attendant routes to sales, support, a named person or voicemail.",
          },
          {
            icon: "headset",
            title: "Queue and overflow",
            description:
              "Busy queues get a callback or a summary instead of hold music until the caller hangs up.",
          },
          {
            icon: "mail",
            title: "Transcription",
            description:
              "Voicemail and, where you enable it, call notes into email so nothing lives only on the handset.",
          },
          {
            icon: "cpu",
            title: "Call summaries",
            description:
              "A short written recap after a long conversation, for staff who were not on the line.",
          },
          {
            icon: "phone",
            title: "Same phones, extra features",
            description:
              "Desk sets, DECT, video phones and the softphone app — we do not make you replace working handsets to add AI.",
          },
          {
            icon: "map",
            title: "Local configuration",
            description:
              "Menus, greetings and hours are set with you in Sault Ste. Marie, then changed when the business changes.",
          },
        ],
      },
    },
    {
      type: "richText",
      settings: { background: "white", paddingY: "lg", width: "narrow" },
      data: {
        html: "<p><strong>How we treat the data.</strong> Camera analytics and phone AI can run on equipment at your site, or on a vendor service you choose. We will write down which it is before anything is switched on. We do not sell recordings or transcripts, and we do not use your video to train a model of our own.</p><p>AI does not replace a lock, a firewall or a person who answers the phone. It is a layer on systems we already design. If a feature is not a good fit for a clinic, a school or a shop floor, we will say so.</p>",
        columns: "1",
      },
    },
    closingCta(
      "Add AI to the cameras or the phones you already have",
      "Tell us the site, the number of cameras or extensions, and whether you want analytics, an attendant, or both. We will quote the hardware, licenses and the work to turn it on.",
    ),
  ],
};

const firewalls: SeedPage = {
  slug: "firewalls",
  title: "Firewalls",
  navLabel: "Firewalls",
  metaTitle: "Barracuda, Fortinet, and Juniper Firewalls",
  metaDescription:
    "Next-generation firewall design, installation and support in Northern Ontario. Barracuda, Fortinet, Juniper and similar platforms WirelessCom.Ca Inc. is trained on — sized for your circuit, VPN users and applications.",
  showInHeaderNav: true,
  navOrder: 22,
  blocks: [
    serviceHero(
      "Firewalls",
      "Next-generation firewalls we actually support",
      "A firewall that is sized, documented and still answerable six months later. WirelessCom.Ca Inc. designs, installs and supports Barracuda, Fortinet, Juniper and other next-generation platforms we are trained on — for offices, shops, plants and multi-site networks across Northern Ontario.",
      ["Barracuda", "Fortinet", "Juniper", "And similar NGFWs"],
      photos.firewall,
    ),
    {
      type: "imageText",
      settings: { background: "white", paddingY: "xl" },
      data: {
        eyebrow: "Perimeter security",
        heading: "The box is the easy part. The rule base is the work.",
        html: "<p>Most sites do not fail because they lack a firewall. They fail because the appliance is undersized, the firmware is a year behind, or nobody owns the rules. We start with the circuit, the applications and the people who need VPN access, then we pick a platform we can support for the life of the box.</p><p><strong>Barracuda</strong>, <strong>Fortinet</strong> and <strong>Juniper</strong> are the names customers ask for most. We also deploy and support SonicWall, WatchGuard, Palo Alto and Cisco where that is the right fit. These are technologies we install and maintain. Listing them does not imply a formal partnership unless we say so — Hytera two-way radio is our authorized dealership; firewall brands are supported platforms.</p>",
        image: {
          url: "/images/firewall-1400.webp",
          alt: "Rack-mounted next-generation firewall appliances in a dark cabinet with cyan status lights and dressed ethernet",
          caption: "",
        },
        imagePosition: "right",
        bullets: [
          "Sized for the internet circuit, not a brochure throughput number",
          "Documented rule base, objects and change control",
          "Site-to-site and remote-access VPN",
          "Config backups, firmware and someone who still picks up the phone",
        ],
        buttons: [
          { label: "Cybersecurity services", href: "/cybersecurity", style: "secondary", openInNewTab: false },
        ],
      },
    },
    {
      type: "featureGrid",
      settings: { background: "light", paddingY: "xl" },
      data: {
        heading: "What we do with a firewall",
        description: "",
        columns: "3",
        style: "card",
        items: [
          {
            icon: "assessment",
            title: "Design and sizing",
            description:
              "Users, VPN, inspection of encrypted traffic and HA — chosen before the purchase order, not after the box arrives.",
          },
          {
            icon: "router",
            title: "Install and cutover",
            description:
              "Rack, address, licenses, a tested fallback, and a window that does not take the whole office down twice.",
          },
          {
            icon: "lock",
            title: "Rules that match the business",
            description:
              "Application control, IPS, web filtering and geo-blocking where they earn their keep — not a default deny that breaks payroll.",
          },
          {
            icon: "network",
            title: "VPN and other sites",
            description:
              "Staff, partners and branch offices. Certificates, MFA where you use it, and a revoke process when someone leaves.",
          },
          {
            icon: "eye",
            title: "Monitoring and changes",
            description:
              "Firmware, config backups, and a ticket when a new application needs a hole — with a note in the documentation.",
          },
          {
            icon: "layers",
            title: "High availability",
            description:
              "Active/passive pairs where an hour of downtime is more expensive than a second appliance.",
          },
        ],
      },
    },
    {
      type: "brandGrid",
      settings: { background: "white", paddingY: "xl" },
      data: {
        eyebrow: "Platforms",
        heading: "Firewalls we deploy and support",
        description:
          "We design around equipment we are trained on. If you already own a box, we will tell you honestly whether we can take it over or whether a replacement is the cheaper path.",
        layout: "grid",
        disclaimer:
          "Vendor names describe the equipment we install and support. They do not imply a formal partnership unless a relationship is stated. WirelessCom.Ca Inc. is an authorized Hytera dealer; firewall brands are supported technologies.",
        items: [
          { name: "Barracuda", category: "NGFW, email and web security", logoUrl: "", href: "" },
          { name: "Fortinet", category: "FortiGate next-generation firewall", logoUrl: "", href: "" },
          { name: "Juniper", category: "SRX firewalls and routing", logoUrl: "", href: "" },
          { name: "SonicWall", category: "SMB and mid-market NGFW", logoUrl: "", href: "" },
          { name: "WatchGuard", category: "Unified threat management", logoUrl: "", href: "" },
          { name: "Palo Alto", category: "Enterprise NGFW", logoUrl: "", href: "" },
          { name: "Cisco", category: "ASA / Firepower and related", logoUrl: "", href: "" },
          { name: "Ubiquiti", category: "Gateway security where UniFi is the LAN", logoUrl: "", href: "" },
        ],
      },
    },
    {
      type: "specTable",
      settings: { background: "light", paddingY: "xl" },
      data: {
        heading: "Which conversation we start with",
        description:
          "The brand is rarely the first decision. The circuit, the users and the applications are.",
        columns: ["If you need…", "We typically look at…"],
        rows: [
          ["A first serious firewall for a small office", "Barracuda, Fortinet, SonicWall or WatchGuard, sized to the circuit"],
          ["Multiple sites and a lot of VPN users", "Fortinet or Juniper, with a documented tunnel standard"],
          ["Email security in the same family as the firewall", "Barracuda, or Fortinet with the matching email appliance"],
          ["An existing Juniper or Cisco estate", "Stay on that family if the box is sound; replace if it is not"],
          ["UniFi switching and Wi-Fi already in place", "A UniFi gateway, or a dedicated NGFW in front of it"],
          ["High availability for a plant or clinic", "A matched pair, tested failover, and a written runbook"],
        ],
      },
    },
    {
      type: "richText",
      settings: { background: "white", paddingY: "lg", width: "narrow" },
      data: {
        html: "<p>A firewall is one layer. Endpoints, backups, MFA and the people who click links still matter — that work lives on our <a href=\"/cybersecurity\">cybersecurity</a> page. If you also want cameras or phones on the same network, we will segment them properly instead of plugging everything into one flat LAN.</p>",
        columns: "1",
      },
    },
    closingCta(
      "Replace, take over, or start from a clean rule base",
      "Send the current model if you have one, the internet speed, and how many people need VPN. We will tell you whether to keep the box, replace it, or put a second one in for failover.",
    ),
  ],
};

export const SEED_PAGES: SeedPage[] = [
  home,
  itServices,
  cybersecurity,
  firewalls,
  aiServices,
  securityServices,
  telephoneServices,
  internetServices,
  videoServices,
  liveBroadcasting,
  accessControl,
  dataCabling,
  evCharging,
  twoWayRadios,
  fleetTracking,
  digitalMarketing,
  support,
  contact,
  privacyPolicy,
  e911,
];

/**
 * 301s for legacy Weebly URLs whose slug changed. Plain `.html` stripping is
 * handled by middleware, so only the renamed paths need an entry.
 */
export const SEED_REDIRECTS: Array<{ source: string; destination: string }> = [
  { source: "/2-way-radios", destination: "/two-way-radios" },
  { source: "/2-way-radios.html", destination: "/two-way-radios" },
  {
    source: "/data-cabling--fiber-optic-services",
    destination: "/data-cabling-fiber-optic",
  },
  {
    source: "/data-cabling--fiber-optic-services.html",
    destination: "/data-cabling-fiber-optic",
  },
  { source: "/security-services.html", destination: "/security-services" },
  { source: "/index.html", destination: "/" },
  { source: "/home", destination: "/" },
  { source: "/services", destination: "/it-services" },
  { source: "/it", destination: "/it-services" },
  { source: "/voip", destination: "/telephone-services" },
  { source: "/cameras", destination: "/security-services" },
  { source: "/ai", destination: "/ai-services" },
  { source: "/firewall", destination: "/firewalls" },
  { source: "/ngfw", destination: "/firewalls" },
  { source: "/fortinet", destination: "/firewalls" },
  { source: "/barracuda", destination: "/firewalls" },
  { source: "/juniper", destination: "/firewalls" },
  { source: "/alarm", destination: "/security-services" },
  { source: "/speedtest", destination: "/support" },
  { source: "/e911", destination: "/e-911" },
  { source: "/e-911-information", destination: "/e-911" },
  { source: "/privacy", destination: "/privacy-policy" },
  { source: "/join-our-team", destination: "/careers" },
  { source: "/blog", destination: "/news" },
  { source: "/contact-us", destination: "/contact" },
  { source: "/ev-charging", destination: "/ev-charging-solutions" },
  { source: "/gps", destination: "/fleet-vehicle-tracking" },
];

/**
 * Header and footer navigation.
 *
 * Footer entries are grouped: every top-level FOOTER item becomes a column in
 * the footer using its own label as the heading, and its children become the
 * links. Admins can rename, reorder or regroup all of it under Navigation.
 */
export const SEED_NAV: Array<{
  label: string;
  href: string;
  location: "HEADER" | "FOOTER" | "UTILITY";
  order: number;
  children?: Array<{ label: string; href: string; openInNewTab?: boolean }>;
}> = [
  { label: "Home", href: "/", location: "HEADER", order: 0 },
  {
    label: "Services",
    href: "/it-services",
    location: "HEADER",
    order: 1,
    children: [
      { label: "IT Services", href: "/it-services" },
      { label: "Cybersecurity", href: "/cybersecurity" },
      { label: "Firewalls", href: "/firewalls" },
      { label: "AI cameras & phones", href: "/ai-services" },
      { label: "Security Systems", href: "/security-services" },
      { label: "Access Control", href: "/access-control" },
      { label: "Telephone (VoIP)", href: "/telephone-services" },
      { label: "Internet Services", href: "/internet-services" },
      { label: "Data Cabling & Fiber", href: "/data-cabling-fiber-optic" },
      { label: "Video & Broadcasting", href: "/video-services" },
      { label: "Two-Way Radios", href: "/two-way-radios" },
      { label: "EV Charging", href: "/ev-charging-solutions" },
      { label: "Fleet Tracking", href: "/fleet-vehicle-tracking" },
      { label: "Digital Marketing", href: "/digital-marketing" },
    ],
  },
  {
    label: "Tools",
    href: "/speed-test",
    location: "HEADER",
    order: 2,
    children: [
      { label: "Internet Speed Test", href: "/speed-test" },
      { label: "Network Tools", href: "/network-tools" },
      { label: "Cybersecurity Tools", href: "/cybersecurity-tools" },
      { label: "Network Status", href: "/network-status" },
    ],
  },
  {
    label: "Support",
    href: "/support",
    location: "HEADER",
    order: 3,
    children: [
      { label: "Request Service", href: "/support" },
      { label: "Remote Support", href: "/remote-support" },
      { label: "Knowledge Base", href: "/knowledge-base" },
      { label: "FAQ", href: "/faq" },
      { label: "Customer Portal", href: "/portal" },
      { label: "Search", href: "/search" },
    ],
  },
  {
    label: "Company",
    href: "/contact",
    location: "HEADER",
    order: 4,
    children: [
      { label: "Brands We Support", href: "/brands" },
      { label: "Case Studies", href: "/case-studies" },
      { label: "Live Streams", href: "/live" },
      { label: "News", href: "/news" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },

  {
    label: "Services",
    href: "/it-services",
    location: "FOOTER",
    order: 0,
    children: [
      { label: "IT Services", href: "/it-services" },
      { label: "Cybersecurity", href: "/cybersecurity" },
      { label: "Firewalls", href: "/firewalls" },
      { label: "AI cameras & phones", href: "/ai-services" },
      { label: "Security Systems", href: "/security-services" },
      { label: "Access Control", href: "/access-control" },
      { label: "Telephone (VoIP)", href: "/telephone-services" },
      { label: "Internet Services", href: "/internet-services" },
      { label: "Data Cabling & Fiber", href: "/data-cabling-fiber-optic" },
    ],
  },
  {
    label: "Networking & Radio",
    href: "/it-services",
    location: "FOOTER",
    order: 1,
    children: [
      { label: "Two-Way Radios", href: "/two-way-radios" },
      { label: "Hytera Radios", href: "https://hyteraradios.ca", openInNewTab: true },
      { label: "Video & Broadcasting", href: "/video-services" },
      { label: "Fleet Tracking", href: "/fleet-vehicle-tracking" },
      { label: "EV Charging", href: "/ev-charging-solutions" },
      { label: "Digital Marketing", href: "/digital-marketing" },
    ],
  },
  {
    label: "Tools & Status",
    href: "/speed-test",
    location: "FOOTER",
    order: 2,
    children: [
      { label: "Internet Speed Test", href: "/speed-test" },
      { label: "Network Tools", href: "/network-tools" },
      { label: "Cybersecurity Tools", href: "/cybersecurity-tools" },
      { label: "Network Status", href: "/network-status" },
      { label: "System Status", href: "/system-status" },
    ],
  },
  {
    label: "Help & Company",
    href: "/support",
    location: "FOOTER",
    order: 3,
    children: [
      { label: "Request a Quote", href: "/request-quote" },
      { label: "Request Service", href: "/support" },
      { label: "Remote Support", href: "/remote-support" },
      { label: "Knowledge Base", href: "/knowledge-base" },
      { label: "FAQ", href: "/faq" },
      { label: "Brands", href: "/brands" },
      { label: "Case Studies", href: "/case-studies" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

/**
 * Assigns block ids and validates the seed content against the live schemas, so
 * a typo in this file fails the seed instead of silently dropping a section.
 */
export function buildBlocks(inputs: BlockInput[], slug: string): Block[] {
  const withIds = inputs.map((input, index) => ({
    id: `seed_${slug.replace(/[^a-z0-9]/g, "")}_${index}`,
    type: input.type,
    settings: input.settings ?? {},
    data: input.data,
  }));

  const parsed = blocksSchema.safeParse(withIds);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(
      `Seed content for "/${slug}" is invalid at ${issue?.path.join(".")}: ${issue?.message}`,
    );
  }
  return parsed.data;
}
