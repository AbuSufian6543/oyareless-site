"use client";

import { useId, useState } from "react";
import {
  CircleCheck,
  FileText,
  LoaderCircle,
  Send,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";

import { TurnstileField } from "@/components/security/turnstile-field";
import { Button } from "@/components/ui/button";
import { RESUME_MAX_BYTES, RESUME_MAX_MB } from "@/lib/careers";
import { TURNSTILE_ACTIONS } from "@/lib/turnstile-constants";
import { formatBytes } from "@/lib/utils";

export function CareerApplyForm({
  jobId,
  jobTitle,
  turnstileSiteKey,
  successMessage,
}: {
  jobId?: string;
  jobTitle: string;
  turnstileSiteKey: string;
  successMessage?: string;
}) {
  const fileId = useId();
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [token, setToken] = useState("");
  const [widgetKey, setWidgetKey] = useState(0);
  const configured = Boolean(turnstileSiteKey);

  function chooseFile(next: File | null) {
    if (!next) {
      setFile(null);
      return;
    }
    if (next.size > RESUME_MAX_BYTES) {
      setFile(null);
      setState("error");
      setErrorMessage(`Please choose a PDF smaller than ${RESUME_MAX_MB} MB.`);
      return;
    }
    const name = next.name.toLowerCase();
    const type = next.type.toLowerCase();
    if (
      (type && type !== "application/pdf" && type !== "application/x-pdf") ||
      (name && !name.endsWith(".pdf"))
    ) {
      setFile(null);
      setState("error");
      setErrorMessage("Please upload a PDF résumé.");
      return;
    }
    setErrorMessage("");
    if (state === "error") setState("idle");
    setFile(next);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) return;
    const form = event.currentTarget;
    if (!file) {
      setState("error");
      setErrorMessage("Please attach your résumé as a PDF.");
      return;
    }
    if (!token) {
      setState("error");
      setErrorMessage("Please complete the human check before sending.");
      return;
    }

    const payload = new FormData(form);
    payload.set("resume", file);
    payload.set("cf-turnstile-response", token);
    if (jobId) payload.set("jobId", jobId);

    setState("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/careers/apply", {
        method: "POST",
        body: payload,
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      if (response.ok) {
        setState("success");
        form.reset();
        setFile(null);
        setToken("");
        return;
      }
      setState("error");
      setErrorMessage(
        data.message ?? "We could not send your application. Please try again.",
      );
      setToken("");
      setWidgetKey((value) => value + 1);
    } catch {
      setState("error");
      setErrorMessage("Network error. Please try again.");
    }
  }

  if (state === "success") {
    return (
      <div
        className="flex flex-col items-center gap-4 rounded-xl border border-accent-200 bg-accent-50 p-10 text-center"
        role="status"
      >
        <CircleCheck className="size-11 text-accent-600" aria-hidden="true" />
        <h3 className="text-lg font-bold text-navy-800">Application received</h3>
        <p className="max-w-md text-slate-600">
          {successMessage ||
            `Thank you. We have your résumé for ${jobTitle} and will be in touch if there is a fit.`}
        </p>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="mt-1 text-sm font-semibold text-brand-600 underline underline-offset-2"
        >
          Submit another application
        </button>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm leading-relaxed text-amber-950">
        <p className="font-semibold">Applications are not open on the website right now.</p>
        <p className="mt-2">
          Human verification is not configured yet, so we are not accepting résumé
          uploads. Please check back shortly.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="relative rounded-xl border border-slate-200 bg-white p-6 shadow-card lg:p-8"
    >
      <div className="absolute -left-[9999px] size-px overflow-hidden" aria-hidden="true">
        <label htmlFor="website_url">Leave this field empty</label>
        <input
          id="website_url"
          name="website_url"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" name="name" required autoComplete="name" />
        <Field
          label="Email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
        <Field
          label="Phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
        />
        <Field
          label="City"
          name="location"
          autoComplete="address-level2"
        />
        <div className="sm:col-span-2">
          <label
            htmlFor="message"
            className="mb-1.5 block text-sm font-semibold text-navy-800"
          >
            Cover note
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            className="field resize-y"
            placeholder={`A few lines about why you are a fit for ${jobTitle}.`}
          />
        </div>
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-sm font-semibold text-navy-800">
            Résumé <span className="text-red-500">*</span>
          </p>
          <p className="mb-2.5 text-xs leading-relaxed text-slate-500">
            PDF only, {RESUME_MAX_MB} MB maximum. The file is stored privately for
            hiring staff — it is not published on the site.
          </p>
          {file ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <FileText className="size-5 shrink-0 text-brand-600" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy-900">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => chooseFile(null)}
                className="inline-flex size-8 items-center justify-center rounded-full text-slate-500 hover:bg-white hover:text-navy-900"
                aria-label="Remove file"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor={fileId}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/80 px-4 py-8 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                chooseFile(event.dataTransfer.files[0] ?? null);
              }}
            >
              <Upload className="size-6 text-brand-600" aria-hidden="true" />
              <span className="text-sm font-semibold text-navy-800">
                Choose a PDF résumé
              </span>
              <span className="text-xs text-slate-500">or drop a file here</span>
              <input
                id={fileId}
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
              />
            </label>
          )}
        </div>
        <div className="sm:col-span-2">
          <p className="mb-2 text-sm font-semibold text-navy-800">
            Human check <span className="text-red-500">*</span>
          </p>
          <TurnstileField
            key={widgetKey}
            siteKey={turnstileSiteKey}
            action={TURNSTILE_ACTIONS.careersApply}
            onToken={setToken}
          />
        </div>
      </div>

      {state === "error" && (
        <div
          className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-800"
          role="alert"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {errorMessage}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={state === "loading"} size="lg">
          {state === "loading" ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="size-4" aria-hidden="true" />
          )}
          {state === "loading" ? "Sending…" : "Submit application"}
        </Button>
        <p className="text-xs text-slate-500">Fields marked * are required.</p>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-sm font-semibold text-navy-800"
      >
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="field"
      />
    </div>
  );
}
