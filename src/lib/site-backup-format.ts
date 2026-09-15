/**
 * On-disk layout for a site snapshot. Shared by the admin download and
 * backup.sh so a file from either place can be restored by the other.
 *
 * The archive is a gzip tar whose top-level entries are:
 *   manifest.json
 *   database.sql.gz
 *   uploads.tar.gz
 *
 * It does not include source code, Docker images, TLS certificates, or .env.
 * Those live on the machine (and in git). If the whole server is gone you
 * still need this file plus a fresh deploy with the existing .env.
 */

export const SITE_BACKUP_FORMAT = "wirelesscom.site-backup";
export const SITE_BACKUP_VERSION = 1;
export const SITE_BACKUP_CONFIRM = "RESTORE";
export const SITE_BACKUP_MAX_BYTES = 2 * 1024 * 1024 * 1024;

export const MANIFEST_NAME = "manifest.json";
export const DATABASE_NAME = "database.sql.gz";
export const UPLOADS_NAME = "uploads.tar.gz";

const FILE_RE = /^wirelesscom-backup-\d{8}-\d{6}\.tar\.gz$/;

export type SiteBackupManifest = {
  format: typeof SITE_BACKUP_FORMAT;
  version: number;
  createdAt: string;
};

export function backupFileName(at = new Date()): string {
  const iso = at.toISOString();
  const date = iso.slice(0, 10).replaceAll("-", "");
  const time = iso.slice(11, 19).replaceAll(":", "");
  return `wirelesscom-backup-${date}-${time}.tar.gz`;
}

export function isBackupFileName(name: string): boolean {
  return FILE_RE.test(name);
}

export function parseManifest(raw: string): SiteBackupManifest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error("That file is not a WirelessCom site backup.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("That file is not a WirelessCom site backup.");
  }
  const data = parsed as Record<string, unknown>;
  if (data.format !== SITE_BACKUP_FORMAT) {
    throw new Error("That file is not a WirelessCom site backup.");
  }
  if (data.version !== SITE_BACKUP_VERSION) {
    throw new Error("That backup was made by a newer version of the site.");
  }
  if (typeof data.createdAt !== "string" || data.createdAt.length < 10) {
    throw new Error("That backup is missing its creation time.");
  }
  return {
    format: SITE_BACKUP_FORMAT,
    version: SITE_BACKUP_VERSION,
    createdAt: data.createdAt,
  };
}

export function manifestJson(createdAt = new Date()): string {
  const body: SiteBackupManifest = {
    format: SITE_BACKUP_FORMAT,
    version: SITE_BACKUP_VERSION,
    createdAt: createdAt.toISOString(),
  };
  return `${JSON.stringify(body, null, 2)}\n`;
}

export function archivePathIsUnsafe(entry: string): boolean {
  const name = normalizeTarEntry(entry);
  if (!name) return false;
  if (name.startsWith("/") || /^[a-zA-Z]:/.test(name)) return true;
  const parts = name.split("/");
  return parts.some((part) => part === "..");
}

export function normalizeTarEntry(entry: string): string {
  return entry.trim().replaceAll("\\", "/").replace(/^\.\//, "");
}
