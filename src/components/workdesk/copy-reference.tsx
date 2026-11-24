"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyReference({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 font-mono text-xs font-semibold text-slate-600 hover:border-brand-300 hover:text-navy-900"
    >
      {value}
      {copied ? <Check className="size-3.5 text-emerald-600" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
      <span className="sr-only">{copied ? "Copied" : "Copy task number"}</span>
    </button>
  );
}
