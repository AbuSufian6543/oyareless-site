/**
 * Additional published FAQ rows. Create-only by exact question text.
 * Orders start at 6 so they sit after the six questions in seed.ts.
 */

export type SeedFaq = {
  question: string;
  answer: string;
  category: string;
  order: number;
};

export const ADDITIONAL_FAQS: SeedFaq[] = [
  {
    question: "What area do you serve?",
    answer:
      "We are based in Sault Ste. Marie and work across Northern Ontario. If your site is farther out, call and we will tell you whether we can get there and what travel looks like — we do not pretend every postal code is next door.",
    category: "General",
    order: 6,
  },
  {
    question: "How long has WirelessCom been in business?",
    answer:
      "Since 2005. The office, the technicians, and the work are in Sault Ste. Marie. We do not publish a customer count.",
    category: "General",
    order: 7,
  },
  {
    question: "Do you work with municipalities, schools, and nonprofits?",
    answer:
      "Yes. We also work with professional offices, healthcare, retail, manufacturing, and construction. Tell us the site and the systems involved; we will say if we are the right fit.",
    category: "General",
    order: 8,
  },
  {
    question: "Can I walk in without an appointment?",
    answer:
      "Visits are by appointment so the technician you need is on site rather than in the field. Call 1-800-705-3189 or use the contact form and we will book you.",
    category: "General",
    order: 9,
  },
  {
    question: "What are your office hours?",
    answer:
      "The office is staffed on business days. Contracted clients have 24/7 emergency access for the systems they have under agreement. For a quote or a new project, reach us during office hours or leave a message.",
    category: "General",
    order: 10,
  },
  {
    question: "Do you provide 24/7 monitoring?",
    answer:
      "Yes, where you contract it — typically alarm and related security systems. It is not automatic with every install. We will spell out what is monitored, who is called, and what is not included.",
    category: "Alarms & access",
    order: 11,
  },
  {
    question: "How do I request a quote?",
    answer:
      "Open /request-quote, or call 1-800-705-3189. Describe the site, the work, and the timeframe. A person reads every request. We do not generate automated estimates.",
    category: "Quotes",
    order: 12,
  },
  {
    question: "Is a site visit required before you quote?",
    answer:
      "Often, yes — especially for cabling, cameras, alarms, and anything that depends on walls, power, or existing racks. A phone description is enough to start; we will tell you if we need to see the building.",
    category: "Quotes",
    order: 13,
  },
  {
    question: "Do you charge to come look at the job?",
    answer:
      "It depends on the distance and the kind of work. We will say so before we book the visit rather than surprising you on the invoice.",
    category: "Quotes",
    order: 14,
  },
  {
    question: "How soon can you start?",
    answer:
      "It depends on the work, the materials, and what is already on the calendar. We give a realistic window after we understand the site — not a same-day promise we cannot keep.",
    category: "Quotes",
    order: 15,
  },
  {
    question: "Do you offer financing?",
    answer:
      "Ask when you request a quote. Terms, if available, depend on the project and are stated in writing. We do not advertise a rate we cannot honor.",
    category: "Quotes",
    order: 16,
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "Invoices are issued for the work we complete. Accepted methods are listed on the invoice. For a new project we will confirm billing before we start.",
    category: "General",
    order: 17,
  },
  {
    question: "Do you sign NDAs?",
    answer:
      "Yes, when the work requires it. Send the document with the quote request or to the office and we will review it.",
    category: "General",
    order: 18,
  },
  {
    question: "Can you work after hours or on weekends?",
    answer:
      "Yes, when the job needs it — cutovers, alarm installs in a shop that cannot close mid-day, and similar work. After-hours labor is scheduled and priced up front.",
    category: "General",
    order: 19,
  },
  {
    question: "Do you still support Windows and macOS?",
    answer:
      "Yes. We design, implement, and maintain business environments running Windows and macOS, including Microsoft 365 and the servers and networks they sit on.",
    category: "IT & networking",
    order: 20,
  },
  {
    question: "Do you manage Microsoft 365?",
    answer:
      "Yes. Mail, identities, SharePoint, and the controls that belong with them — for tenants we are engaged to administer. We do not take over a tenant we have never seen and call it managed.",
    category: "IT & networking",
    order: 21,
  },
  {
    question: "Do you work with Azure, AWS, or Google Cloud?",
    answer:
      "Yes, as part of the IT work we already do. We size and support what your applications need; we do not claim a hyperscaler partnership unless we say so in writing.",
    category: "IT & networking",
    order: 22,
  },
  {
    question: "Can you install or replace office Wi-Fi?",
    answer:
      "Yes. We survey coverage, pick access points we can support, and separate staff and guest traffic when the site needs it. Consumer mesh kits are not what we specify for a business floor.",
    category: "IT & networking",
    order: 23,
  },
  {
    question: "Do you sell UniFi or Cisco switching?",
    answer:
      "We design around switching and wireless we are trained on, including Cisco, UniFi, and similar platforms. Listing a brand means we support the technology; it is not a partnership unless we say so.",
    category: "IT & networking",
    order: 24,
  },
  {
    question: "Will you document the network after you leave?",
    answer:
      "Yes. A supported network includes labels, a diagram, and the logins we issued. If a previous installer left you with unlabeled switches, that is usually where we start.",
    category: "IT & networking",
    order: 25,
  },
  {
    question: "Can you move our servers to the cloud?",
    answer:
      "Sometimes. We look at what still has to run on site, what licensing you already have, and whether the application is actually a fit. We will say no if a lift-and-shift would cost more than it saves.",
    category: "IT & networking",
    order: 26,
  },
  {
    question: "Do you provide backup and disaster recovery?",
    answer:
      "Yes, as part of IT we manage. We design around what you need to restore and how long you can be down — then we test that the backup actually restores. We do not quote a recovery time we have not designed for.",
    category: "IT & networking",
    order: 27,
  },
  {
    question: "Can you support more than one site?",
    answer:
      "Yes. Multi-site networks, VPNs, and shared firewall policy are routine for us. Each site still needs a visit or a clear remote path; we will not pretend a closet in another town is already documented.",
    category: "IT & networking",
    order: 28,
  },
  {
    question: "What is a next-generation firewall?",
    answer:
      "An appliance that filters more than ports — applications, users, and often VPN and web filtering — and that we can still reach six months later. We size Barracuda, Fortinet, Juniper, SonicWall, WatchGuard, Palo Alto, Cisco, and similar platforms we are trained on.",
    category: "Cybersecurity",
    order: 29,
  },
  {
    question: "Will you take over an existing firewall?",
    answer:
      "Usually, after we inventory the rule base and the image level. If the appliance is unpatched or we cannot support it, we will say so before you sign. We do not silently inherit a mess.",
    category: "Cybersecurity",
    order: 30,
  },
  {
    question: "Do you offer penetration testing or a security score?",
    answer:
      "We do not sell a numbered score or a one-shot pentest product on this site. We harden the systems we install and support. If you need an independent test, we can talk about that as a separate engagement.",
    category: "Cybersecurity",
    order: 31,
  },
  {
    question: "Can you turn on MFA for our email?",
    answer:
      "Yes, on Microsoft 365 and similar platforms we administer. We roll it out with a short briefing so staff are not locked out on Monday morning.",
    category: "Cybersecurity",
    order: 32,
  },
  {
    question: "Do you help after a ransomware or phishing incident?",
    answer:
      "Yes, for customers we support and for new calls when we have capacity. We start with containment and what still boots — not with a press release. Outcomes depend on backups and how far the incident went; we will not invent a recovery time.",
    category: "Cybersecurity",
    order: 33,
  },
  {
    question: "Do you monitor our network for attacks?",
    answer:
      "Where you contract it, we can watch the firewall and related logs we already manage. That is not a 24/7 SOC we staff for every customer by default. We will write down what is watched and what is not.",
    category: "Cybersecurity",
    order: 34,
  },
  {
    question: "Is remote desktop on the internet a good idea?",
    answer:
      "No. We put remote access behind a VPN with named users on a firewall we support. If your office still exposes RDP, that is usually the first thing we close.",
    category: "Cybersecurity",
    order: 35,
  },
  {
    question: "Do you install IP cameras and NVRs?",
    answer:
      "Yes. Cameras, recorders, and the network they sit on — specified for the doors and the yard you named, not for decorative coverage. Analytics are available on systems we install; we do not convert old cameras that cannot run them.",
    category: "Security & telephone",
    order: 36,
  },
  {
    question: "Can cameras and the alarm share one network?",
    answer:
      "Yes, and they should when we are the ones documenting the rack. Recorders and alarm communicators do not belong on leftover office Wi-Fi. See /security-services and /alarm-systems.",
    category: "Alarms & access",
    order: 37,
  },
  {
    question: "Which alarm panels do you install?",
    answer:
      "Paradox and similar platforms we are trained on. We specify the keypad, sensors, sirens, and monitoring you contract. We stay on the system after it is hung.",
    category: "Alarms & access",
    order: 38,
  },
  {
    question: "Can you take over an existing alarm?",
    answer:
      "Often. We test the zones, the communicator, and the monitoring path. If the panel is obsolete or we cannot get parts, we will say so and quote a replacement instead of billing you to chase a dead keypad.",
    category: "Alarms & access",
    order: 39,
  },
  {
    question: "Do you install door intercoms and telephone entry?",
    answer:
      "Yes. Wall stations, video door phones, and telephone entry that ring the office, a mobile, or a named person — specified with the lock and the phone system. See /door-intercom.",
    category: "Alarms & access",
    order: 40,
  },
  {
    question: "Do you install panic or duress buttons?",
    answer:
      "Yes. Wall stations and wireless buttons that report through the alarm panel, and to monitoring when you contract it. They are placed where staff can reach them and tested — not left as a sticker. See /panic-buttons.",
    category: "Alarms & access",
    order: 41,
  },
  {
    question: "Do you install access control and parking gates?",
    answer:
      "Yes. Card readers, biometrics, smart locks, and vehicle gates — specified, installed, and serviced by one team. See /access-control.",
    category: "Alarms & access",
    order: 42,
  },
  {
    question: "Do Schlage Engage locks work with what you install?",
    answer:
      "We specify and support Schlage Engage and similar locks as part of building access, not as a leftover box. Compatibility depends on the door and the rest of the system; we will confirm on site.",
    category: "Alarms & access",
    order: 43,
  },
  {
    question: "Do you install structured cabling and fiber?",
    answer:
      "Yes. Cat5e and Cat6, racks, patch panels, and fiber fusion splicing, certified to industry practice. The physical layer decides how well everything above it performs. See /data-cabling-fiber-optic.",
    category: "Cabling",
    order: 44,
  },
  {
    question: "Will you certify the cable runs?",
    answer:
      "Yes. We test and hand over results for the drops we install. We will not label a run certified if we have not tested it.",
    category: "Cabling",
    order: 45,
  },
  {
    question: "Can you pre-wire for cable TV as well as data?",
    answer:
      "Yes, when the building needs it. Ask when you request the cabling quote so we pull the right plant the first time.",
    category: "Cabling",
    order: 46,
  },
  {
    question: "Do you offer cloud-hosted VoIP?",
    answer:
      "Yes. Cloud-hosted IP telephone service with local support from Sault Ste. Marie — desk phones, call routing, and the features you actually use. See /telephone-services.",
    category: "Security & telephone",
    order: 47,
  },
  {
    question: "How does 9-1-1 work on VoIP?",
    answer:
      "It does not work the same way as a traditional landline. Please read /e-911 before you rely on a VoIP phone for emergencies, and make sure everyone at the location understands it.",
    category: "Security & telephone",
    order: 48,
  },
  {
    question: "Can you keep our existing phone numbers?",
    answer:
      "Usually, by porting them. Timing depends on the current carrier. We will not promise a port date the losing carrier has not confirmed.",
    category: "Security & telephone",
    order: 49,
  },
  {
    question: "Do you sell internet service?",
    answer:
      "We offer fixed access to wireless, cable, fiber, satellite, LTE, and DSL where those options exist at your address. Availability is by location — call and we will tell you what we can actually deliver. See /internet-services.",
    category: "Internet",
    order: 50,
  },
  {
    question: "Can you run a speed test for me?",
    answer:
      "You can run one yourself at /speed-test. It measures against Cloudflare's public edge, not our website. If the result looks wrong, we still need the circuit details before we can diagnose the line.",
    category: "Internet",
    order: 51,
  },
  {
    question: "Do you install Level 2 EV chargers?",
    answer:
      "Yes. Level 2 charging compatible with EVs and PHEVs sold in North America. Installations are ESA-certified with electrical permits and inspection. See /ev-charging-solutions.",
    category: "EV charging",
    order: 52,
  },
  {
    question: "Are you an authorized Hytera dealer for rentals as well as sales?",
    answer:
      "Yes. Sales, rentals, and service are through our Hytera authorization. See hyteraradios.ca for the current catalog. Other radio brands we list are platforms we support, not extra partnerships.",
    category: "Two-way radio",
    order: 53,
  },
  {
    question: "Can you program radios we already own?",
    answer:
      "Often, when they are Hytera or another platform we support and you can prove they are yours. Bring the radios and any existing codeplug notes. We will not clone a fleet we cannot identify.",
    category: "Two-way radio",
    order: 54,
  },
  {
    question: "Do you offer GPS fleet tracking?",
    answer:
      "Yes. Real-time GPS tracking for vehicles, trailers, and equipment. See /fleet-vehicle-tracking for how we specify it. We do not invent coverage figures for every concession road.",
    category: "General",
    order: 55,
  },
];
