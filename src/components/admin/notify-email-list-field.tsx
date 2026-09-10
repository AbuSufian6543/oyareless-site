"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Mail, Plus, X } from "lucide-react";

import { inputClass } from "@/components/admin/ui";
import {
  invalidEmailTokens,
  parseNotifyEmails,
} from "@/lib/notify-emails";
import { cn } from "@/lib/utils";

export function NotifyEmailListField({
  name,
  label,
  defaultValue,
  description,
  emptyHint,
  fallbackEmails,
  placeholder = "name@wirelesscom.ca",
}: {
  name: string;
  label: string;
  defaultValue: string;
  description?: string;
  emptyHint?: string;
  fallbackEmails?: string[];
  placeholder?: string;
}) {
  const inputId = useId();
  const hiddenRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [emails, setEmails] = useState(() => parseNotifyEmails(defaultValue));
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const emailsRef = useRef(emails);
  const draftRef = useRef(draft);
  emailsRef.current = emails;
  draftRef.current = draft;

  function mergeEmails(raw: string, current: string[]): string[] {
    const seen = new Set(current);
    const merged = [...current];
    for (const email of parseNotifyEmails(raw)) {
      if (seen.has(email)) continue;
      seen.add(email);
      merged.push(email);
    }
    return merged;
  }

  function syncHidden(next: string[]) {
    if (hiddenRef.current) hiddenRef.current.value = next.join("\n");
  }

  function addFromRaw(raw: string) {
    if (!raw.trim()) {
      setError(null);
      return;
    }
    const nextValid = parseNotifyEmails(raw);
    const invalid = invalidEmailTokens(raw);
    if (nextValid.length === 0) {
      setError("That does not look like an email address.");
      return;
    }

    const merged = mergeEmails(raw, emailsRef.current);
    emailsRef.current = merged;
    setEmails(merged);
    syncHidden(merged);
    setDraft("");
    draftRef.current = "";
    setError(
      invalid.length > 0
        ? `Ignored (not a valid address): ${invalid.join(", ")}`
        : null,
    );
  }

  function removeEmail(email: string) {
    const next = emailsRef.current.filter((item) => item !== email);
    emailsRef.current = next;
    setEmails(next);
    syncHidden(next);
    setError(null);
  }

  useEffect(() => {
    const form = wrapRef.current?.closest("form");
    if (!form) return;

    function onSubmit() {
      const leftover = draftRef.current.trim();
      if (!leftover) return;
      const merged = mergeEmails(leftover, emailsRef.current);
      emailsRef.current = merged;
      syncHidden(merged);
    }

    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, []);

  return (
    <div ref={wrapRef}>
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <label htmlFor={inputId} className="block text-sm font-semibold text-navy-800">
          {label}
        </label>
        <p className="text-xs font-medium text-slate-500" aria-live="polite">
          {emails.length === 0
            ? "None added yet"
            : emails.length === 1
              ? "1 address"
              : `${emails.length} addresses`}
        </p>
      </div>
      {description && (
        <p className="mb-3 text-sm leading-relaxed text-slate-600">{description}</p>
      )}

      <input
        ref={hiddenRef}
        type="hidden"
        name={name}
        defaultValue={emails.join("\n")}
      />

      {emails.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-2">
          {emails.map((email) => (
            <li key={email}>
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 py-1 pr-1 pl-2.5 text-sm font-medium text-brand-800">
                <Mail className="size-3.5 shrink-0 text-brand-600" aria-hidden="true" />
                <span className="truncate">{email}</span>
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  className="inline-flex size-6 items-center justify-center rounded-full text-brand-700 transition-colors hover:bg-white hover:text-navy-900"
                  aria-label={`Remove ${email}`}
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {emails.length === 0 && (emptyHint || (fallbackEmails && fallbackEmails.length > 0)) && (
        <div className="mb-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/80 px-3.5 py-3">
          <p className="text-sm text-slate-600">
            {emptyHint ??
              "Until you add addresses here, notifications use the office inboxes."}
          </p>
          {fallbackEmails && fallbackEmails.length > 0 && (
            <p className="mt-1.5 text-sm font-medium text-navy-800">
              {fallbackEmails.join(", ")}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={inputId}
          type="text"
          inputMode="email"
          value={draft}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={placeholder}
          onChange={(event) => {
            setDraft(event.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addFromRaw(draft);
            }
            if (event.key === "Backspace" && draft === "" && emails.length > 0) {
              event.preventDefault();
              removeEmail(emails[emails.length - 1]!);
            }
          }}
          onPaste={(event) => {
            const text = event.clipboardData.getData("text");
            if (/[,;\n]/.test(text)) {
              event.preventDefault();
              addFromRaw(text);
            }
          }}
          onBlur={() => {
            if (draft.trim()) addFromRaw(draft);
          }}
          className={cn(inputClass, "sm:flex-1")}
        />
        <button
          type="button"
          onClick={() => addFromRaw(draft)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-navy-800 transition-colors hover:border-brand-400 hover:text-brand-700"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add
        </button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        Press Enter or Add after each address. You can also paste a list separated
        by commas or new lines.
      </p>
      {error && (
        <p className="mt-2 text-xs font-medium text-amber-700" role="status">
          {error}
        </p>
      )}
    </div>
  );
}
