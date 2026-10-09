"use client";

import { useState } from "react";
import { Loader2, Phone } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { availabilityQuoteDetails, quotePrefillHref } from "@/lib/quote-prefill";

const fieldClass = "field-dark";

/**
 * Shown only after an address has been checked. The lookup itself is not stored.
 * A name and phone become an inbox callback. The quote link only opens a form.
 */
export function AvailabilityFollowUp({
  address,
  note,
  speeds,
}: {
  address: string;
  note: string;
  speeds: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const quoteHref = quotePrefillHref({
    interest: "internet",
    address,
    details: availabilityQuoteDetails(address, note, speeds),
  });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const phone = String(form.get("phone") ?? "");
    const email = String(form.get("email") ?? "");
    const message = [
      "Please call me about internet at this address.",
      address,
      speeds ? `Speeds shown:\n${speeds}` : note,
    ]
      .filter(Boolean)
      .join("\n\n");

    try {
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CALLBACK",
          name,
          phone,
          email,
          subject: `Internet at ${address}`.slice(0, 200),
          message,
          sourcePage: "/internet-availability",
          addressLine1: address.slice(0, 300),
          serviceInterest: "Internet",
          website_url: form.get("website_url") ?? "",
        }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(data.message ?? "The request could not be sent.");
      setDone(true);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-navy-950/55 p-6 backdrop-blur-md">
        <h3 className="text-lg font-bold text-white">Request this at this address</h3>
        <p className="mt-2 text-sm leading-relaxed text-navy-200">
          The quote form opens with this street and the speeds from the check already filled in.
        </p>
        <p className="mt-3 text-sm font-semibold text-white">{address}</p>
        {speeds ? (
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-navy-300">{speeds}</p>
        ) : null}
        <ButtonLink href={quoteHref} variant="accent" className="mt-5 whitespace-normal">
          Request this at this address
        </ButtonLink>
      </div>

      <div className="rounded-2xl border border-white/10 bg-navy-950/55 p-6 backdrop-blur-md">
        <h3 className="text-lg font-bold text-white">Have someone call you</h3>
        <p className="mt-2 text-sm leading-relaxed text-navy-200">
          Leave a name and phone. We will call about this address. A check by itself is not saved.
        </p>
        {done ? (
          <p className="mt-5 rounded-lg border border-accent-400/40 bg-accent-500/15 px-4 py-3 text-sm font-semibold text-accent-100" role="status">
            Thank you. We will call the number you left. For urgent work call 1-800-705-3189.
          </p>
        ) : (
          <form onSubmit={(event) => void submit(event)} className="mt-5 space-y-4">
            <input type="text" name="website_url" tabIndex={-1} autoComplete="off" className="hidden" />
            <label className="block text-sm font-semibold text-navy-100">
              Name
              <input name="name" required autoComplete="name" className={`${fieldClass} mt-1.5`} />
            </label>
            <label className="block text-sm font-semibold text-navy-100">
              Phone
              <input name="phone" type="tel" required autoComplete="tel" className={`${fieldClass} mt-1.5`} />
            </label>
            <label className="block text-sm font-semibold text-navy-100">
              Email <span className="font-medium text-navy-300">(optional)</span>
              <input name="email" type="email" autoComplete="email" className={`${fieldClass} mt-1.5`} />
            </label>
            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" variant="onDark" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Phone className="size-4" aria-hidden="true" />}
              {busy ? "Sending…" : "Call me about this address"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
