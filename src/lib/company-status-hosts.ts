import "server-only";

/**
 * Hosts that must never appear on public status surfaces or in the visitor
 * payload, even if an administrator marks the row public.
 *
 * This module is server-only so the names never ship in client JavaScript.
 */
const COMPANY_HOST_SUFFIXES = [
  "wirelesscom.ca",
  "wirelesscom.org",
  "northernvoip.ca",
  "ssmonline.ca",
  "hyteraradios.ca",
] as const;

function hostFromValue(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;

  try {
    const url = trimmed.includes("://")
      ? new URL(trimmed)
      : new URL(`https://${trimmed}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    const host = trimmed.replace(/^www\./, "").split("/")[0] ?? "";
    return host || null;
  }
}

export function isCompanyStatusHost(value: string | null | undefined): boolean {
  const host = hostFromValue(value ?? "");
  if (!host) return false;
  return COMPANY_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );
}

export function textMentionsCompanyHost(text: string | null | undefined): boolean {
  const lower = (text ?? "").toLowerCase();
  if (!lower) return false;
  return COMPANY_HOST_SUFFIXES.some((suffix) => lower.includes(suffix));
}

/** Homepage a visitor may open. Never a probe URL, never a company host. */
export function publicWebsiteUrl(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  if (isCompanyStatusHost(trimmed)) return null;
  return trimmed;
}

export function shouldHidePublicMonitor(endpoint: {
  name: string;
  target: string;
  websiteUrl: string | null;
}): boolean {
  return (
    isCompanyStatusHost(endpoint.target) ||
    isCompanyStatusHost(endpoint.websiteUrl) ||
    textMentionsCompanyHost(endpoint.name) ||
    textMentionsCompanyHost(endpoint.websiteUrl)
  );
}
