"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export type ToolId =
  | "dns"
  | "tcp"
  | "port"
  | "whois"
  | "tls"
  | "headers"
  | "domain-security"
  | "dnsbl"
  | "oui"
  | "ip";

export function ToolForm({
  tool,
  label,
  placeholder,
  extra,
  hint,
}: {
  tool: ToolId;
  label: string;
  placeholder: string;
  extra?: "port";
  hint?: string;
}) {
  const [target, setTarget] = useState("");
  const [port, setPort] = useState(extra === "port" ? "443" : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<unknown>(null);

  async function run(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool,
          target,
          port: extra === "port" ? Number.parseInt(port, 10) : undefined,
        }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(data.message ?? "The lookup failed.");
      setResult(data);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={(event) => void run(event)} className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor={`${tool}-target`}>
          {label}
        </label>
        <input
          id={`${tool}-target`}
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          placeholder={placeholder}
          required={tool !== "ip"}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-navy-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        {extra === "port" && (
          <input
            value={port}
            onChange={(event) => setPort(event.target.value)}
            inputMode="numeric"
            aria-label="Port"
            className="w-24 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-navy-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        )}
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
          Look up
        </button>
      </form>
      {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {result !== null && <ResultView data={result} />}
    </div>
  );
}

function ResultView({ data }: { data: unknown }) {
  if (data && typeof data === "object" && "text" in data && typeof data.text === "string") {
    return (
      <pre className="mt-4 max-h-96 overflow-auto rounded-lg bg-navy-950 p-4 text-xs leading-relaxed text-navy-100">
        {data.text}
      </pre>
    );
  }

  return (
    <dl className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
      {flatten(data).map(([key, value]) => (
        <div key={key} className="grid gap-1 sm:grid-cols-[10rem_1fr]">
          <dt className="font-semibold text-navy-700">{key}</dt>
          <dd className="break-all font-mono text-xs text-navy-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function flatten(value: unknown, prefix = ""): Array<[string, string]> {
  if (value === null || value === undefined) return [[prefix || "value", "—"]];
  if (typeof value !== "object") return [[prefix || "value", String(value)]];
  if (Array.isArray(value)) {
    if (value.length === 0) return [[prefix || "items", "(none)"]];
    return value.flatMap((item, index) =>
      flatten(item, prefix ? `${prefix}[${index}]` : `[${index}]`),
    );
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) =>
    flatten(item, prefix ? `${prefix}.${key}` : key),
  );
}

export function ToolCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
      <h2 className="text-lg font-bold text-navy-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}
