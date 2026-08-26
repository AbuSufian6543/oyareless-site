"use client";

import { useState } from "react";
import { CircleCheck, LoaderCircle, Send, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

export type ContactFormConfig = {
  formType: "CONTACT" | "SUPPORT" | "QUOTE" | "CALLBACK";
  showCompany: boolean;
  showAddress: boolean;
  showServiceInterest: boolean;
  successMessage: string;
  sourcePage: string;
  dark?: boolean;
};

const SERVICES = [
  "IT Services & Managed Support",
  "Cybersecurity",
  "Telephone / VoIP",
  "Internet Services",
  "Security & Alarm Systems",
  "Video Surveillance (CCTV)",
  "Access Control & Gates",
  "Data Cabling & Fiber Optic",
  "Two-Way Radios",
  "EV Charging",
  "Fleet Vehicle Tracking",
  "Live Video Broadcasting",
  "Digital Marketing & Signage",
  "Other",
];

export function ContactFormBlock({ config }: { config: ContactFormConfig }) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const dark = config.dark ?? false;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setState("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: config.formType,
          sourcePage: config.sourcePage,
          ...Object.fromEntries(formData.entries()),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (response.ok) {
        setState("success");
        form.reset();
        return;
      }

      setState("error");
      setErrorMessage(
        data.message ?? "We could not send your message. Please call us instead.",
      );
    } catch {
      setState("error");
      setErrorMessage("Network error. Please try again or call 1-800-705-3189.");
    }
  }

  if (state === "success") {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-4 rounded-xl border p-10 text-center",
          dark
            ? "border-accent-500/30 bg-accent-500/10"
            : "border-accent-200 bg-accent-50",
        )}
        role="status"
      >
        <CircleCheck
          className={cn("size-11", dark ? "text-accent-400" : "text-accent-600")}
          aria-hidden="true"
        />
        <h3 className={cn("text-lg font-bold", dark ? "text-white" : "text-navy-800")}>
          Message sent
        </h3>
        <p className={cn("max-w-md", dark ? "text-navy-200" : "text-slate-600")}>
          {config.successMessage}
        </p>
        <button
          type="button"
          onClick={() => setState("idle")}
          className={cn(
            "mt-1 text-sm font-semibold underline underline-offset-2",
            dark ? "text-accent-300" : "text-brand-600",
          )}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "rounded-xl border p-6 lg:p-8",
        dark ? "border-navy-700 bg-navy-800/60" : "border-slate-200 bg-white shadow-card",
      )}
      noValidate={false}
    >
      {/* Honeypot: bots fill hidden fields, humans never see this. */}
      <div className="absolute -left-[9999px] size-px overflow-hidden" aria-hidden="true">
        <label htmlFor="website_url">Leave this field empty</label>
        <input id="website_url" name="website_url" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" name="name" required dark={dark} autoComplete="name" />
        <Field
          label="Email"
          name="email"
          type="email"
          required
          dark={dark}
          autoComplete="email"
        />
        <Field
          label="Phone"
          name="phone"
          type="tel"
          required={config.formType !== "CONTACT"}
          dark={dark}
          autoComplete="tel"
        />
        {config.showCompany && (
          <Field
            label="Company"
            name="company"
            dark={dark}
            autoComplete="organization"
          />
        )}

        {config.showAddress && (
          <>
            <Field
              label="Address"
              name="addressLine1"
              dark={dark}
              autoComplete="address-line1"
              className="sm:col-span-2"
            />
            <Field label="City" name="city" dark={dark} autoComplete="address-level2" />
            <Field
              label="Postal code"
              name="postalCode"
              dark={dark}
              autoComplete="postal-code"
            />
          </>
        )}

        {config.showServiceInterest && (
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="serviceInterest" dark={dark}>
              Service of interest
            </FieldLabel>
            <select
              id="serviceInterest"
              name="serviceInterest"
              className={inputClass(dark)}
              defaultValue=""
            >
              <option value="">Select a service…</option>
              {SERVICES.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="sm:col-span-2">
          <FieldLabel htmlFor="subject" dark={dark}>
            Subject
          </FieldLabel>
          <input
            id="subject"
            name="subject"
            type="text"
            className={inputClass(dark)}
            autoComplete="off"
          />
        </div>

        <div className="sm:col-span-2">
          <FieldLabel htmlFor="message" dark={dark} required>
            {config.formType === "SUPPORT"
              ? "Describe the issue"
              : "How can we help?"}
          </FieldLabel>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            className={cn(inputClass(dark), "resize-y")}
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
        <button
          type="submit"
          disabled={state === "loading"}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md disabled:opacity-60"
        >
          {state === "loading" ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="size-4" aria-hidden="true" />
          )}
          {state === "loading" ? "Sending…" : "Send message"}
        </button>
        <p className={cn("text-xs", dark ? "text-navy-400" : "text-slate-500")}>
          Fields marked * are required.
        </p>
      </div>
    </form>
  );
}

function inputClass(dark: boolean): string {
  return cn(
    "w-full rounded-lg border px-3.5 py-2.5 text-[0.9375rem] transition-colors focus:outline-none",
    dark
      ? "border-navy-600 bg-navy-900 text-white placeholder:text-navy-500 focus:border-accent-500"
      : "border-slate-300 bg-white text-navy-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
  );
}

function FieldLabel({
  htmlFor,
  children,
  required,
  dark,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
  dark: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "mb-1.5 block text-sm font-semibold",
        dark ? "text-navy-100" : "text-navy-800",
      )}
    >
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  dark,
  autoComplete,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  dark: boolean;
  autoComplete?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <FieldLabel htmlFor={name} required={required} dark={dark}>
        {label}
      </FieldLabel>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className={inputClass(dark)}
      />
    </div>
  );
}
