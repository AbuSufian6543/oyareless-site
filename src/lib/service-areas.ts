/**
 * Communities a technician reaches on a normal day from the shop at
 * 97 White Oak Drive East, Sault Ste. Marie. Farther Northern Ontario
 * towns are not listed here; those trips are booked by phone.
 */

export type ServiceAreaWork = {
  href: string;
  title: string;
  body: string;
};

export type ServiceArea = {
  slug: string;
  name: string;
  schemaType: "City" | "AdministrativeArea";
  place: string;
  metaTitle: string;
  description: string;
  hero: string;
  story: string[];
  visit: string;
  work: ServiceAreaWork[];
};

export const SERVICE_AREAS: ServiceArea[] = [
  {
    slug: "sault-ste-marie",
    name: "Sault Ste. Marie",
    schemaType: "City",
    place: "Office and shop",
    metaTitle: "IT, Security, and Radio in Sault Ste. Marie",
    description:
      "WirelessCom.Ca Inc. designs, installs, and supports networks, cameras, alarms, VoIP, and two-way radio from 97 White Oak Drive East in Sault Ste. Marie.",
    hero: "The shop is here. Technicians who cover the surrounding communities start from White Oak Drive East.",
    story: [
      "WirelessCom.Ca Inc. has worked from Sault Ste. Marie since 2005. The office is at 97 White Oak Drive East. In the city we design the network, the cameras and alarms, the phones, the cabling, and the two-way radio as one job, then stay on them.",
      "Fibre and copper are not on every street. An address check shows the internet speeds we can deliver at that site before anyone writes a quote.",
    ],
    visit: "Many sites in the city are a short drive from the shop. For an outage, call. For a new site, send the address and we will walk it.",
    work: [
      {
        href: "/it-services",
        title: "Networks and IT",
        body: "Switching, Wi-Fi, firewalls, and Microsoft 365 for offices, shops, and plants in the city.",
      },
      {
        href: "/security-services",
        title: "Cameras and alarms",
        body: "Recorders, door entry, and intrusion panels installed with the network they sit on.",
      },
      {
        href: "/telephone-services",
        title: "Desk phones",
        body: "Hosted VoIP, handsets, and the attendant options we set up on site.",
      },
      {
        href: "/two-way-radios",
        title: "Two-way radio",
        body: "Hytera handhelds, mobiles, and repeaters, programmed and serviced at the shop.",
      },
    ],
  },
  {
    slug: "prince-township",
    name: "Prince Township",
    schemaType: "AdministrativeArea",
    place: "West of the city",
    metaTitle: "IT and Phones in Prince Township",
    description:
      "Networks, internet, phones, and on-site IT in Prince Township, dispatched from WirelessCom.Ca Inc. in Sault Ste. Marie.",
    hero: "Gros Cap, Prince Lake, and the township buildings west of Sault Ste. Marie.",
    story: [
      "Prince Township sits west of the city, out toward Gros Cap. We already support sites there from the Sault office: internet, phones, email, and on-site IT for offices and community buildings.",
      "The same crew can add cameras, alarms, cabling, and radio when the building needs them. Internet speeds still come from the street address, not from the township name.",
    ],
    visit: "The drive starts at White Oak Drive East and heads west. We book the visit, do the work, and support it from the Sault shop afterward.",
    work: [
      {
        href: "/internet-services",
        title: "Internet",
        body: "Check the civic address, then we quote the speeds that check returns.",
      },
      {
        href: "/telephone-services",
        title: "Phones",
        body: "Desk phones and hosted voice for offices that need a local number and a handset.",
      },
      {
        href: "/it-services",
        title: "On-site IT",
        body: "Networks, Wi-Fi, and the computers those phones and cameras depend on.",
      },
      {
        href: "/security-services",
        title: "Cameras",
        body: "Recorders and cameras for halls, yards, and offices that sit away from the city.",
      },
    ],
  },
  {
    slug: "garden-river",
    name: "Garden River",
    schemaType: "AdministrativeArea",
    place: "East of the city on Highway 17",
    metaTitle: "Networks and Security in Garden River",
    description:
      "Networks, cameras, phones, and internet for businesses and community buildings in Garden River, from WirelessCom.Ca Inc. in Sault Ste. Marie.",
    hero: "The first community east of Sault Ste. Marie along Highway 17.",
    story: [
      "Garden River is a short drive east of the shop. We take work for businesses and community buildings along that stretch: the network inside, cameras and door entry, desk phones, and internet where the address qualifies.",
      "We do not assume a speed because the building is close to the city. The availability check is the first step, then a person writes the quote.",
    ],
    visit: "Technicians leave from 97 White Oak Drive East. Tell us the building and we will schedule the visit.",
    work: [
      {
        href: "/security-services",
        title: "Cameras and door entry",
        body: "Video, intercoms, and the recorder, designed with the network on site.",
      },
      {
        href: "/it-services",
        title: "Networks",
        body: "Switching, Wi-Fi, and firewalls for offices and community buildings.",
      },
      {
        href: "/telephone-services",
        title: "Phones",
        body: "Hosted voice that rings the same team who looks after the cameras.",
      },
      {
        href: "/internet-availability",
        title: "Internet at the address",
        body: "Enter the street. We show the speeds we can deliver there.",
      },
    ],
  },
  {
    slug: "batchewana",
    name: "Batchewana",
    schemaType: "AdministrativeArea",
    place: "Rankin and the north shore",
    metaTitle: "Networks, Cameras, and Radio in Batchewana",
    description:
      "Networks, cameras, alarms, phones, and two-way radio for sites in Batchewana, dispatched from WirelessCom.Ca Inc. in Sault Ste. Marie.",
    hero: "Rankin at the north end of the Sault, and communities further up the shore.",
    story: [
      "Batchewana includes Rankin and the communities north of the city. When a business or a community building asks us to come, the crew drives from White Oak Drive East with the same kit we use in the Sault: network, cameras, alarms, phones, and radio.",
      "A shore road and a city street do not get the same internet. Check the civic address before asking for a speed.",
    ],
    visit: "Rankin is a short drive from the shop. Sites further up the shore are booked as a scheduled visit, then supported from Sault Ste. Marie.",
    work: [
      {
        href: "/it-services",
        title: "Networks and Wi-Fi",
        body: "Switching and wireless inside the building, sized for the rooms you actually use.",
      },
      {
        href: "/alarm-systems",
        title: "Alarms",
        body: "Intrusion panels and sensors, with monitoring where you contract it.",
      },
      {
        href: "/two-way-radios",
        title: "Radio",
        body: "Handhelds and mobiles for crews working away from the desk phone.",
      },
      {
        href: "/security-services",
        title: "Cameras",
        body: "Recorders and cameras for yards, doors, and community buildings.",
      },
    ],
  },
  {
    slug: "echo-bay",
    name: "Echo Bay",
    schemaType: "AdministrativeArea",
    place: "Highway 17 East",
    metaTitle: "IT, Cameras, and Internet in Echo Bay",
    description:
      "Networks, cameras, phones, and internet for farms, highway businesses, and township buildings in Echo Bay, from WirelessCom.Ca Inc. in Sault Ste. Marie.",
    hero: "Macdonald, Meredith and Aberdeen Additional, east of Sault Ste. Marie on Highway 17.",
    story: [
      "Echo Bay is the centre of the township east of the city. The work here is farms, highway businesses, and township buildings: cabling and Wi-Fi inside, cameras on the yard, phones on the desk.",
      "Internet is quoted from the civic address. A highway lot and a side road can qualify for different speeds, so the check comes before the quote.",
    ],
    visit: "The shop is back in Sault Ste. Marie on White Oak Drive East. We book the drive, install, and leave the support with the same team.",
    work: [
      {
        href: "/data-cabling-fiber-optic",
        title: "Cabling",
        body: "Cat6 and fibre inside the building, documented so the next visit is faster.",
      },
      {
        href: "/security-services",
        title: "Yard cameras",
        body: "Cameras and a recorder for shops, barns, and yards along the highway.",
      },
      {
        href: "/telephone-services",
        title: "Phones",
        body: "Desk phones for an office that still needs a local answer.",
      },
      {
        href: "/internet-availability",
        title: "Address check",
        body: "See the fibre and copper speeds for that street before you ask for a price.",
      },
    ],
  },
  {
    slug: "st-joseph-island",
    name: "St. Joseph Island",
    schemaType: "AdministrativeArea",
    place: "Across the bridge",
    metaTitle: "Cameras, Phones, and Radio on St. Joseph Island",
    description:
      "Cameras, alarms, phones, and two-way radio for Richards Landing, Hilton Beach, and the rest of St. Joseph Island, from WirelessCom.Ca Inc. in Sault Ste. Marie.",
    hero: "Richards Landing, Hilton Beach, and the mainland approach through Desbarats.",
    story: [
      "St. Joseph Island is reached from Highway 17 across the bridge. Desbarats sits on the mainland approach. Businesses here include marinas, seasonal shops, and year-round offices.",
      "Cameras and alarms matter when a building sits empty for part of the year. Phones and radio cover the people who are there. Internet still depends on the street, so check the address before a quote.",
    ],
    visit: "We schedule the trip from the Sault shop, including the bridge. Support after the install stays with the same team.",
    work: [
      {
        href: "/security-services",
        title: "Cameras and alarms",
        body: "Coverage for buildings that are not staffed every day of the year.",
      },
      {
        href: "/telephone-services",
        title: "Phones",
        body: "Hosted voice for shops and offices in Richards Landing and Hilton Beach.",
      },
      {
        href: "/two-way-radios",
        title: "Radio",
        body: "Handhelds for crews moving between the marina, the yard, and the truck.",
      },
      {
        href: "/internet-services",
        title: "Internet",
        body: "We quote the speeds the address check shows, then install what the site needs around them.",
      },
    ],
  },
  {
    slug: "bruce-mines",
    name: "Bruce Mines",
    schemaType: "City",
    place: "Highway 17 East",
    metaTitle: "Cameras, Wi-Fi, and Radio in Bruce Mines",
    description:
      "Cameras, Wi-Fi, phones, and two-way radio for main-street and marina businesses in Bruce Mines, dispatched from WirelessCom.Ca Inc. in Sault Ste. Marie.",
    hero: "A highway town east of Sault Ste. Marie, with a main street and a marina.",
    story: [
      "Bruce Mines is far enough east that we book the day, and close enough that the crew comes from the Sault shop and goes home. The work is shops, yards, and the marina: cameras, a door that knows who is entering, Wi-Fi, phones, and radio.",
      "Do not pick a speed from the town name. Run the address through the availability check and we will quote what that street can take.",
    ],
    visit: "Visits are scheduled from 97 White Oak Drive East. After the install, calls and remote support stay with Sault Ste. Marie.",
    work: [
      {
        href: "/security-services",
        title: "Cameras",
        body: "Shop fronts, yards, and marina approaches on one recorder.",
      },
      {
        href: "/access-control",
        title: "Doors",
        body: "Who gets in, on the same system as the cameras where that helps.",
      },
      {
        href: "/it-services",
        title: "Wi-Fi",
        body: "Wireless that covers the counter and the office, not just the router shelf.",
      },
      {
        href: "/two-way-radios",
        title: "Radio",
        body: "Hytera radios for staff who leave the building during the day.",
      },
    ],
  },
  {
    slug: "thessalon",
    name: "Thessalon",
    schemaType: "City",
    place: "Further east on Highway 17",
    metaTitle: "IT and Security in Thessalon",
    description:
      "Scheduled IT, cameras, phones, and radio visits in Thessalon from WirelessCom.Ca Inc. in Sault Ste. Marie.",
    hero: "The east end of a normal day from our shop in Sault Ste. Marie.",
    story: [
      "Thessalon is waterfront, highway, and mill country east of Bruce Mines. We book the trip from Sault Ste. Marie, do the install, and keep the support at the shop afterward. The services are the same ones we deliver in the city.",
      "Internet is the piece that changes by street. Check the address, then ask for a quote with that result attached.",
    ],
    visit: "This is a scheduled day, not a same-hour city call. Tell us the site and the work and we will set the date.",
    work: [
      {
        href: "/it-services",
        title: "Networks",
        body: "Switching, firewalls, and Wi-Fi for offices and highway businesses.",
      },
      {
        href: "/security-services",
        title: "Cameras and alarms",
        body: "Recorders and sensors installed on the visit, supported from the Sault.",
      },
      {
        href: "/telephone-services",
        title: "Phones",
        body: "Hosted desk phones so the office is not waiting on a city truck for a handset.",
      },
      {
        href: "/internet-availability",
        title: "Internet check",
        body: "Speeds for that civic address, before anyone guesses.",
      },
    ],
  },
  {
    slug: "goulais-river",
    name: "Goulais River",
    schemaType: "AdministrativeArea",
    place: "North on Highway 17",
    metaTitle: "Internet, Radio, and Networks in Goulais River",
    description:
      "Networks, radio, cameras, and internet for homes and highway businesses in Goulais River, from WirelessCom.Ca Inc. in Sault Ste. Marie.",
    hero: "North of the city on Highway 17, before the turn to Searchmont.",
    story: [
      "Goulais River is homes, highway businesses, and yards north of Sault Ste. Marie. A crew working off the pavement often needs radio as much as Wi-Fi. We drive up from White Oak Drive East for both.",
      "Fibre and copper change along this highway. The availability check uses the civic address so the quote matches the site.",
    ],
    visit: "The drive is north from the shop. We schedule it, install, and leave support in Sault Ste. Marie.",
    work: [
      {
        href: "/two-way-radios",
        title: "Radio",
        body: "Handhelds and mobiles for yards and crews the desk phone cannot reach.",
      },
      {
        href: "/it-services",
        title: "Networks",
        body: "Wi-Fi and switching inside the building, documented for the next visit.",
      },
      {
        href: "/security-services",
        title: "Cameras",
        body: "Yard and door cameras with a recorder we can still reach.",
      },
      {
        href: "/internet-availability",
        title: "Address check",
        body: "See what that highway address can actually take.",
      },
    ],
  },
  {
    slug: "searchmont",
    name: "Searchmont",
    schemaType: "AdministrativeArea",
    place: "Highway 556",
    metaTitle: "Cameras, Phones, and Radio in Searchmont",
    description:
      "Cameras, phones, and two-way radio for Searchmont businesses, scheduled from WirelessCom.Ca Inc. in Sault Ste. Marie.",
    hero: "A resort community up Highway 556, with winter traffic and businesses that stay open in it.",
    story: [
      "Searchmont sits up Highway 556 from the Goulais River turn. Resorts and the businesses around them need cameras, phones, and radio when the weather turns and the road is the job.",
      "We schedule the visit from Sault Ste. Marie. A resort road is not a city street, so internet is confirmed at the civic address before we quote a speed.",
    ],
    visit: "Book the day with us. The crew comes from White Oak Drive East and the support number stays 1-800-705-3189.",
    work: [
      {
        href: "/security-services",
        title: "Cameras",
        body: "Coverage for lodges, lots, and doors that see weather and visitors.",
      },
      {
        href: "/telephone-services",
        title: "Phones",
        body: "Desk phones and an attendant so calls are answered when the counter is busy.",
      },
      {
        href: "/two-way-radios",
        title: "Radio",
        body: "Radios for staff moving between buildings when a cell signal is not the plan.",
      },
      {
        href: "/internet-services",
        title: "Internet",
        body: "Quote the speeds the address check returns, then build the network around them.",
      },
    ],
  },
];

export function serviceAreaPath(slug: string): string {
  return `/service-area/${slug}`;
}

export function serviceAreaBySlug(slug: string): ServiceArea | null {
  return SERVICE_AREAS.find((area) => area.slug === slug) ?? null;
}
