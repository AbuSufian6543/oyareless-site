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

function quoteButtons(label = "Request a quote") {
  return [
    { label, href: "/contact", style: "primary", openInNewTab: false },
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
        { label: "Request a quote", href: "/contact", style: "primary", openInNewTab: false },
      ],
    },
  };
}

function serviceHero(
  eyebrow: string,
  headline: string,
  subheadline: string,
  highlights: string[] = [],
): BlockInput {
  return {
    type: "hero",
    settings: {},
    data: {
      eyebrow,
      headline,
      subheadline,
      variant: "dark",
      height: "md",
      overlayOpacity: 78,
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
    "WirelessCom.Ca Inc. delivers managed IT, cybersecurity, networking, VoIP telephone, video surveillance and alarm security systems to businesses across Northern Ontario. Serving Sault Ste. Marie since 2005.",
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
          "Serving business since 2005",
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
              "Structured cabling and fibre",
            ],
            href: "/it-services",
          },
          {
            icon: "phone",
            title: "Voice",
            description: "Business telephony and licensed two-way radio.",
            points: [
              "Cloud-hosted VoIP and desk phones",
              "Auto-attendants and voicemail-to-email",
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
              "Retention planning and remote viewing",
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
              "Monitored intrusion detection",
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
            imageUrl: "",
            badge: "",
          },
          {
            icon: "shield",
            title: "Cybersecurity",
            description:
              "Firewalls, endpoint protection, vulnerability assessments, ransomware defence and backup with disaster recovery.",
            href: "/cybersecurity",
            imageUrl: "",
            badge: "",
          },
          {
            icon: "camera",
            title: "Security Systems",
            description:
              "IP CCTV, network video recorders, intrusion detection and 24/7 monitored alarm systems.",
            href: "/security-services",
            imageUrl: "",
            badge: "",
          },
          {
            icon: "phone",
            title: "Telephone Services",
            description:
              "Cloud-hosted IP VoIP with auto-attendants, voicemail-to-email, mobile apps and a full range of desk phones.",
            href: "/telephone-services",
            imageUrl: "",
            badge: "",
          },
          {
            icon: "wifi",
            title: "Internet Services",
            description:
              "Fixed wireless, cable, fiber, satellite, LTE and DSL access, plus design and operations for ISPs.",
            href: "/internet-services",
            imageUrl: "",
            badge: "",
          },
          {
            icon: "key",
            title: "Access Control",
            description:
              "Card readers, biometrics, Schlage smart locks and parking control gates — installed and serviced.",
            href: "/access-control",
            imageUrl: "",
            badge: "",
          },
          {
            icon: "cable",
            title: "Data Cabling & Fiber",
            description:
              "Cat5e and Cat6 structured cabling, network racks, cable TV pre-wire and single or multimode fiber fusion splicing.",
            href: "/data-cabling-fiber-optic",
            imageUrl: "",
            badge: "",
          },
          {
            icon: "activity",
            title: "Video & Live Broadcasting",
            description:
              "Live events, press conferences, job site cameras and fixed weather cameras streamed to any device.",
            href: "/video-services",
            imageUrl: "",
            badge: "",
          },
          {
            icon: "zap",
            title: "EV Charging",
            description:
              "Level 2 charging stations for home, fleet and multi-unit sites with ESA-certified installation.",
            href: "/ev-charging-solutions",
            imageUrl: "",
            badge: "",
          },
          {
            icon: "radio",
            title: "Two-Way Radios",
            description:
              "Authorised Hytera dealer for DMR handhelds, mobiles and repeaters, with sales, rentals and service.",
            href: "/two-way-radios",
            imageUrl: "",
            badge: "Hytera dealer",
          },
          {
            icon: "car",
            title: "Fleet Vehicle Tracking",
            description:
              "Real-time GPS tracking for vehicles, trailers and equipment.",
            href: "/fleet-vehicle-tracking",
            imageUrl: "",
            badge: "",
          },
          {
            icon: "megaphone",
            title: "Digital Marketing",
            description:
              "Digital signage displays and graphic design that keeps your brand consistent everywhere.",
            href: "/digital-marketing",
            imageUrl: "",
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
          "Proactive monitoring and preventative maintenance",
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
          "We work with organisations of every size across Northern Ontario.",
        columns: "3",
        style: "plain",
        items: [
          { icon: "check", title: "Small and medium business", description: "" },
          { icon: "check", title: "Professional offices", description: "" },
          { icon: "check", title: "Healthcare providers", description: "" },
          { icon: "check", title: "Retail", description: "" },
          { icon: "check", title: "Manufacturing", description: "" },
          { icon: "check", title: "Construction", description: "" },
          { icon: "check", title: "Municipal organisations", description: "" },
          { icon: "check", title: "Non-profits", description: "" },
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
          { name: "Hytera", category: "Two-way radio · authorized dealer", logoUrl: "", href: "" },
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
      "WirelessCom provides professional IT infrastructure, network management, server administration and cybersecurity services for business environments running Windows and macOS. We design, implement and maintain secure, high-availability systems aligned with industry best practices.",
      ["Network design", "Endpoint support", "Server administration", "Security"],
    ),
    {
      type: "featureGrid",
      settings: { background: "white", paddingY: "xl" },
      data: {
        heading: "Network infrastructure & management",
        description:
          "We deploy and manage reliable, secure network infrastructures tailored to business requirements. Our designs prioritise security, scalability and uptime.",
        columns: "2",
        style: "bordered",
        items: [
          { icon: "network", title: "Layered wired and wireless network design", description: "" },
          { icon: "network", title: "VLAN configuration and traffic segmentation", description: "" },
          { icon: "activity", title: "Network performance analysis and optimisation", description: "" },
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
          { icon: "hard-drive", title: "Virtualisation and resource optimisation", description: "" },
          { icon: "cloud", title: "Backup, recovery and redundancy planning", description: "" },
          { icon: "globe", title: "On-premise and cloud-based server solutions", description: "" },
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
    "Enterprise-grade cybersecurity for Ontario businesses: network security, endpoint protection, firewalls, vulnerability assessments, ransomware defence, backup and disaster recovery.",
  showInHeaderNav: true,
  navOrder: 20,
  blocks: [
    serviceHero(
      "Cybersecurity",
      "Protect your business with enterprise-grade cybersecurity",
      "Cyber threats continue to evolve, placing businesses of every size at risk of data breaches, ransomware, phishing attacks and network compromise. WirelessCom.Ca Inc. delivers practical, business-focused security that protects your systems, data, employees and reputation.",
      ["Layered defence", "Managed monitoring", "Incident response"],
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
          "Your network is the foundation of your business. We design, deploy and manage secure network environments that help prevent unauthorised access and protect sensitive information.",
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
        description: "A properly configured firewall is your first line of defence.",
        columns: "3",
        style: "card",
        items: [
          { icon: "shield", title: "Next-generation firewalls", description: "" },
          { icon: "alert", title: "Intrusion Prevention Systems (IPS)", description: "" },
          { icon: "eye", title: "Intrusion Detection Systems (IDS)", description: "" },
          { icon: "globe", title: "Web content filtering", description: "" },
          { icon: "map", title: "Geo-blocking", description: "" },
          { icon: "lock", title: "Secure remote access", description: "" },
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
          "Ransomware attacks can halt business operations within minutes. We minimise that risk with:",
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
          "Cybersecurity requires continuous attention. Our managed services cover monitoring, updates, patching, threat detection and preventative maintenance — and our consultants help with planning, risk assessments, policy development, compliance readiness and infrastructure reviews.",
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
    closingCta(
      "Schedule a cybersecurity consultation",
      "Whether you need a full security assessment, managed protection, secure remote access or help recovering from an incident, we are ready.",
    ),
  ],
};

const securityServices: SeedPage = {
  slug: "security-services",
  title: "Security Services",
  navLabel: "Security Systems",
  metaDescription:
    "IP CCTV surveillance, access control, intrusion detection and 24/7 monitored alarm systems for businesses in Sault Ste. Marie and Northern Ontario.",
  showInHeaderNav: true,
  navOrder: 30,
  blocks: [
    serviceHero(
      "Security Services",
      "Comprehensive security for your business, assets and people",
      "WirelessCom.Ca Inc. is committed to providing security services that safeguard your business, assets and personnel. Based in Sault Ste. Marie, Ontario, we specialise in tailored solutions designed around the real risks at your site.",
      ["IP CCTV & NVRs", "Access control", "24/7 monitoring"],
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
              "Protect your property against unauthorised access with 24/7 monitoring, instant alerts and rapid response to potential breaches to minimise risk and loss.",
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
        columns: "2",
        style: "card",
        items: [
          {
            icon: "camera",
            title: "IP CCTV cameras & network video recorders",
            description:
              "High-definition IP cameras with on-site or cloud recording, remote viewing and retention that meets your policy.",
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
      type: "featureGrid",
      settings: { background: "white", paddingY: "lg" },
      data: {
        heading: "Why choose WirelessCom.Ca Inc?",
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
              "Responsive service, personalised solutions and ongoing support for genuine peace of mind.",
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
    "Cloud-hosted IP VoIP telephone service for business: scalable, mobile-friendly, feature-rich and supported locally from Sault Ste. Marie.",
  showInHeaderNav: true,
  navOrder: 40,
  blocks: [
    serviceHero(
      "Telephone Services",
      "Cloud-hosted IP VoIP telephone service",
      "WirelessCom.Ca Inc. offers advanced cloud-hosted IP VoIP telephone service designed to modernise your communications with flexibility, reliability and cost-effectiveness — with local support from Sault Ste. Marie.",
      ["Scalable", "Mobile-friendly", "Locally supported"],
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
          ["DECT cordless IP phones", "Mobilising your VoIP solution around a building or yard"],
          ["Softphone app", "Any SIP account on any mobile device"],
        ],
      },
    },
    {
      type: "featureGrid",
      settings: { background: "white", paddingY: "lg" },
      data: {
        heading: "Why choose WirelessCom.Ca Inc?",
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
              "Network rack and structured cable installations, dressed, labelled and tested.",
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
    ),
    {
      type: "specTable",
      settings: { background: "white", paddingY: "xl" },
      data: {
        heading: "GrizzLE EV Charge",
        description:
          "UL tested and certified, IP67 water and fire-resistant indoor aluminium cast enclosure, eligible for rebates in Quebec and BC.",
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
          ["Enclosure", "Indoor and outdoor, NEMA 4 aluminium cast"],
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
    "Authorised Hytera dealer for digital and analog two-way radios: DMR handhelds, mobiles, repeaters and accessories, with sales, rentals, training and service.",
  showInHeaderNav: true,
  navOrder: 100,
  blocks: [
    serviceHero(
      "Two-Way Radios",
      "Your Hytera communications dealer",
      "Digital and analog two-way radios from leading brands, suitable for many industries and applications, with clear and dependable communication indoors and outdoors.",
      ["Authorised Hytera dealer", "Sales & rentals", "Service & training"],
    ),
    {
      type: "richText",
      settings: { background: "white", paddingY: "lg", width: "narrow" },
      data: {
        html: "<p>WirelessCom.Ca Inc. is an authorised dealer of Hytera Communications, a global leader in professional mobile radio (DMR) solutions and radio communication systems. Hytera is known for its commitment to excellence and cutting-edge technology, whether you need robust radios for public safety, efficient communication for an enterprise, or versatile devices for personal use.</p>",
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
              "We start by understanding your communication requirements, then integrate Hytera technology to optimise operational efficiency and productivity.",
          },
          {
            title: "Consulting and support",
            description:
              "Help selecting the right products, optimising your communication infrastructure and integrating with existing systems.",
          },
          {
            title: "Training and maintenance",
            description:
              "Training programmes on radio operation and maintenance, plus comprehensive service to keep your fleet reliable.",
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
          { label: "Ask about rentals", href: "/contact", style: "primary", openInNewTab: false },
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
    ),
    {
      type: "richText",
      settings: { background: "white", paddingY: "lg", width: "narrow" },
      data: {
        html: "<p>Our digital marketing screens provide a dynamic way to promote products, services and brand messaging in real time. Whether installed in retail spaces, office lobbies, trade shows or public venues, these screens deliver engaging content that is flexible and impactful. We specialise in sourcing and setting up high-quality displays, so your marketing is always clear, modern and visually striking.</p><p>To complement our digital screens, we also offer professional graphic design services. From custom advertisements and social media visuals to brand identity assets and digital content for display, our design team creates visuals that reflect your business's personality and goals. Every design is tailored to your audience, with a focus on clarity, creativity and brand consistency.</p><p>By combining cutting-edge display technology with expert graphic design, WirelessCom enables businesses to stand out, strengthen their brand presence and connect with customers in meaningful ways.</p>",
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
          "Tell us what is happening and the best number to reach you on. Include any error messages you are seeing.",
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
          "Fields marked with an asterisk are required. We reply to every enquiry.",
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
<li><strong>To communicate with you:</strong> to send updates, promotional material and information about our services, and to respond to enquiries and provide support.</li>
<li><strong>To personalise your experience:</strong> using your preferences, purchase history and browsing behaviour to offer relevant content and services.</li>
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
<p>We take the protection of your personal information seriously and implement reasonable technical, administrative and physical security measures to safeguard it from unauthorised access, disclosure, alteration or destruction. These measures include encryption, secure servers and access controls. However, no security system is impenetrable, and while we strive to protect your information we cannot guarantee the absolute security of data transmitted over the internet.</p>

<h2>5. Your rights and choices</h2>
<p>As a resident of Ontario, Canada, you have certain rights under applicable privacy laws, including:</p>
<ul>
<li><strong>Access:</strong> you may request access to the personal information we hold about you.</li>
<li><strong>Correction:</strong> you may request that we correct any inaccuracies.</li>
<li><strong>Deletion:</strong> you may request deletion of your personal information, subject to certain legal exceptions.</li>
<li><strong>Opt out:</strong> you may opt out of marketing communications by following the instructions in our emails or by contacting us directly.</li>
</ul>

<h2>6. Cookies and tracking technologies</h2>
<p>We use cookies and similar technologies to collect information about your browsing activity on our website. These help us improve your experience, analyse trends and gather demographic information. You can control cookies through your browser settings, though disabling them may limit some functionality.</p>

<h2>7. Third-party websites</h2>
<p>Our website may contain links to third-party websites, including social media platforms, advertisers and business partners. These sites have their own privacy policies and we are not responsible for their practices. We encourage you to review their policies before providing any personal information.</p>

<h2>8. Changes to this Privacy Policy</h2>
<p>We may update this policy from time to time to reflect changes in our practices or legal requirements. When we make material changes we will post the revised policy on our website and update the effective date. Please review this policy periodically.</p>

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
<p>With traditional telephone service, a 9-1-1 call is automatically routed to the emergency centre for the physical address of the line. A VoIP call travels over the internet, so the emergency operator may not automatically receive your location. Always be prepared to state your address and phone number to the operator.</p>

<h2>Keep your service address current</h2>
<p>Emergency calls are routed using the service address registered for your line. If you move a phone, an office or a whole site, you must tell WirelessCom so the registered address can be updated. Until it is updated, an emergency call may be routed to the wrong centre.</p>

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
<p>If anything here is unclear, or you need to update the service address on your account, contact us on ${PHONE} or email service@wirelesscom.ca.</p>`,
      },
    },
    closingCta(
      "Need to update a service address?",
      "Contact us right away so emergency routing stays accurate.",
    ),
  ],
};

export const SEED_PAGES: SeedPage[] = [
  home,
  itServices,
  cybersecurity,
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
