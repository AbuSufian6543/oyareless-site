/**
 * Shared helpers for staff notification inboxes. Safe to import from client
 * components — no Node or database access.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Unique, lowercased addresses from a comma / semicolon / newline list. */
export function parseNotifyEmails(raw: string): string[] {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const part of raw.split(/[,;\n]+/)) {
    const email = part.trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email) || seen.has(email)) continue;
    seen.add(email);
    list.push(email);
  }
  return list;
}

/** Tokens that look like attempted addresses but are not valid emails. */
export function invalidEmailTokens(raw: string): string[] {
  const seen = new Set<string>();
  const invalid: string[] = [];
  for (const part of raw.split(/[,;\n]+/)) {
    const token = part.trim();
    if (!token) continue;
    if (EMAIL_RE.test(token.toLowerCase())) continue;
    const key = token.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    invalid.push(token);
  }
  return invalid;
}
