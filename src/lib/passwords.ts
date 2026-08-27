import bcrypt from "bcryptjs";

/**
 * Password helpers kept free of `server-only` so build scripts (the seed) can
 * reuse exactly the same hashing and strength rules as the running app.
 */

const BCRYPT_ROUNDS = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export type PasswordProblem = string | null;

/**
 * Deliberately stricter than a typical marketing site: these accounts can
 * publish content and read customer inquiries.
 */
export function validatePasswordStrength(password: string): PasswordProblem {
  if (password.length < 12) {
    return "Password must be at least 12 characters long.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must include a lowercase letter.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must include an uppercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include a number.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include a symbol.";
  }
  return null;
}

export function hashRecoveryCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((code) => bcrypt.hash(code, 10)));
}

export function verifyRecoveryCode(
  code: string,
  hashes: string[],
): Promise<boolean> {
  return Promise.all(hashes.map((hash) => bcrypt.compare(code, hash))).then(
    (results) => results.some(Boolean),
  );
}
