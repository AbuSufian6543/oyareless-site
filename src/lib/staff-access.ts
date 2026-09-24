/**
 * Module access for staff roles. Kept free of `server-only` so the admin
 * sidebar can use the same rules as the route guards.
 *
 * Rank is not enough for Manager: they need some Editor/Admin modules
 * (Knowledge, Operations, Enquiries) without Content or Configuration.
 * Giving them a rank of Editor or Admin would open those other areas.
 */

import type { Role } from "@/generated/prisma/client";
import type { CollectionDefinition } from "@/lib/admin-collections";
import { roleMeetsMinimum } from "@/lib/workdesk/rules";

export type RoleHolder = { role: Role } | null | undefined;
export type StaffAccessCheck = (user: NonNullable<RoleHolder>) => boolean;

export function canAccessWorkdesk(user: RoleHolder): boolean {
  return Boolean(user && roleMeetsMinimum(user.role, "EMPLOYEE"));
}

export function canAccessContent(user: RoleHolder): boolean {
  return Boolean(user && roleMeetsMinimum(user.role, "EDITOR"));
}

export function canAccessCatalogue(user: RoleHolder): boolean {
  return canAccessContent(user);
}

export function canAccessKnowledge(user: RoleHolder): boolean {
  if (!user) return false;
  return user.role === "MANAGER" || roleMeetsMinimum(user.role, "EDITOR");
}

export function canAccessOperations(user: RoleHolder): boolean {
  if (!user) return false;
  return user.role === "MANAGER" || roleMeetsMinimum(user.role, "ADMIN");
}

export function canAccessEnquiries(user: RoleHolder): boolean {
  if (!user) return false;
  return user.role === "MANAGER" || roleMeetsMinimum(user.role, "EDITOR");
}

/**
 * Permanent removal of inbox messages and quote requests.
 * Editors can triage Enquiries; only managers and admins can delete them.
 * Manager sits below Editor in rank, so this cannot be a minimum-rank check.
 */
export function canDeleteEnquiries(user: RoleHolder): boolean {
  if (!user) return false;
  return user.role === "MANAGER" || roleMeetsMinimum(user.role, "ADMIN");
}

/** Career applications stay with editors and above — not managers. */
export function canAccessApplications(user: RoleHolder): boolean {
  return canAccessContent(user);
}

export function canAccessPortalUsers(user: RoleHolder): boolean {
  if (!user) return false;
  return user.role === "MANAGER" || roleMeetsMinimum(user.role, "ADMIN");
}

export function canAccessConfiguration(user: RoleHolder): boolean {
  return Boolean(user && roleMeetsMinimum(user.role, "ADMIN"));
}

export function canWriteCollection(
  user: RoleHolder,
  collection: CollectionDefinition,
): boolean {
  if (!user) return false;
  if (collection.group === "Knowledge") return canAccessKnowledge(user);
  if (collection.group === "Operations") return canAccessOperations(user);
  return roleMeetsMinimum(user.role, collection.writeRole);
}

export function canDeleteCollection(
  user: RoleHolder,
  collection: CollectionDefinition,
): boolean {
  if (!user) return false;
  if (
    user.role === "MANAGER" &&
    (collection.group === "Knowledge" || collection.group === "Operations")
  ) {
    return true;
  }
  return roleMeetsMinimum(user.role, "ADMIN");
}

export function navItemVisible(
  user: RoleHolder,
  item: { minRank?: number; allow?: StaffAccessCheck },
  rank: number,
): boolean {
  if (!user) return false;
  if (item.allow) return item.allow(user);
  if (item.minRank == null) return true;
  return rank >= item.minRank;
}
