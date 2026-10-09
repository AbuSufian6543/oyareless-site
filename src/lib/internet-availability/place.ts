/** Starting place for an availability check. The customer can change both. */
export const DEFAULT_AVAILABILITY_CITY = "Sault Ste. Marie";
export const DEFAULT_AVAILABILITY_PROVINCE = "ON";

export function availabilityCity(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_AVAILABILITY_CITY;
  const city = value.replace(/\s+/g, " ").trim().slice(0, 80);
  return city || DEFAULT_AVAILABILITY_CITY;
}

export function availabilityProvince(value: unknown): "ON" | "QC" {
  return value === "QC" ? "QC" : "ON";
}
