import { readFileSync } from "node:fs";
import path from "node:path";

import {
  archivePathIsUnsafe,
  backupFileName,
  isBackupFileName,
  parseManifest,
  SITE_BACKUP_CONFIRM,
  SITE_BACKUP_FORMAT,
} from "../src/lib/site-backup-format";

let failed = 0;

function assert(label: string, ok: boolean) {
  if (ok) console.log(`  OK    ${label}`);
  else {
    failed += 1;
    console.log(`  FAIL  ${label}`);
  }
}

function read(relative: string) {
  return readFileSync(path.join(process.cwd(), relative), "utf8");
}

assert("restore confirmation is RESTORE", SITE_BACKUP_CONFIRM === "RESTORE");
assert(
  "backup file names are stamped and not path-like",
  isBackupFileName(backupFileName(new Date("2026-09-15T15:04:05.000Z"))) &&
    backupFileName(new Date("2026-09-15T15:04:05.000Z")) ===
      "wirelesscom-backup-20260915-150405.tar.gz" &&
    !isBackupFileName("../wirelesscom-backup-20260915-150405.tar.gz") &&
    !isBackupFileName("wirelesscom-backup-20260915-150405.tar.gz.bak"),
);

const manifest = parseManifest(
  JSON.stringify({
    format: SITE_BACKUP_FORMAT,
    version: 1,
    createdAt: "2026-09-15T15:04:05.000Z",
  }),
);
assert("manifest round-trip keeps the format id", manifest.format === SITE_BACKUP_FORMAT);

let rejected = false;
try {
  parseManifest(JSON.stringify({ format: "zip", version: 1, createdAt: "2026-09-15" }));
} catch {
  rejected = true;
}
assert("foreign archives are rejected", rejected);

assert("absolute tar members are refused", archivePathIsUnsafe("/etc/passwd"));
assert("parent tar members are refused", archivePathIsUnsafe("../secret"));
assert("ordinary tar members are allowed", !archivePathIsUnsafe("private/resumes/a.pdf"));

const api = read("src/app/api/admin/backup/route.ts");
assert(
  "download and restore require a super admin",
  api.includes('requireRole("SUPERADMIN")') &&
    api.includes("verifyPassword") &&
    api.includes("SITE_BACKUP_CONFIRM") &&
    !api.includes(".env"),
);

const page = read("src/app/admin/backup/page.tsx");
assert(
  "the backup page is super-admin only",
  page.includes('requireAdminRole("SUPERADMIN")'),
);

const lib = read("src/lib/site-backup.ts");
assert(
  "snapshots do not pack .env or source",
  !lib.includes('".env"') &&
    lib.includes("pg_dump") &&
    lib.includes("UPLOADS_NAME"),
);

const shell = read("src/components/admin/admin-shell.tsx");
assert(
  "backup sits with other super-admin configuration links",
  shell.includes('href: "/admin/backup"') &&
    shell.includes("STAFF_ROLE_RANK.SUPERADMIN"),
);

const nginx = read("docker/nginx/wirelesscom.conf.template");
assert(
  "nginx allows a large restore body on the backup API only",
  nginx.includes("location /api/admin/backup") &&
    nginx.includes("client_max_body_size 2g"),
);

const compose = read("docker-compose.yml");
assert(
  "backups use a volume separate from the database",
  compose.includes("backups:/app/backups") &&
    compose.includes("db-data:/var/lib/postgresql/data"),
);

const docker = read("Dockerfile");
assert(
  "the app image includes Postgres 17 client tools",
  docker.includes("postgresql-client-17") && docker.includes("/app/backups"),
);

process.exit(failed === 0 ? 0 : 1);
