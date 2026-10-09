const ADDRESS_LIMIT = 300;
const DETAILS_LIMIT = 1500;

export function clampQuoteText(value: string | undefined, limit: number): string {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, limit);
}

export function clampQuoteDetails(value: string | undefined): string {
  return (value ?? "").trim().slice(0, DETAILS_LIMIT);
}

/** Opens the public quote form with the address and a note already filled in. */
export function quotePrefillHref(input: {
  address?: string;
  details?: string;
  interest?: string;
}): string {
  const params = new URLSearchParams();
  const address = clampQuoteText(input.address, ADDRESS_LIMIT);
  const details = clampQuoteDetails(input.details);
  if (input.interest) params.set("interest", input.interest.slice(0, 40));
  if (address) params.set("address", address);
  if (details) params.set("details", details);
  const query = params.toString();
  return query ? `/request-quote?${query}` : "/request-quote";
}

export function availabilityQuoteDetails(
  address: string,
  note: string,
  speeds: string,
): string {
  const parts = [
    `Internet availability check for ${address}.`,
    note.trim(),
    speeds.trim() ? `Speeds shown for this address:\n${speeds.trim()}` : "",
    "Please quote internet service at this address.",
  ].filter(Boolean);
  return parts.join("\n\n").slice(0, DETAILS_LIMIT);
}
