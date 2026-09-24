import "server-only";

import {
  presentAvailability,
  type AvailabilityView,
  type QualificationResult,
} from "@/lib/internet-availability/present";

const LOOKUP_URL = "https://www.auracom.net/wp-admin/admin-ajax.php";
const PAGE_URL = "https://www.auracom.net/whprequal/";

type NonceCache = { value: string; expiresAt: number };
let nonceCache: NonceCache | null = null;

export type AddressLookup = {
  mode: "address";
  streetNumber: string;
  streetNumberSuffix: string;
  streetName: string;
  streetType: string;
  streetDirection: string;
  city: string;
  province: string;
  postalCode: string;
  locations: Array<{ type: string; value: string }>;
  vpmsSysId?: string;
  streetSysId?: string;
  paging?: Record<string, unknown> | null;
};

export type QidLookup = {
  mode: "qid";
  qualificationId: string;
  province: string;
  rateBand: string;
};

export async function lookupAvailability(
  input: AddressLookup | QidLookup,
): Promise<AvailabilityView> {
  const nonce = await freshNonce();
  const body = new URLSearchParams();
  body.set("action", "bell_lookup");
  body.set("nonce", nonce);
  body.set("queryMode", input.mode === "qid" ? "qid" : "address");

  if (input.mode === "qid") {
    body.set("qualificationID", input.qualificationId);
    body.set("province", input.province);
    body.set("rateBand", input.rateBand);
  } else {
    body.set("streetNumber", input.streetNumber);
    body.set("streetNumberSuffix", input.streetNumberSuffix);
    body.set("streetName", input.streetName);
    body.set("streetType", input.streetType);
    body.set("streetDirection", input.streetDirection);
    body.set("city", input.city);
    body.set("province", input.province);
    body.set("postalCode", input.postalCode);
    body.set("vpmsSysID", input.vpmsSysId ?? "");
    body.set("streetSysID", input.streetSysId ?? "");
    body.set("locations", JSON.stringify(input.locations));
    if (input.paging) body.set("paging", JSON.stringify(input.paging));
  }

  const response = await fetch(LOOKUP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Referer: PAGE_URL,
      "User-Agent": "WirelessCom-Availability/1.0",
    },
    body: body.toString(),
    cache: "no-store",
  });

  const json = (await response.json().catch(() => null)) as {
    success?: boolean;
    data?: { message?: string; result?: QualificationResult };
  } | null;

  if (!response.ok || !json?.success || !json.data?.result) {
    nonceCache = null;
    throw new Error("unavailable");
  }

  return presentAvailability(json.data.message || "", json.data.result);
}

async function freshNonce(): Promise<string> {
  if (nonceCache && nonceCache.expiresAt > Date.now()) return nonceCache.value;

  const page = await fetch(PAGE_URL, {
    headers: { "User-Agent": "WirelessCom-Availability/1.0" },
    cache: "no-store",
  });
  const html = await page.text();
  const match = html.match(/"nonce":"([a-f0-9]+)"/);
  if (!page.ok || !match) throw new Error("unavailable");

  nonceCache = { value: match[1], expiresAt: Date.now() + 10 * 60 * 1000 };
  return match[1];
}
