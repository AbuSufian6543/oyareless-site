"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

const AREAS = [
  "IT services",
  "Cybersecurity",
  "Firewalls",
  "AI cameras & phones",
  "Networking / Wi-Fi",
  "VoIP telephone",
  "Video surveillance",
  "Alarm security",
  "Access control",
  "Cabling / fiber",
  "Two-way radio",
  "EV charging",
  "Web development",
  "Other",
];

export function QuoteForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const serviceAreas = AREAS.filter((area) => form.get(`area-${area}`) === "on");
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: form.get("contactName"),
          email: form.get("email"),
          phone: form.get("phone"),
          companyName: form.get("companyName"),
          siteAddress: form.get("siteAddress"),
          details: form.get("details"),
          timeframe: form.get("timeframe"),
          budgetRange: form.get("budgetRange"),
          serviceAreas,
          website_url: form.get("website_url"),
          sourcePage: "/request-quote",
        }),
      });
      const data = (await response.json()) as { message?: string; reference?: string };
      if (!response.ok) throw new Error(data.message ?? "The request could not be sent.");
      setDone(data.reference ?? "received");
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="surface-card border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
        Thank you. Your quote request is {done}. We will reply to the email you
        gave. For urgent work call 1-800-705-3189.
      </p>
    );
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-5">
      <input type="text" name="website_url" tabIndex={-1} autoComplete="off" className="hidden" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="contactName" label="Your name" required />
        <Field name="email" label="Email" type="email" required />
        <Field name="phone" label="Phone" />
        <Field name="companyName" label="Company" />
      </div>
      <Field name="siteAddress" label="Site address" />
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-navy-800">Services of interest</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {AREAS.map((area) => (
            <label key={area} className="flex items-center gap-2 text-sm text-navy-800">
              <input type="checkbox" name={`area-${area}`} className="size-4 accent-brand-600" />
              {area}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="timeframe" label="Timeframe" placeholder="e.g. this quarter" />
        <Field name="budgetRange" label="Budget range" placeholder="optional" />
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-navy-800">Project details</span>
        <textarea
          name="details"
          required
          rows={6}
          className="field resize-y"
        />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={busy}>
        {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
        Request a quote
      </Button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-navy-800">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="field"
      />
    </label>
  );
}
