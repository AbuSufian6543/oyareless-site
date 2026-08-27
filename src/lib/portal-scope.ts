/**
 * Tenant isolation for the customer portal.
 *
 * Every query that returns a ticket, document or service item must pass
 * through `scopeToCustomer`. Tests in scripts/check-portal-scope.ts prove a
 * mismatched customerId is refused.
 */

export class TenantIsolationError extends Error {
  constructor() {
    super("That record does not belong to this customer.");
    this.name = "TenantIsolationError";
  }
}

export function scopeToCustomer<T extends { customerId: string | null | undefined }>(
  record: T | null | undefined,
  customerId: string,
): T {
  if (!record || record.customerId !== customerId) {
    throw new TenantIsolationError();
  }
  return record;
}

export function scopedWhere(customerId: string): { customerId: string } {
  return { customerId };
}
