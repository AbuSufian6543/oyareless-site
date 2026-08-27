/**
 * Pure client-side networking maths. Nothing here talks to a server.
 */

export type IPv4Network = {
  address: string;
  prefix: number;
  mask: string;
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  hosts: number;
  wildcard: string;
};

export function parseIPv4Cidr(input: string): IPv4Network | null {
  const match = input.trim().match(/^(\d{1,3}(?:\.\d{1,3}){3})(?:\/(\d{1,2}))?$/);
  if (!match) return null;
  const address = match[1];
  const prefix = match[2] ? Number.parseInt(match[2], 10) : 32;
  if (prefix < 0 || prefix > 32) return null;
  const ip = ipv4ToInt(address);
  if (ip === null) return null;

  const maskInt = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const networkInt = (ip & maskInt) >>> 0;
  const broadcastInt = (networkInt | (~maskInt >>> 0)) >>> 0;
  const hosts =
    prefix >= 31 ? (prefix === 32 ? 1 : 2) : Math.max(0, broadcastInt - networkInt - 1);

  const first = prefix >= 31 ? networkInt : networkInt + 1;
  const last = prefix >= 31 ? broadcastInt : broadcastInt - 1;

  return {
    address,
    prefix,
    mask: intToIPv4(maskInt),
    network: intToIPv4(networkInt),
    broadcast: intToIPv4(broadcastInt),
    firstHost: intToIPv4(first),
    lastHost: intToIPv4(last),
    hosts,
    wildcard: intToIPv4((~maskInt) >>> 0),
  };
}

export function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return null;
  }
  return (((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0);
}

export function intToIPv4(value: number): string {
  return [
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255,
  ].join(".");
}

export function expandIPv6(ip: string): string | null {
  const trimmed = ip.trim();
  if (!trimmed.includes(":")) return null;
  const [head, tail] = trimmed.split("::");
  const headParts = head ? head.split(":").filter(Boolean) : [];
  const tailParts = tail ? tail.split(":").filter(Boolean) : [];
  if (headParts.length + tailParts.length > 8) return null;
  const missing = 8 - (headParts.length + tailParts.length);
  const parts = [
    ...headParts,
    ...Array.from({ length: Math.max(missing, 0) }, () => "0"),
    ...tailParts,
  ];
  if (parts.length !== 8) return null;
  return parts.map((part) => part.padStart(4, "0")).join(":").toLowerCase();
}

export type CableResult = {
  category: string;
  maxLengthM: number;
  typicalGbps: string;
  poe: string;
  notes: string;
};

export const CABLE_CATEGORIES: CableResult[] = [
  {
    category: "Cat5e",
    maxLengthM: 100,
    typicalGbps: "1 Gbps",
    poe: "PoE / PoE+",
    notes: "Fine for 1G access ports. Do not spec for new 2.5G+ work.",
  },
  {
    category: "Cat6",
    maxLengthM: 100,
    typicalGbps: "1 Gbps (10 Gbps to ~55 m)",
    poe: "PoE / PoE+ / PoE++",
    notes: "Standard for new office drops. 10G only on short runs.",
  },
  {
    category: "Cat6A",
    maxLengthM: 100,
    typicalGbps: "10 Gbps",
    poe: "PoE++",
    notes: "Preferred for Wi-Fi 6/7 access points and 10G backbone.",
  },
  {
    category: "Cat7 / Cat8",
    maxLengthM: 30,
    typicalGbps: "25–40 Gbps (short)",
    poe: "PoE++",
    notes: "Data-centre and short high-speed links, not typical office runs.",
  },
  {
    category: "OM3 fibre",
    maxLengthM: 300,
    typicalGbps: "10 Gbps",
    poe: "n/a — fibre does not carry PoE",
    notes: "Multimode. Use for building backbone and camera rooms over 100 m.",
  },
  {
    category: "OS2 fibre",
    maxLengthM: 10_000,
    typicalGbps: "10 Gbps+",
    poe: "n/a — fibre does not carry PoE",
    notes: "Single-mode. Campus and long outdoor runs.",
  },
];

export type PoeClass = {
  name: string;
  standard: string;
  wattsAtPd: number;
  wattsAtPse: number;
  pairs: string;
};

export const POE_CLASSES: PoeClass[] = [
  { name: "PoE (Type 1)", standard: "IEEE 802.3af", wattsAtPd: 12.95, wattsAtPse: 15.4, pairs: "2" },
  { name: "PoE+ (Type 2)", standard: "IEEE 802.3at", wattsAtPd: 25.5, wattsAtPse: 30, pairs: "2" },
  { name: "PoE++ (Type 3)", standard: "IEEE 802.3bt", wattsAtPd: 51, wattsAtPse: 60, pairs: "4" },
  { name: "PoE++ (Type 4)", standard: "IEEE 802.3bt", wattsAtPd: 71, wattsAtPse: 90, pairs: "4" },
];

export function recommendPoe(deviceWatts: number): PoeClass | null {
  if (!Number.isFinite(deviceWatts) || deviceWatts <= 0) return null;
  return POE_CLASSES.find((row) => row.wattsAtPd >= deviceWatts) ?? null;
}
