/**
 * Idempotent seed. Safe to run on every deploy: it creates missing records and
 * leaves anything an admin has already edited alone.
 *
 * Run with `npm run seed`.
 */

import "dotenv/config";

import { env } from "../src/lib/env";
import { hashPassword, validatePasswordStrength } from "../src/lib/passwords";
import { prisma } from "../src/lib/prisma";
import { DEFAULT_SETTINGS } from "../src/lib/settings-defaults";
import { ensureSiteMedia } from "../src/lib/site-media";
import { vendorLogoUrl } from "../src/lib/vendor-logos";
import { buildBlocks, SEED_NAV, SEED_PAGES, SEED_REDIRECTS } from "./seed-content";

function log(message: string): void {
  process.stdout.write(`  ${message}\n`);
}

async function seedSuperAdmin(): Promise<void> {
  const email = env.superadmin.email;
  const password = env.superadmin.password;

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    // Never clobber a password an admin has since changed; just make sure the
    // account is still usable and holds the top role.
    if (existing.role !== "SUPERADMIN" || !existing.isActive) {
      await prisma.user.update({
        where: { email },
        data: { role: "SUPERADMIN", isActive: true },
      });
      log(`Restored super admin role for ${email}`);
    } else {
      log(`Super admin ${email} already exists`);
    }
    return;
  }

  if (!password) {
    log(
      `! SUPERADMIN_PASSWORD is not set — skipping creation of ${email}. Set it in .env and re-run the seed.`,
    );
    return;
  }

  const weak = validatePasswordStrength(password);
  if (weak) {
    log(`! SUPERADMIN_PASSWORD is too weak: ${weak}`);
    log("  The account was not created. Choose a stronger password and re-run.");
    return;
  }

  await prisma.user.create({
    data: {
      email,
      name: env.superadmin.name,
      role: "SUPERADMIN",
      passwordHash: await hashPassword(password),
    },
  });

  log(`Created super admin ${email}`);
}

async function seedSettings(): Promise<void> {
  const existing = await prisma.siteSetting.findMany({ select: { key: true } });
  const present = new Set(existing.map((row) => row.key));

  const missing = Object.entries(DEFAULT_SETTINGS).filter(
    ([key]) => !present.has(key),
  );

  if (missing.length === 0) {
    log("Site settings already seeded");
    return;
  }

  for (const [key, value] of missing) {
    await prisma.siteSetting.create({
      data: { key, value: value as never, group: "general" },
    });
  }

  log(`Seeded ${missing.length} site settings`);
}

async function seedPages(): Promise<void> {
  let created = 0;
  let skipped = 0;

  for (const page of SEED_PAGES) {
    const existing = await prisma.page.findUnique({
      where: { slug: page.slug },
      select: { id: true },
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.page.create({
      data: {
        slug: page.slug,
        title: page.title,
        navLabel: page.navLabel ?? null,
        status: "PUBLISHED",
        blocks: buildBlocks(page.blocks, page.slug) as never,
        metaTitle: page.metaTitle ?? null,
        metaDescription: page.metaDescription,
        showInHeaderNav: page.showInHeaderNav ?? false,
        showInFooterNav: page.showInFooterNav ?? false,
        navOrder: page.navOrder ?? 0,
        isSystem: page.isSystem ?? false,
        publishedAt: new Date(),
      },
    });

    created += 1;
  }

  log(`Pages: ${created} created, ${skipped} already present`);
}

async function seedNavigation(): Promise<void> {
  const existing = await prisma.navItem.count();
  if (existing > 0) {
    log("Navigation already configured");
    return;
  }

  for (const item of SEED_NAV) {
    const parent = await prisma.navItem.create({
      data: {
        label: item.label,
        href: item.href,
        location: item.location,
        order: item.order,
      },
    });

    if (!item.children) continue;

    for (const [index, child] of item.children.entries()) {
      await prisma.navItem.create({
        data: {
          label: child.label,
          href: child.href,
          location: item.location,
          order: index,
          openInNewTab: child.openInNewTab ?? false,
          parentId: parent.id,
        },
      });
    }
  }

  log(`Seeded ${SEED_NAV.length} top-level menu items`);
}

async function seedRedirects(): Promise<void> {
  let created = 0;

  for (const entry of SEED_REDIRECTS) {
    const existing = await prisma.redirect.findUnique({
      where: { source: entry.source },
    });
    if (existing) continue;

    await prisma.redirect.create({
      data: { source: entry.source, destination: entry.destination },
    });
    created += 1;
  }

  log(`Redirects: ${created} created, ${SEED_REDIRECTS.length - created} already present`);
}

async function seedLaunchPost(): Promise<void> {
  const slug = "new-wirelesscom-ca-website";
  const existing = await prisma.post.findUnique({ where: { slug } });
  if (existing) {
    log("Launch article already present");
    return;
  }

  const author = await prisma.user.findUnique({
    where: { email: env.superadmin.email },
    select: { id: true },
  });

  await prisma.post.create({
    data: {
      slug,
      title: "Our new website is live",
      excerpt:
        "A faster, mobile-friendly wirelesscom.ca with clearer service information, online support requests and live video.",
      status: "PUBLISHED",
      publishedAt: new Date(),
      readingMinutes: 2,
      tags: ["Company News"],
      authorId: author?.id ?? null,
      metaDescription:
        "WirelessCom.Ca Inc. has launched a rebuilt website with clearer service information, online support requests and live video streaming.",
      blocks: buildBlocks(
        [
          {
            type: "richText",
            data: {
              html: [
                "<p>We have rebuilt wirelesscom.ca from the ground up. The new site is faster, works properly on phones and tablets, and makes it much easier to find what each of our service lines actually covers.</p>",
                "<h2>What is new</h2>",
                "<ul>",
                "<li><strong>Clearer service pages</strong> for IT, cybersecurity, networking, telephone, internet, security systems, access control, cabling, two-way radios, EV charging and fleet tracking.</li>",
                "<li><strong>Online support requests</strong> so you can reach our technicians without waiting on hold.</li>",
                "<li><strong>A built-in speed test</strong> to help us diagnose internet problems before a technician is dispatched.</li>",
                "<li><strong>Live video</strong> for public cameras and password-protected client feeds.</li>",
                "</ul>",
                "<p>If anything looks wrong or you cannot find a page you used to bookmark, let us know and we will point you in the right direction. Call <strong>1-800-705-3189</strong> or send a message from our contact page.</p>",
              ].join(""),
              columns: "1",
            },
          },
        ],
        slug,
      ) as never,
    },
  });

  log("Created launch article");
}

async function seedExampleStream(): Promise<void> {
  const slug = "waterfront-weather-camera";
  const existing = await prisma.stream.findUnique({ where: { slug } });
  if (existing) {
    log("Example stream already present");
    return;
  }

  // Left as a draft with a placeholder source so nothing broken is published:
  // paste the real HLS URL in the admin and switch it to Published.
  await prisma.stream.create({
    data: {
      slug,
      title: "Sault Ste. Marie Waterfront Weather Camera",
      description:
        "Live weather camera stream from the Sault Ste. Marie waterfront.",
      type: "HLS",
      source: "https://example.invalid/replace-with-your-hls-url/index.m3u8",
      location: "Sault Ste. Marie, ON",
      status: "DRAFT",
      isLive: true,
      featured: true,
      isPublic: true,
      order: 0,
    },
  });

  log("Created example stream (draft — add the real source URL in the admin)");
}

async function seedCatalogue(): Promise<void> {
  const brands = [
    {
      slug: "hytera",
      name: "Hytera",
      category: "Two-way radio",
      relationship: "Authorized Dealer",
      description: "DMR handhelds, mobiles, repeaters and accessories.",
      websiteUrl: "https://hyteraradios.ca",
      logoUrl: vendorLogoUrl("hytera"),
      featured: true,
      order: 0,
    },
    {
      slug: "rogers",
      name: "Rogers",
      category: "Connectivity",
      description: "Business internet and cellular services we provision and support.",
      logoUrl: vendorLogoUrl("rogers"),
      order: 1,
    },
    {
      slug: "ubiquiti",
      name: "Ubiquiti Networks",
      category: "Networking & Wi-Fi",
      description: "Switching, routing and UniFi wireless we design and support.",
      logoUrl: vendorLogoUrl("unifi"),
      order: 2,
    },
    {
      slug: "surecall",
      name: "SureCall",
      category: "Cellular boosters",
      description: "In-building cellular amplification.",
      logoUrl: vendorLogoUrl("surecall"),
      order: 3,
    },
    {
      slug: "genetec",
      name: "Genetec",
      category: "Access control",
      description: "Access control platforms we install and maintain.",
      logoUrl: vendorLogoUrl("genetec"),
      order: 4,
    },
    {
      slug: "barracuda",
      name: "Barracuda",
      category: "Firewall & email security",
      description:
        "Next-generation firewalls, email and web security we design, install and support.",
      logoUrl: vendorLogoUrl("barracuda"),
      order: 5,
    },
    {
      slug: "fortinet",
      name: "Fortinet",
      category: "Next-generation firewall",
      description: "FortiGate firewalls we size, install and support for offices and multi-site networks.",
      logoUrl: vendorLogoUrl("fortinet"),
      order: 6,
    },
    {
      slug: "juniper",
      name: "Juniper",
      category: "Firewall & routing",
      description: "SRX firewalls and related routing we deploy and maintain.",
      logoUrl: vendorLogoUrl("juniper"),
      order: 7,
    },
    {
      slug: "sonicwall",
      name: "SonicWall",
      category: "Next-generation firewall",
      description: "SMB and mid-market firewalls we take over or replace as needed.",
      order: 8,
    },
    {
      slug: "watchguard",
      name: "WatchGuard",
      category: "Unified threat management",
      description: "UTM and firewall appliances we install and support.",
      order: 9,
    },
    {
      slug: "palo-alto",
      name: "Palo Alto",
      category: "Enterprise firewall",
      description: "Enterprise next-generation firewalls we deploy where the site needs that class of appliance.",
      order: 10,
    },
    {
      slug: "cisco",
      name: "Cisco",
      category: "Switching, routing and firewalls",
      description: "Campus switching, routing and firewall platforms we design and support.",
      logoUrl: vendorLogoUrl("cisco"),
      order: 11,
    },
    {
      slug: "mikrotik",
      name: "MikroTik",
      category: "Routing and wireless",
      description: "Routers and wireless links we deploy and support.",
      logoUrl: vendorLogoUrl("mikrotik"),
      order: 12,
    },
    {
      slug: "microsoft",
      name: "Microsoft",
      category: "Windows and identity",
      description: "Windows, Microsoft 365 and related identity we administer for business.",
      logoUrl: vendorLogoUrl("microsoft"),
      order: 13,
    },
    {
      slug: "azure",
      name: "Azure",
      category: "Cloud and identity",
      description: "Microsoft Azure services we design and support alongside on-prem networks.",
      logoUrl: vendorLogoUrl("azure"),
      order: 14,
    },
    {
      slug: "microsoft-365",
      name: "Microsoft 365",
      category: "Office apps, email and Teams",
      description:
        "Microsoft 365 (Office apps, Exchange, Teams and SharePoint) we set up, connect to your users and administer.",
      logoUrl: vendorLogoUrl("microsoft-365"),
      order: 15,
    },
    {
      slug: "aws",
      name: "AWS",
      category: "Cloud infrastructure",
      description: "Amazon Web Services compute, storage and the network path we design and support.",
      logoUrl: vendorLogoUrl("aws"),
      order: 16,
    },
    {
      slug: "google-cloud",
      name: "Google Cloud",
      category: "Cloud infrastructure",
      description: "Google Cloud projects we connect to the office network and support.",
      logoUrl: vendorLogoUrl("google-cloud"),
      order: 17,
    },
    {
      slug: "cloudflare",
      name: "Cloudflare",
      category: "CDN and edge security",
      description: "CDN and edge filtering we put in front of sites that need it.",
      logoUrl: vendorLogoUrl("cloudflare"),
      order: 18,
    },
    {
      slug: "paradox",
      name: "Paradox",
      category: "Intrusion and alarm panels",
      description: "Alarm and intrusion panels we install and connect to monitoring.",
      logoUrl: vendorLogoUrl("paradox"),
      order: 19,
    },
    {
      slug: "grandstream",
      name: "Grandstream",
      category: "VoIP phones and PBX",
      description: "Desk phones and on-prem / cloud PBX endpoints we provision.",
      logoUrl: vendorLogoUrl("grandstream"),
      order: 20,
    },
    {
      slug: "fanvil",
      name: "Fanvil",
      category: "VoIP desk phones",
      description: "Business desk phones we supply with hosted and on-prem telephone systems.",
      logoUrl: vendorLogoUrl("fanvil"),
      order: 21,
    },
    {
      slug: "tait",
      name: "Tait Communications",
      category: "Critical communications",
      description: "Two-way radio platforms we deploy and support alongside Hytera.",
      logoUrl: vendorLogoUrl("tait"),
      order: 22,
    },
  ];

  for (const brand of brands) {
    const existing = await prisma.brand.findUnique({ where: { slug: brand.slug } });
    if (existing) {
      if (
        "logoUrl" in brand &&
        brand.logoUrl &&
        existing.logoUrl !== brand.logoUrl &&
        (!existing.logoUrl || existing.logoUrl.startsWith("/brand/logos/"))
      ) {
        await prisma.brand.update({
          where: { slug: brand.slug },
          data: { logoUrl: brand.logoUrl },
        });
      }
      continue;
    }
    await prisma.brand.create({ data: { ...brand, status: "PUBLISHED" } });
  }
  log(`Brands: ensured ${brands.length} catalog entries`);

  const faqs = [
    {
      question: "Do you serve residential customers?",
      answer:
        "We focus on businesses and organizations. Home EV chargers and the occasional structured-cabling job are exceptions — call and we will tell you honestly if we are the right fit.",
      category: "General",
      order: 0,
    },
    {
      question: "Are you an authorized Hytera dealer?",
      answer:
        "Yes. Two-way radio sales, rentals, and service are through our Hytera authorization. See hyteraradios.ca for the current catalog.",
      category: "Two-way radio",
      order: 1,
    },
    {
      question: "Can you take over an existing network?",
      answer:
        "Usually. We start with an inventory and a risk review rather than ripping and replacing. If we cannot support a piece of kit we will say so before you sign anything.",
      category: "IT & networking",
      order: 2,
    },
    {
      question: "How do I get remote support?",
      answer:
        "Open /remote-support, download the client we host, and read us the ID and one-time password. Nothing happens until you share those, and you can end the session by closing the window.",
      category: "Support",
      order: 3,
    },
    {
      question: "Do you install Barracuda, Fortinet, or Juniper firewalls?",
      answer:
        "Yes. Those are platforms we design, install, and support, along with similar next-generation firewalls such as SonicWall, WatchGuard, Palo Alto, and Cisco. We pick the appliance for the circuit and the applications, then we own the rule base. Listing a brand means we support the technology; it is not a claim of partnership unless we say so.",
      category: "IT & networking",
      order: 4,
    },
    {
      question: "Do you offer AI on cameras and phones?",
      answer:
        "Yes. On cameras we add analytics — people, vehicles, line crossing and search of recorded video — on the system we install. On phones we turn on intelligent attendants, routing and transcription in the VoIP platform we already support. Analytics and transcripts stay on equipment you choose; we do not send video or calls to a third party unless you ask us to.",
      category: "Security & telephone",
      order: 5,
    },
  ];

  await prisma.faqItem.updateMany({
    where: { question: "Are you an authorised Hytera dealer?" },
    data: { question: "Are you an authorized Hytera dealer?" },
  });
  await prisma.faqItem.updateMany({
    where: { question: "Do you install Barracuda, Fortinet or Juniper firewalls?" },
    data: { question: "Do you install Barracuda, Fortinet, or Juniper firewalls?" },
  });
  await prisma.faqItem.updateMany({
    where: {
      question: "Do you serve residential customers?",
      answer: { contains: "organisations" },
    },
    data: { answer: faqs[0].answer },
  });
  await prisma.faqItem.updateMany({
    where: {
      question: "Are you an authorized Hytera dealer?",
      answer: { contains: "authorisation" },
    },
    data: { answer: faqs[1].answer },
  });

  for (const item of faqs) {
    const existing = await prisma.faqItem.findFirst({ where: { question: item.question } });
    if (existing) continue;
    await prisma.faqItem.create({ data: { ...item, status: "PUBLISHED" } });
  }
  log("FAQ: ensured starter questions");
}

async function main(): Promise<void> {
  process.stdout.write("\nSeeding WirelessCom.Ca Inc.\n\n");

  await seedSuperAdmin();
  await seedSettings();
  await seedPages();
  await seedNavigation();
  await seedRedirects();
  await seedLaunchPost();
  await seedExampleStream();
  await seedCatalogue();
  const mediaAdded = await ensureSiteMedia();
  if (mediaAdded > 0) log(`Media library: added ${mediaAdded} site photographs`);
  else log("Media library: site photographs already catalogued");

  process.stdout.write("\nSeed complete.\n\n");
}

main()
  .catch((error) => {
    process.stderr.write(`\nSeed failed: ${(error as Error).message}\n\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
