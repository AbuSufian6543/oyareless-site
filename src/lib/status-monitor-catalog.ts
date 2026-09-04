import type { StatusCategory } from "@/lib/status-categories";

/**
 * Public sites this application probes for the community status board.
 *
 * Probe `target` is stored in the database and used only on the server.
 * `websiteUrl` is the homepage a visitor may open from a status card.
 *
 * Company-owned properties are intentionally absent from this list.
 */
export type StatusMonitorSeed = {
  slug: string;
  name: string;
  category: StatusCategory;
  target: string;
  websiteUrl: string;
  order: number;
};

export function statusLogoUrl(slug: string): string {
  return `/brand/status-logos/${slug}.webp`;
}

export const PUBLIC_STATUS_MONITORS: StatusMonitorSeed[] = [
  // News
  {
    slug: "sootoday",
    name: "SooToday",
    category: "News",
    target: "https://www.sootoday.com/",
    websiteUrl: "https://www.sootoday.com/",
    order: 10,
  },
  {
    slug: "sault-star",
    name: "Sault Star",
    category: "News",
    target: "https://www.saultstar.com/",
    websiteUrl: "https://www.saultstar.com/",
    order: 20,
  },
  {
    slug: "ctv-northern-ontario",
    name: "CTV Northern Ontario",
    category: "News",
    target: "https://northernontario.ctvnews.ca/",
    websiteUrl: "https://northernontario.ctvnews.ca/",
    order: 30,
  },

  // Social (requested global sites people here rely on)
  {
    slug: "youtube",
    name: "YouTube",
    category: "Social",
    target: "https://www.youtube.com/",
    websiteUrl: "https://www.youtube.com/",
    order: 40,
  },
  {
    slug: "facebook",
    name: "Facebook",
    category: "Social",
    target: "https://www.facebook.com/",
    websiteUrl: "https://www.facebook.com/",
    order: 50,
  },
  {
    slug: "instagram",
    name: "Instagram",
    category: "Social",
    target: "https://www.instagram.com/",
    websiteUrl: "https://www.instagram.com/",
    order: 60,
  },
  {
    slug: "whatsapp",
    name: "WhatsApp",
    category: "Social",
    target: "https://www.whatsapp.com/",
    websiteUrl: "https://www.whatsapp.com/",
    order: 70,
  },

  // Government
  {
    slug: "city-ssm",
    name: "City of Sault Ste. Marie",
    category: "Government",
    target: "https://saultstemarie.ca/",
    websiteUrl: "https://saultstemarie.ca/",
    order: 80,
  },
  {
    slug: "cra",
    name: "Canada Revenue Agency",
    category: "Government",
    target: "https://www.canada.ca/en/revenue-agency.html",
    websiteUrl: "https://www.canada.ca/en/revenue-agency.html",
    order: 90,
  },
  {
    slug: "serviceontario",
    name: "ServiceOntario",
    category: "Government",
    target: "https://www.ontario.ca/page/serviceontario",
    websiteUrl: "https://www.ontario.ca/page/serviceontario",
    order: 100,
  },
  {
    slug: "service-canada",
    name: "Service Canada",
    category: "Government",
    target:
      "https://www.canada.ca/en/employment-social-development/corporate/portfolio/service-canada.html",
    websiteUrl:
      "https://www.canada.ca/en/employment-social-development/corporate/portfolio/service-canada.html",
    order: 110,
  },
  {
    slug: "canada-post",
    name: "Canada Post",
    category: "Government",
    target: "https://www.canadapost-postescanada.ca/",
    websiteUrl: "https://www.canadapost-postescanada.ca/",
    order: 120,
  },
  {
    slug: "sault-canal",
    name: "Sault Ste. Marie Canal",
    category: "Government",
    target: "https://parks.canada.ca/lhn-nhs/on/sault",
    websiteUrl: "https://parks.canada.ca/lhn-nhs/on/sault",
    order: 130,
  },
  {
    slug: "adsab",
    name: "Algoma District Services Administration Board",
    category: "Government",
    target: "https://www.adsab.on.ca/",
    websiteUrl: "https://www.adsab.on.ca/",
    order: 140,
  },
  {
    slug: "ssm-social-services",
    name: "Sault Ste. Marie Social Services",
    category: "Government",
    target: "https://socialservices-ssmd.ca/",
    websiteUrl: "https://socialservices-ssmd.ca/",
    order: 145,
  },

  // Emergency
  {
    slug: "sault-police",
    name: "Sault Ste. Marie Police Service",
    category: "Emergency",
    target: "https://www.saultpolice.ca/",
    websiteUrl: "https://www.saultpolice.ca/",
    order: 150,
  },
  {
    slug: "opp",
    name: "Ontario Provincial Police",
    category: "Emergency",
    target: "https://www.opp.ca/",
    websiteUrl: "https://www.opp.ca/",
    order: 160,
  },
  {
    slug: "211-ontario",
    name: "211 Ontario",
    category: "Emergency",
    target: "https://211ontario.ca/",
    websiteUrl: "https://211ontario.ca/",
    order: 170,
  },

  // Health
  {
    slug: "sault-area-hospital",
    name: "Sault Area Hospital",
    category: "Health",
    target: "https://www.sah.on.ca/",
    websiteUrl: "https://www.sah.on.ca/",
    order: 180,
  },
  {
    slug: "group-health-centre",
    name: "Group Health Centre",
    category: "Health",
    target: "https://www.ghc.on.ca/",
    websiteUrl: "https://www.ghc.on.ca/",
    order: 190,
  },
  {
    slug: "algoma-public-health",
    name: "Algoma Public Health",
    category: "Health",
    target: "https://www.algomapublichealth.com/",
    websiteUrl: "https://www.algomapublichealth.com/",
    order: 200,
  },
  {
    slug: "algoma-family-services",
    name: "Algoma Family Services",
    category: "Health",
    target: "https://www.algomafamilyservices.org/",
    websiteUrl: "https://www.algomafamilyservices.org/",
    order: 210,
  },
  {
    slug: "arch-hospice",
    name: "ARCH Hospice",
    category: "Health",
    target: "https://www.archhospice.ca/",
    websiteUrl: "https://www.archhospice.ca/",
    order: 220,
  },
  {
    slug: "cmha-algoma",
    name: "CMHA Algoma",
    category: "Health",
    target: "https://ssm-algoma.cmha.ca/",
    websiteUrl: "https://ssm-algoma.cmha.ca/",
    order: 230,
  },

  // Education
  {
    slug: "sault-college",
    name: "Sault College",
    category: "Education",
    target: "https://www.saultcollege.ca/",
    websiteUrl: "https://www.saultcollege.ca/",
    order: 240,
  },
  {
    slug: "algoma-university",
    name: "Algoma University",
    category: "Education",
    target: "https://algomau.ca/",
    websiteUrl: "https://algomau.ca/",
    order: 250,
  },
  {
    slug: "adsb",
    name: "Algoma District School Board",
    category: "Education",
    target: "https://www.adsb.on.ca/",
    websiteUrl: "https://www.adsb.on.ca/",
    order: 260,
  },
  {
    slug: "hscdsb",
    name: "Huron-Superior Catholic DSB",
    category: "Education",
    target: "https://www.hscdsb.on.ca/",
    websiteUrl: "https://www.hscdsb.on.ca/",
    order: 270,
  },
  {
    slug: "shingwauk",
    name: "Shingwauk Kinoomaage Gamig",
    category: "Education",
    target: "https://www.shingwauku.org/",
    websiteUrl: "https://www.shingwauku.org/",
    order: 280,
  },

  // Utilities
  {
    slug: "puc",
    name: "PUC Services",
    category: "Utilities",
    target: "https://www.puc.ca/",
    websiteUrl: "https://www.puc.ca/",
    order: 290,
  },
  {
    slug: "hydro-one",
    name: "Hydro One",
    category: "Utilities",
    target: "https://www.hydroone.com/",
    websiteUrl: "https://www.hydroone.com/",
    order: 300,
  },

  // Travel
  {
    slug: "sault-airport",
    name: "Sault Ste. Marie Airport",
    category: "Travel",
    target: "https://saultairport.com/",
    websiteUrl: "https://saultairport.com/",
    order: 310,
  },
  {
    slug: "511-ontario",
    name: "511 Ontario",
    category: "Travel",
    target: "https://www.511on.ca/",
    websiteUrl: "https://www.511on.ca/",
    order: 320,
  },
  {
    slug: "weather-canada",
    name: "Environment Canada Weather",
    category: "Travel",
    target: "https://weather.gc.ca/",
    websiteUrl: "https://weather.gc.ca/",
    order: 330,
  },
  {
    slug: "agawa-canyon",
    name: "Agawa Canyon Tour Train",
    category: "Travel",
    target: "https://www.agawatrain.com/",
    websiteUrl: "https://www.agawatrain.com/",
    order: 340,
  },

  // Community
  {
    slug: "ssm-library",
    name: "Sault Ste. Marie Public Library",
    category: "Community",
    target: "https://www.ssmpl.ca/",
    websiteUrl: "https://www.ssmpl.ca/",
    order: 350,
  },
  {
    slug: "sault-tourism",
    name: "Tourism Sault Ste. Marie",
    category: "Community",
    target: "https://saulttourism.com/",
    websiteUrl: "https://saulttourism.com/",
    order: 360,
  },
  {
    slug: "ssm-chamber",
    name: "Sault Ste. Marie Chamber of Commerce",
    category: "Community",
    target: "https://www.ssmcoc.com/",
    websiteUrl: "https://www.ssmcoc.com/",
    order: 370,
  },
  {
    slug: "bushplane",
    name: "Canadian Bushplane Heritage Centre",
    category: "Community",
    target: "https://www.bushplane.com/",
    websiteUrl: "https://www.bushplane.com/",
    order: 380,
  },
  {
    slug: "art-gallery-algoma",
    name: "Art Gallery of Algoma",
    category: "Community",
    target: "https://www.artgalleryofalgoma.com/",
    websiteUrl: "https://www.artgalleryofalgoma.com/",
    order: 390,
  },
  {
    slug: "ymca-ssm",
    name: "YMCA of Sault Ste. Marie",
    category: "Community",
    target: "https://www.ssmymca.ca/",
    websiteUrl: "https://www.ssmymca.ca/",
    order: 400,
  },
  {
    slug: "searchmont",
    name: "Searchmont Resort",
    category: "Community",
    target: "https://searchmont.com/",
    websiteUrl: "https://searchmont.com/",
    order: 410,
  },
  {
    slug: "station-mall",
    name: "Station Mall",
    category: "Community",
    target: "https://thestationmall.com/",
    websiteUrl: "https://thestationmall.com/",
    order: 420,
  },
  {
    slug: "welcome-to-ssm",
    name: "Welcome to SSM",
    category: "Community",
    target: "https://welcometossm.com/",
    websiteUrl: "https://welcometossm.com/",
    order: 430,
  },
  {
    slug: "ssmrca",
    name: "Sault Ste. Marie Region Conservation Authority",
    category: "Community",
    target: "https://ssmrca.ca/",
    websiteUrl: "https://ssmrca.ca/",
    order: 440,
  },
  {
    slug: "gfl-memorial-gardens",
    name: "GFL Memorial Gardens",
    category: "Community",
    target: "https://gflgardens.ca/",
    websiteUrl: "https://gflgardens.ca/",
    order: 450,
  },
  {
    slug: "united-way-algoma",
    name: "United Way of Sault Ste. Marie & Algoma District",
    category: "Community",
    target: "https://www.uwssmalgoma.ca/",
    websiteUrl: "https://www.uwssmalgoma.ca/",
    order: 460,
  },
  {
    slug: "community-living-algoma",
    name: "Community Living Algoma",
    category: "Community",
    target: "https://communitylivingalgoma.org/",
    websiteUrl: "https://communitylivingalgoma.org/",
    order: 470,
  },
  {
    slug: "ssm-innovation",
    name: "Sault Ste. Marie Innovation Centre",
    category: "Community",
    target: "https://www.ssmic.com/",
    websiteUrl: "https://www.ssmic.com/",
    order: 480,
  },

  // First Nations
  {
    slug: "batchewana",
    name: "Batchewana First Nation",
    category: "First Nations",
    target: "https://batchewana.ca/",
    websiteUrl: "https://batchewana.ca/",
    order: 490,
  },
  {
    slug: "garden-river",
    name: "Garden River First Nation",
    category: "First Nations",
    target: "https://www.gardenriver.org/",
    websiteUrl: "https://www.gardenriver.org/",
    order: 500,
  },

  // Industry
  {
    slug: "algoma-steel",
    name: "Algoma Steel",
    category: "Industry",
    target: "https://www.algoma.com/",
    websiteUrl: "https://www.algoma.com/",
    order: 510,
  },
];
