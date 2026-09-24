import { locationLabel } from "@/lib/internet-availability/catalog";

type Offering = {
  id?: string;
  description?: string;
  audience?: string;
};

type ServicePoint = {
  category?: string;
  properties?: Record<string, string>;
};

type QualifiedTech = {
  available?: boolean;
  future?: boolean;
  speeds?: unknown[];
  profiles?: unknown[];
  supportStatuses?: unknown[];
  rateBands?: string[];
};

export type QualificationResult = {
  successIndicator?: string;
  addressMatch?: string;
  addressMatches?: Array<{
    address?: AddressParts;
    qualificationID?: string;
    rateBand?: string;
    streetSysID?: string;
    vpmsSysID?: string;
  }>;
  paging?: {
    pagingIndicator?: string;
    moreInd?: string;
    [key: string]: unknown;
  };
  servicePoints?: ServicePoint[];
  offerings?: Offering[];
  qualifiedServices?: Record<string, Record<string, QualifiedTech>>;
  qualifiedNow?: boolean;
  futureService?: boolean;
  needsSelection?: boolean;
};

type AddressParts = {
  streetNumber?: string;
  streetNumberSuffix?: string;
  streetName?: string;
  streetType?: string;
  streetDirection?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  locations?: Array<{ type?: string; value?: string }>;
};

export type AvailabilityContinuation = {
  mode: "qid" | "address";
  qualificationId?: string;
  province?: string;
  rateBand?: string;
  streetSysId?: string;
  vpmsSysId?: string;
  address?: AddressParts;
};

export type AvailabilityView = {
  tone: "success" | "warning" | "error";
  message: string;
  needsSelection: boolean;
  matches: Array<{
    label: string;
    detail: string;
    continuation: AvailabilityContinuation;
  }>;
  hasMoreMatches: boolean;
  paging: QualificationResult["paging"] | null;
  services: {
    groups: Array<{
      title: string;
      technologies: Array<{ name: string; tiers: string[] }>;
    }>;
    rateBand: string | null;
    technical: Array<{
      title: string;
      rows: Array<{ label: string; value: string }>;
    }>;
  } | null;
};

const PROPERTY_LABELS: Record<string, string> = {
  QualificationID: "Qualification ID",
  WholesaleType: "Wholesale Type",
  RateBand: "Rate Band",
  NetworkType: "Network Type",
  IsBondable: "Pair Bonding Supported",
  DownloadSpeed: "Raw Download Speed",
  UploadSpeed: "Raw Upload Speed",
  EstimatedDownloadSpeed: "Estimated Download Speed",
  EstimatedUploadSpeed: "Estimated Upload Speed",
  DownloadSpeedPB: "Pair Bonded Download Speed",
  UploadSpeedPB: "Pair Bonded Upload Speed",
  EstimatedDownloadSpeedPB: "Estimated Pair Bonded Download Speed",
  EstimatedUploadSpeedPB: "Estimated Pair Bonded Upload Speed",
  EstimatedDownloadSpeedFib: "Estimated Fibre Download Speed",
  EstimatedUploadSpeedFib: "Estimated Fibre Upload Speed",
  DownloadSpeedBus: "Raw Business Download Speed",
  UploadSpeedBus: "Raw Business Upload Speed",
  EstimatedDownloadSpeedBus: "Estimated Business Download Speed",
  EstimatedUploadSpeedBus: "Estimated Business Upload Speed",
  DownloadSpeedPBBus: "Raw Pair Bonded Business Download Speed",
  UploadSpeedPBBus: "Raw Pair Bonded Business Upload Speed",
  EstimatedDownloadSpeedPBBus: "Estimated Pair Bonded Business Download Speed",
  EstimatedUploadSpeedPBBus: "Estimated Pair Bonded Business Upload Speed",
  EstimatedDownloadSpeedFibBus: "Estimated Business Fibre Download Speed",
  EstimatedUploadSpeedFibBus: "Estimated Business Fibre Upload Speed",
  FutureDate: "Future Service Date",
  RemoteHost: "Remote / Host",
  TroubleIndicator: "Trouble Indicator",
  ResBus: "Location Type",
};

export function presentAvailability(
  message: string,
  result: QualificationResult,
): AvailabilityView {
  const needsSelection = Boolean(result.needsSelection);
  const matches = (result.addressMatches ?? []).map((match) => ({
    label: formatAddress(match.address ?? {}),
    detail: [result.addressMatch, match.rateBand ? `Rate Band ${match.rateBand}` : ""]
      .filter(Boolean)
      .join(" · "),
    continuation: continuationFor(match),
  }));

  const showServices =
    !needsSelection &&
    (hasQualifiedServices(result.qualifiedServices) ||
      (result.offerings?.length ?? 0) > 0 ||
      (result.servicePoints?.length ?? 0) > 0);

  return {
    tone: toneFor(result),
    message: customerMessage(message, result),
    needsSelection,
    matches: needsSelection ? matches : [],
    hasMoreMatches: hasMore(result.paging),
    paging: hasMore(result.paging) ? result.paging ?? null : null,
    services: showServices ? buildServices(result) : null,
  };
}

function continuationFor(
  match: NonNullable<QualificationResult["addressMatches"]>[number],
): AvailabilityContinuation {
  const province = match.address?.province || "";
  if (match.qualificationID && /^\d{9}$/.test(match.qualificationID)) {
    return {
      mode: "qid",
      qualificationId: match.qualificationID,
      province,
      rateBand: match.rateBand || "",
    };
  }
  return {
    mode: "address",
    streetSysId: match.streetSysID || "",
    vpmsSysId: match.vpmsSysID || "",
    province,
    address: match.address,
  };
}

function toneFor(result: QualificationResult): AvailabilityView["tone"] {
  if (result.successIndicator === "Failed") return "error";
  if (result.qualifiedNow) return "success";
  if (result.needsSelection || result.futureService) return "warning";
  return "warning";
}

function customerMessage(message: string, result: QualificationResult): string {
  if (result.needsSelection) {
    return "More than one address matches. Select the correct one to see fibre and copper service.";
  }
  if (result.qualifiedNow) {
    return "Internet service is available for this address.";
  }
  if (result.futureService) {
    return "Service at this address is expected later. Call WirelessCom and we will confirm the date.";
  }
  if (result.successIndicator === "Failed") {
    return "We could not confirm internet service at this address. Check the street details or call us.";
  }
  return message
    .replace(/\bBell\b/g, "WirelessCom")
    .replace(/auracom/gi, "WirelessCom");
}

function hasMore(paging: QualificationResult["paging"]): boolean {
  if (!paging) return false;
  return (
    String(paging.pagingIndicator || "").toLowerCase() === "yes" &&
    String(paging.moreInd || "").toUpperCase() === "Y"
  );
}

function hasQualifiedServices(
  qualified: QualificationResult["qualifiedServices"],
): boolean {
  if (!qualified) return false;
  return Object.values(qualified).some((audience) =>
    Object.values(audience ?? {}).some((technology) => {
      if (!technology) return false;
      if (technology.available) return true;
      if (technology.profiles?.length) return true;
      if (technology.speeds?.length) return true;
      return false;
    }),
  );
}

function buildServices(result: QualificationResult): AvailabilityView["services"] {
  const grouped = buildSellableTierGroups(result);
  const groups = (
    [
      ["Residential", "Residential"],
      ["Business", "Business Internet"],
    ] as const
  )
    .map(([audience, title]) => {
      const technologies = (["DSL", "FTTN", "FTTN_PB", "FTTP"] as const)
        .map((technology) => {
          const speeds = grouped[audience][technology];
          const available =
            technology === "FTTN_PB"
              ? speeds.length > 0
              : speeds.length > 0 ||
                isQualifiedTechnologyAvailable(result, audience, technology);
          if (!available) return null;
          const tiers = speeds.length
            ? speeds.map(formatSellableTier)
            : ["Available"];
          return {
            name:
              technology === "FTTP"
                ? "FTTP / Fibre"
                : technology === "FTTN_PB"
                  ? "FTTN Pair-Bonded"
                  : technology,
            tiers,
          };
        })
        .filter((item): item is { name: string; tiers: string[] } => Boolean(item));
      return { title, technologies };
    })
    .filter((group) => group.technologies.length > 0);

  const bands = collectRateBands(result);
  return {
    groups,
    rateBand: bands.length ? bands.join(", ") : null,
    technical: technicalDetails(result.servicePoints ?? []),
  };
}

type TierGroups = Record<"Residential" | "Business", Record<"DSL" | "FTTN" | "FTTN_PB" | "FTTP", number[]>>;

function buildSellableTierGroups(result: QualificationResult): TierGroups {
  const groups: TierGroups = {
    Residential: { DSL: [], FTTN: [], FTTN_PB: [], FTTP: [] },
    Business: { DSL: [], FTTN: [], FTTN_PB: [], FTTP: [] },
  };

  for (const offering of result.offerings ?? []) {
    if (!offering || isHiddenCustomerOffering(offering)) continue;
    const audience = offeringAudience(offering);
    const technology = offeringTechnology(offering);
    const speed = offeringSpeed(offering);
    if (!audience || !technology || !Number.isFinite(speed)) continue;
    if (speed == null) continue;
    if (audience === "Residential" && technology === "DSL") {
      if (speed === 6) groups.Residential.DSL.push(6);
      continue;
    }
    if (speed > 0 && !(speed >= 8499 && speed <= 8501)) {
      groups[audience][technology].push(speed);
    }
  }

  for (const audience of Object.keys(groups) as Array<keyof TierGroups>) {
    for (const technology of Object.keys(groups[audience]) as Array<keyof TierGroups["Residential"]>) {
      groups[audience][technology] = [...new Set(groups[audience][technology])].sort((a, b) => a - b);
    }
  }
  return groups;
}

function offeringAudience(offering: Offering): "Residential" | "Business" | null {
  const audience = String(offering.audience || "").toLowerCase();
  const id = String(offering.id || "").toUpperCase();
  if (audience === "residential") return "Residential";
  if (audience === "business") return "Business";
  if (id.startsWith("GASFR")) return "Residential";
  if (id.startsWith("GASFB")) return "Business";
  return null;
}

function offeringSpeed(offering: Offering): number | null {
  const description = String(offering.description || "").trim();
  const id = String(offering.id || "").toUpperCase();
  if (id.includes("G1000") || /^FTTP\s+Gigabit$/i.test(description)) return 1000;
  if (id.includes("G1500") || /Gigabit\s+1\.5/i.test(description)) return 1500;
  if (id.includes("G3000") || /3\s+Gigabit/i.test(description)) return 3000;
  const match = description.match(/(\d+(?:\.\d+)?)/);
  return match ? Number.parseFloat(match[1]) : null;
}

function offeringTechnology(offering: Offering): "DSL" | "FTTN" | "FTTN_PB" | "FTTP" | null {
  const description = String(offering.description || "").toUpperCase();
  const id = String(offering.id || "").toUpperCase();
  if (description.includes("FTTP") || id.startsWith("GASFR") || id.startsWith("GASFB")) return "FTTP";
  if (description.includes("PBOND") || id.endsWith("PB")) return "FTTN_PB";
  if (description.includes("FTTN")) return "FTTN";
  if (description.includes("LEGACY")) return "DSL";
  return null;
}

function normalizeQualifiedTechnology(value: string): "DSL" | "FTTN" | "FTTP" | null {
  const text = value.trim().toUpperCase();
  if (!text) return null;
  if (text.includes("FTTP") || text.includes("FTTH") || text.includes("FIBRE") || text.includes("FIBER")) {
    return "FTTP";
  }
  if (text.includes("FTTN") || text.includes("VDSL")) return "FTTN";
  if (text.includes("ADSL") || text === "DSL") return "DSL";
  return null;
}

function isQualifiedTechnologyAvailable(
  result: QualificationResult,
  audience: string,
  technology: string,
): boolean {
  const qualified = result.qualifiedServices?.[audience];
  if (!qualified) return false;
  return Object.entries(qualified).some(([raw, service]) => {
    if (normalizeQualifiedTechnology(raw) !== technology || !service) return false;
    if (service.available || service.future) return true;
    if (service.speeds?.length || service.profiles?.length) return true;
    return Array.isArray(service.supportStatuses) && service.supportStatuses.length > 0;
  });
}

function isHiddenCustomerOffering(offering: Offering): boolean {
  const description = String(offering.description || offering.id || "").toLowerCase();
  return (
    /(^|\D)8500(?:\.0+)?\s*(?:mbps|mb\/s)?(\D|$)/i.test(description) ||
    /(^|\D)8\.5\s*(?:g(?:bps|b\/s|igabit)?)(\D|$)/i.test(description)
  );
}

function formatSellableTier(speed: number): string {
  if (speed >= 1000) {
    const gbps = speed / 1000;
    return `${gbps.toLocaleString("en-CA", { maximumFractionDigits: 2 })} Gbps`;
  }
  return `${speed.toLocaleString("en-CA", { maximumFractionDigits: 1 })} Mbps`;
}

function collectRateBands(result: QualificationResult): string[] {
  const bands: string[] = [];
  const add = (value: string | undefined) => {
    for (const item of String(value || "").split(",")) {
      const clean = item.trim();
      if (clean && !bands.includes(clean)) bands.push(clean);
    }
  };
  for (const point of result.servicePoints ?? []) add(point.properties?.RateBand);
  for (const audience of ["Residential", "Business"]) {
    for (const technology of Object.values(result.qualifiedServices?.[audience] ?? {})) {
      for (const band of technology.rateBands ?? []) add(band);
    }
  }
  return bands.sort();
}

function technicalDetails(points: ServicePoint[]): AvailabilityView["services"] extends infer T
  ? T extends { technical: infer U }
    ? U
    : never
  : never {
  return points.flatMap((point, index) => {
    const properties = point.properties ?? {};
    const rows = Object.entries(properties)
      .filter(([key, value]) => {
        if (value === "" || value == null) return false;
        if (/speed/i.test(key) && Math.abs(Number.parseFloat(value) - 8500) < 0.001) return false;
        return true;
      })
      .map(([key, value]) => ({ label: PROPERTY_LABELS[key] ?? humanize(key), value: String(value) }));
    if (!rows.length) return [];
    const title =
      points.length > 1 ? `${point.category || "Service point"} ${index + 1}` : point.category || "Service point";
    return [{ title, rows }];
  });
}

function humanize(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (character) => character.toUpperCase());
}

function formatAddress(address: AddressParts): string {
  const street = [
    address.streetNumber,
    address.streetNumberSuffix,
    address.streetName,
    address.streetType,
    address.streetDirection,
  ]
    .filter(Boolean)
    .join(" ");
  const locationText = (address.locations ?? [])
    .filter((location) => location.type || location.value)
    .map((location) => [location.type ? locationLabel(location.type) : "", location.value].filter(Boolean).join(" "))
    .join(", ");
  return [street, locationText, address.city, address.province, String(address.postalCode || "").replace(/\s+/g, "").toUpperCase()]
    .filter(Boolean)
    .join(", ");
}
