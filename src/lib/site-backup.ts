import "server-only";

import { spawn, spawnSync } from "node:child_process";
import { createReadStream, createWriteStream } from "node:fs";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  unlink,
  utimes,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { createGunzip, createGzip } from "node:zlib";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  archivePathIsUnsafe,
  backupFileName,
  DATABASE_NAME,
  isBackupFileName,
  MANIFEST_NAME,
  manifestJson,
  normalizeTarEntry,
  parseManifest,
  UPLOADS_NAME,
} from "@/lib/site-backup-format";

const KEEP_SNAPSHOTS = 10;
const LOCK_STALE_MS = 2 * 60 * 60 * 1000;
const TOOL_TIMEOUT_MS = 30 * 60 * 1000;

export class BackupError extends Error {}

export type BackupSnapshot = {
  name: string;
  bytes: number;
  createdAt: Date;
};

type PgTarget = {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
};

export function parsePostgresTarget(databaseUrl: string): PgTarget {
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new BackupError("DATABASE_URL is not a valid Postgres URL.");
  }
  const database = decodeURIComponent(url.pathname.replace(/^\//, "").split("/")[0] ?? "");
  if (!url.hostname || !database) {
    throw new BackupError("DATABASE_URL is missing a host or database name.");
  }
  return {
    host: url.hostname,
    port: url.port || "5432",
    user: decodeURIComponent(url.username || "wirelesscom"),
    password: decodeURIComponent(url.password || ""),
    database,
  };
}

function backupRoot(): string {
  return path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    env.backups.dir,
  );
}

function uploadRoot(): string {
  return path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    env.uploads.dir,
  );
}

function pgEnv(target: PgTarget): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PGHOST: target.host,
    PGPORT: target.port,
    PGUSER: target.user,
    PGPASSWORD: target.password,
    PGDATABASE: target.database,
    PGCONNECT_TIMEOUT: "15",
  };
}

function resolveTool(name: "pg_dump" | "psql" | "tar"): string {
  const override = process.env[`WC_BACKUP_${name.toUpperCase()}`]?.trim();
  if (override) return override;
  const finder = process.platform === "win32" ? "where" : "which";
  const probe = spawnSync(finder, [name], { encoding: "utf8", windowsHide: true });
  const line = (probe.stdout ?? "")
    .split(/\r?\n/)
    .map((row) => row.trim())
    .find(Boolean);
  if (probe.status === 0 && line) return line;
  throw new BackupError(
    `This server cannot run ${name}. On the live site it is included in the Docker image.`,
  );
}

function run(command: string, args: string[], options: {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  stdin?: NodeJS.ReadableStream;
  stdout?: NodeJS.WritableStream;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    const err: Buffer[] = [];
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new BackupError("The backup tool timed out."));
    }, TOOL_TIMEOUT_MS);

    if (options.stdin) {
      options.stdin.pipe(child.stdin);
    } else {
      child.stdin.end();
    }
    if (options.stdout) {
      child.stdout.pipe(options.stdout);
    } else {
      child.stdout.resume();
    }
    child.stderr.on("data", (chunk: Buffer) => {
      if (err.reduce((sum, part) => sum + part.length, 0) < 8000) err.push(chunk);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(new BackupError(error.message));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
        return;
      }
      const detail = Buffer.concat(err).toString("utf8").trim().slice(0, 400);
      reject(
        new BackupError(
          detail ? `Backup tool failed: ${detail}` : `Backup tool exited ${code ?? "early"}.`,
        ),
      );
    });
  });
}

async function emptyDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
  const entries = await readdir(dir, { withFileTypes: true });
  await Promise.all(
    entries.map((entry) =>
      rm(path.join(dir, entry.name), { recursive: true, force: true }),
    ),
  );
}

async function gzipFile(from: string, to: string): Promise<void> {
  await pipeline(createReadStream(from), createGzip({ level: 9 }), createWriteStream(to));
}

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const root = backupRoot();
  await mkdir(root, { recursive: true });
  const lockPath = path.join(root, ".lock");
  try {
    await writeFile(lockPath, String(process.pid), { flag: "wx" });
  } catch {
    const age = Date.now() - (await stat(lockPath).catch(() => ({ mtimeMs: 0 }))).mtimeMs;
    if (age < LOCK_STALE_MS) {
      throw new BackupError("A backup or restore is already running. Try again in a few minutes.");
    }
    await writeFile(lockPath, String(process.pid));
  }
  try {
    return await fn();
  } finally {
    await unlink(lockPath).catch(() => undefined);
  }
}

async function pruneSnapshots(): Promise<void> {
  const snapshots = await listBackupSnapshots();
  const extra = snapshots.slice(KEEP_SNAPSHOTS);
  await Promise.all(
    extra.map((item) => unlink(path.join(backupRoot(), item.name)).catch(() => undefined)),
  );
}

async function tarCreate(archive: string, cwd: string, files: string[]): Promise<void> {
  await run(resolveTool("tar"), ["-czf", archive, ...files], { cwd });
}

async function tarList(archive: string): Promise<string[]> {
  const tar = resolveTool("tar");
  const listed = spawnSync(tar, ["-tzf", archive], {
    encoding: "utf8",
    windowsHide: true,
    timeout: 60_000,
    maxBuffer: 8 * 1024 * 1024,
  });
  if (listed.status !== 0) {
    throw new BackupError("That file could not be read as a backup archive.");
  }
  return (listed.stdout ?? "")
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean);
}

async function tarExtract(archive: string, cwd: string): Promise<void> {
  const entries = await tarList(archive);
  if (entries.some(archivePathIsUnsafe)) {
    throw new BackupError("That archive contains an unsafe path and was refused.");
  }
  await mkdir(cwd, { recursive: true });
  await run(resolveTool("tar"), ["-xzf", archive, "-C", cwd], {});
}

async function dumpDatabase(sqlPath: string): Promise<void> {
  const target = parsePostgresTarget(env.databaseUrl);
  await run(
    resolveTool("pg_dump"),
    [
      "--no-owner",
      "--no-acl",
      "--clean",
      "--if-exists",
      "--format=plain",
      "-f",
      sqlPath,
    ],
    { env: pgEnv(target) },
  );
}

async function restoreDatabase(sqlGzPath: string): Promise<void> {
  const target = parsePostgresTarget(env.databaseUrl);
  await prisma.$disconnect().catch(() => undefined);

  await run(
    resolveTool("psql"),
    [
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid();",
    ],
    { env: pgEnv(target) },
  );

  const psql = spawn(
    resolveTool("psql"),
    ["-v", "ON_ERROR_STOP=1", "--quiet", "--dbname", target.database],
    { env: pgEnv(target), stdio: ["pipe", "pipe", "pipe"], windowsHide: true },
  );
  const err: Buffer[] = [];
  psql.stderr.on("data", (chunk: Buffer) => {
    if (err.reduce((sum, part) => sum + part.length, 0) < 8000) err.push(chunk);
  });
  psql.stdout.resume();

  await pipeline(createReadStream(sqlGzPath), createGunzip(), psql.stdin).catch((error) => {
    psql.kill("SIGKILL");
    throw error;
  });

  const code = await new Promise<number | null>((resolve, reject) => {
    const timer = setTimeout(() => {
      psql.kill("SIGKILL");
      reject(new BackupError("The restore timed out."));
    }, TOOL_TIMEOUT_MS);
    psql.on("error", (error) => {
      clearTimeout(timer);
      reject(new BackupError(error.message));
    });
    psql.on("close", (exit) => {
      clearTimeout(timer);
      resolve(exit);
    });
  });
  if (code !== 0) {
    const detail = Buffer.concat(err).toString("utf8").trim().slice(0, 400);
    throw new BackupError(
      detail ? `Restore failed: ${detail}` : "The database restore did not finish.",
    );
  }

  await prisma.$connect().catch(() => undefined);
}

export async function listBackupSnapshots(): Promise<BackupSnapshot[]> {
  const root = backupRoot();
  await mkdir(root, { recursive: true });
  const names = await readdir(root);
  const rows: BackupSnapshot[] = [];
  for (const name of names) {
    if (!isBackupFileName(name)) continue;
    const info = await stat(path.join(root, name)).catch(() => null);
    if (!info?.isFile()) continue;
    rows.push({ name, bytes: info.size, createdAt: info.mtime });
  }
  return rows.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
}

export async function createSiteBackup(): Promise<BackupSnapshot> {
  return withLock(async () => {
    const createdAt = new Date();
    const name = backupFileName(createdAt);
    const root = backupRoot();
    const work = await mkdtemp(path.join(tmpdir(), "wc-backup-"));
    const sql = path.join(work, "database.sql");
    const packed = path.join(root, name);
    try {
      await mkdir(root, { recursive: true });
      await mkdir(uploadRoot(), { recursive: true });
      await dumpDatabase(sql);
      await gzipFile(sql, path.join(work, DATABASE_NAME));
      await unlink(sql).catch(() => undefined);
      await writeFile(path.join(work, MANIFEST_NAME), manifestJson(createdAt));
      await tarCreate(path.join(work, UPLOADS_NAME), uploadRoot(), ["."]);
      await tarCreate(packed, work, [MANIFEST_NAME, DATABASE_NAME, UPLOADS_NAME]);
      await utimes(packed, createdAt, createdAt).catch(() => undefined);
      await pruneSnapshots();
      const info = await stat(packed);
      return { name, bytes: info.size, createdAt };
    } catch (error) {
      await unlink(packed).catch(() => undefined);
      throw error;
    } finally {
      await rm(work, { recursive: true, force: true });
    }
  });
}

export function backupFilePath(name: string): string {
  if (!isBackupFileName(name)) {
    throw new BackupError("That is not a site backup file.");
  }
  return path.join(backupRoot(), name);
}

async function restoreFromExtracted(work: string): Promise<void> {
  const manifestRaw = await readFile(path.join(work, MANIFEST_NAME), "utf8");
  parseManifest(manifestRaw);
  const sqlGz = path.join(work, DATABASE_NAME);
  const uploadsTar = path.join(work, UPLOADS_NAME);
  await stat(sqlGz);
  await restoreDatabase(sqlGz);
  if (await stat(uploadsTar).then(() => true, () => false)) {
    const uploadEntries = await tarList(uploadsTar);
    if (uploadEntries.some(archivePathIsUnsafe)) {
      throw new BackupError("The uploads archive contains an unsafe path and was refused.");
    }
    await emptyDir(uploadRoot());
    await tarExtract(uploadsTar, uploadRoot());
  }
}

export async function restoreSiteBackupFromFile(archivePath: string): Promise<void> {
  await withLock(async () => {
    const entries = await tarList(archivePath);
    if (entries.some(archivePathIsUnsafe)) {
      throw new BackupError("That archive contains an unsafe path and was refused.");
    }
    if (
      !entries.map(normalizeTarEntry).includes(MANIFEST_NAME) ||
      !entries.map(normalizeTarEntry).includes(DATABASE_NAME)
    ) {
      throw new BackupError("That file is missing database contents.");
    }
    const work = await mkdtemp(path.join(tmpdir(), "wc-restore-"));
    try {
      await tarExtract(archivePath, work);
      await restoreFromExtracted(work);
    } finally {
      await rm(work, { recursive: true, force: true });
    }
  });
}

export async function restoreStoredSnapshot(name: string): Promise<void> {
  await restoreSiteBackupFromFile(backupFilePath(name));
}

async function moveFile(from: string, to: string): Promise<void> {
  try {
    await rename(from, to);
  } catch {
    await copyFile(from, to);
    await unlink(from);
  }
}

/** Keep an uploaded archive as a named snapshot after it has been validated. */
export async function keepIncomingBackup(tempPath: string): Promise<string> {
  const entries = await tarList(tempPath);
  const names = entries.map(normalizeTarEntry);
  if (
    entries.some(archivePathIsUnsafe) ||
    !names.includes(MANIFEST_NAME) ||
    !names.includes(DATABASE_NAME)
  ) {
    throw new BackupError("That file is not a WirelessCom site backup.");
  }
  const root = backupRoot();
  await mkdir(root, { recursive: true });
  const name = backupFileName();
  await moveFile(tempPath, path.join(root, name));
  await pruneSnapshots();
  return name;
}
