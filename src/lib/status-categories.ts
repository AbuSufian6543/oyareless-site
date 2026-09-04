/**
 * Grouping labels for the public network-status board.
 *
 * Safe to import from client components: it contains no probe targets and no
 * internal host names.
 */
export const STATUS_CATEGORY_ORDER = [
  "News",
  "Social",
  "Government",
  "Emergency",
  "Health",
  "Education",
  "Utilities",
  "Travel",
  "Community",
  "First Nations",
  "Industry",
  "Other",
] as const;

export type StatusCategory = (typeof STATUS_CATEGORY_ORDER)[number];

export const STATUS_CATEGORY_OPTIONS = STATUS_CATEGORY_ORDER.map((value) => ({
  value,
  label: value,
}));
