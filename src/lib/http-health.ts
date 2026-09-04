/**
 * Shared HTTP “is this answering?” rule for first-party fetches and public
 * uptime APIs. Safe to import from Node scripts; contains no hosts.
 */
export function httpStatusIsHealthy(status: number, expectStatus: number): boolean {
  if (expectStatus !== 200) return status === expectStatus;
  return status >= 200 && status < 500;
}
