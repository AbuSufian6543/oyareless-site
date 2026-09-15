"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Alert, inputClass } from "@/components/admin/ui";
import { SITE_BACKUP_CONFIRM } from "@/lib/site-backup-format";
import { formatBytes } from "@/lib/utils";

type Snapshot = {
  name: string;
  bytes: number;
  createdAt: string;
};

export function BackupPanel({ snapshots }: { snapshots: Snapshot[] }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<"download" | "upload" | "stored" | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function downloadBackup() {
    setError(null);
    setDone(null);
    setBusy("download");
    try {
      const response = await fetch("/api/admin/backup");
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message || "The backup could not be created.");
      }
      const blob = await response.blob();
      const header = response.headers.get("content-disposition") ?? "";
      const matched = /filename="([^"]+)"/.exec(header);
      const name = matched?.[1] ?? "wirelesscom-backup.tar.gz";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setDone(`Saved ${name}. Copy it off this computer as well.`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The backup could not be created.");
    } finally {
      setBusy(null);
    }
  }

  async function restoreStored(name: string) {
    setError(null);
    setDone(null);
    setBusy("stored");
    try {
      const response = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, confirm, password }),
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(body?.message || "The restore could not be completed.");
      }
      setDone(`Restored ${name}. Reload the admin if a page looks stale.`);
      setPassword("");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The restore could not be completed.");
    } finally {
      setBusy(null);
    }
  }

  function restoreUpload() {
    if (!file) {
      setError("Choose a backup file first.");
      return;
    }
    setError(null);
    setDone(null);
    setBusy("upload");
    setProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/backup");
    xhr.setRequestHeader("x-wc-confirm", confirm);
    xhr.setRequestHeader("x-wc-password", password);
    xhr.setRequestHeader("content-type", "application/gzip");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onerror = () => {
      setBusy(null);
      setError("The upload was interrupted.");
    };
    xhr.onload = () => {
      setBusy(null);
      let body: { message?: string; restored?: string } | null = null;
      try {
        body = JSON.parse(xhr.responseText) as { message?: string; restored?: string };
      } catch {
        body = null;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        setError(body?.message || "The restore could not be completed.");
        return;
      }
      setDone(
        `Restored ${body?.restored ?? file.name}. Reload the admin if a page looks stale.`,
      );
      setPassword("");
      router.refresh();
    };
    xhr.send(file);
  }

  const locked = busy !== null;
  const canRestore = confirm.trim() === SITE_BACKUP_CONFIRM && password.length > 0 && !locked;

  return (
    <div className="space-y-5">
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {done ? <Alert tone="success">{done}</Alert> : null}

      <button
        type="button"
        disabled={locked}
        onClick={() => void downloadBackup()}
        className="inline-flex items-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:bg-slate-300"
      >
        {busy === "download" ? "Preparing snapshot…" : "Download a full backup"}
      </button>
      <p className="text-xs text-slate-500">
        The browser waits while Postgres is dumped and uploads are packed. Keep a
        copy off this machine — a file that only lives here disappears with the
        server.
      </p>

      {snapshots.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-navy-900">
            Snapshots already on this server
          </h3>
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {snapshots.map((item) => (
              <li
                key={item.name}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
              >
                <span>
                  <span className="font-mono text-xs text-navy-800">{item.name}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    {formatBytes(item.bytes)}
                  </span>
                </span>
                <button
                  type="button"
                  disabled={!canRestore}
                  onClick={() => void restoreStored(item.name)}
                  className="text-xs font-semibold text-brand-700 hover:underline disabled:text-slate-400"
                >
                  Restore this copy
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          No snapshots are stored on this server yet. Download one to create the
          first copy.
        </p>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-navy-900">Restore from a file</h3>
        <input
          type="file"
          accept=".tar.gz,application/gzip"
          disabled={locked}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="block w-full text-sm"
        />
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-navy-800">
            Type {SITE_BACKUP_CONFIRM} to replace the live database and uploads
          </span>
          <input
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className={inputClass}
            autoComplete="off"
            disabled={locked}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-navy-800">Your password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
            autoComplete="current-password"
            disabled={locked}
          />
        </label>
        {busy === "upload" && progress > 0 ? (
          <p className="text-xs text-slate-500">Uploading {progress}%</p>
        ) : null}
        <button
          type="button"
          disabled={!canRestore || !file}
          onClick={restoreUpload}
          className="rounded-lg border border-red-300 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
        >
          {busy === "upload" ? "Restoring…" : "Upload and restore"}
        </button>
      </div>
    </div>
  );
}
