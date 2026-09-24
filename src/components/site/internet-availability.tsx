"use client";

import { useState } from "react";
import { Check, Loader2, MapPin, Plus, Wifi } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { TechBackdrop } from "@/components/visuals/tech-backdrop";
import {
  LOCATION_TYPES,
  PROVINCES,
  STREET_DIRECTIONS,
  STREET_TYPES,
} from "@/lib/internet-availability/catalog";
import type { AvailabilityContinuation, AvailabilityView } from "@/lib/internet-availability/present";
import { cn } from "@/lib/utils";

const fieldClass = "field-dark";

type LocationRow = { id: number; type: string; value: string };

const emptyForm = {
  streetNumber: "",
  streetNumberSuffix: "",
  streetName: "",
  streetType: "",
  streetDirection: "",
  city: "",
  province: "ON",
  postalCode: "",
};

export function InternetAvailabilityChecker() {
  const [form, setForm] = useState(emptyForm);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [nextLocationId, setNextLocationId] = useState(1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AvailabilityView | null>(null);

  function update(name: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(payload: Record<string, unknown>) {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/internet-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as AvailabilityView & { message?: string };
      if (!response.ok) {
        setResult(null);
        setError(data.message || "We could not check that address.");
        return;
      }
      setResult(data);
    } catch {
      setResult(null);
      setError("We could not check that address. Please try again.");
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const filled = locations.filter((row) => row.type || row.value);
    if (filled.some((row) => !row.type || !row.value)) {
      setError("Each location needs both a type and a value.");
      return;
    }
    void submit({
      mode: "address",
      ...form,
      locations: filled.map((row) => ({ type: row.type, value: row.value.trim() })),
    });
  }

  return (
    <section id="availability" className="relative isolate scroll-mt-28 overflow-hidden bg-navy-950 py-14 text-white lg:py-20">
      <TechBackdrop network density={0.62} glow="left" mood="network" scrim="section" />
      <div className="container-page relative">
        <div className="mx-auto max-w-5xl">
          <p className="eyebrow-pill">Fibre and copper</p>
          <h2 className="mt-4 max-w-2xl text-balance-tight text-3xl font-bold leading-tight text-white lg:text-[2.5rem]">
            Check internet availability
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-navy-200 lg:text-lg">
            Enter the service address. WirelessCom will show the fibre and copper speeds available at that location.
          </p>

          <form
            onSubmit={onSubmit}
            className="scheme-dark mt-8 rounded-2xl border border-white/10 bg-navy-950/70 p-5 shadow-[0_24px_60px_rgb(4_19_37_/_0.45)] backdrop-blur-md sm:p-7"
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-12">
              <Field label="Street number" required className="lg:col-span-2">
                <input required value={form.streetNumber} onChange={(event) => update("streetNumber", event.target.value)} className={fieldClass} />
              </Field>
              <Field label="Number suffix" className="lg:col-span-2">
                <input value={form.streetNumberSuffix} onChange={(event) => update("streetNumberSuffix", event.target.value)} placeholder="A" className={fieldClass} />
              </Field>
              <Field label="Street name" required className="sm:col-span-2 lg:col-span-4">
                <input required value={form.streetName} onChange={(event) => update("streetName", event.target.value)} className={fieldClass} />
              </Field>
              <Field label="Street type" className="lg:col-span-2">
                <select value={form.streetType} onChange={(event) => update("streetType", event.target.value)} className={fieldClass}>
                  <option value="">Select</option>
                  {STREET_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </Field>
              <Field label="Direction" className="lg:col-span-2">
                <select value={form.streetDirection} onChange={(event) => update("streetDirection", event.target.value)} className={fieldClass}>
                  <option value="">None</option>
                  {STREET_DIRECTIONS.map((direction) => (
                    <option key={direction} value={direction}>{direction}</option>
                  ))}
                </select>
              </Field>
              <Field label="City / municipality" required className="sm:col-span-2 lg:col-span-6">
                <input required value={form.city} onChange={(event) => update("city", event.target.value)} className={fieldClass} />
              </Field>
              <Field label="Province" required className="lg:col-span-3">
                <select required value={form.province} onChange={(event) => update("province", event.target.value)} className={fieldClass}>
                  {PROVINCES.map((province) => (
                    <option key={province.value} value={province.value}>{province.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Postal code" className="lg:col-span-3">
                <input
                  value={form.postalCode}
                  onChange={(event) => update("postalCode", event.target.value.toUpperCase())}
                  placeholder="K1P5N5"
                  maxLength={7}
                  autoComplete="postal-code"
                  className={fieldClass}
                />
              </Field>
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Location / unit</h3>
                  <p className="mt-1 text-sm leading-relaxed text-navy-300">
                    Optional. Add apartment, unit, floor or other location details when required.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={locations.length >= 4}
                  onClick={() => {
                    setLocations((rows) => [...rows, { id: nextLocationId, type: "", value: "" }]);
                    setNextLocationId((id) => id + 1);
                  }}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/20 px-3.5 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:text-navy-400"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add location
                </button>
              </div>
              <ul className="mt-4 space-y-3">
                {locations.map((row) => (
                  <li key={row.id} className="grid gap-4 rounded-xl border border-white/10 bg-navy-900/60 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
                    <label className="block text-sm font-semibold text-navy-100">
                      Location type
                      <select
                        value={row.type}
                        onChange={(event) =>
                          setLocations((rows) => rows.map((item) => item.id === row.id ? { ...item, type: event.target.value } : item))
                        }
                        className={fieldClass}
                      >
                        <option value="">Select</option>
                        {LOCATION_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm font-semibold text-navy-100">
                      Location value
                      <input
                        value={row.value}
                        onChange={(event) =>
                          setLocations((rows) => rows.map((item) => item.id === row.id ? { ...item, value: event.target.value } : item))
                        }
                        placeholder="e.g. 8"
                        className={fieldClass}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setLocations((rows) => rows.filter((item) => item.id !== row.id))}
                      className="pb-2.5 text-sm font-semibold text-navy-300 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Button type="submit" disabled={pending} size="lg" variant="accent">
                {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Wifi className="size-4" aria-hidden="true" />}
                {pending ? "Checking…" : "Check availability"}
              </Button>
              {result ? (
                <Button
                  type="button"
                  variant="onDark"
                  size="lg"
                  onClick={() => {
                    setResult(null);
                    setError("");
                  }}
                >
                  Check another address
                </Button>
              ) : null}
              <p className="text-xs text-navy-300">Fields marked * are required.</p>
            </div>
            {error ? (
              <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800" role="alert">
                {error}
              </p>
            ) : null}
          </form>

          {result ? (
            <AvailabilityResult
              result={result}
              pending={pending}
              onSelect={(continuation) => {
                if (continuation.mode === "qid") {
                  void submit({
                    mode: "qid",
                    qualificationId: continuation.qualificationId,
                    province: continuation.province || form.province,
                    rateBand: continuation.rateBand || "",
                  });
                  return;
                }
                const address = continuation.address;
                void submit({
                  mode: "address",
                  streetNumber: address?.streetNumber || form.streetNumber,
                  streetNumberSuffix: address?.streetNumberSuffix || form.streetNumberSuffix,
                  streetName: address?.streetName || form.streetName,
                  streetType: address?.streetType || form.streetType,
                  streetDirection: address?.streetDirection || form.streetDirection,
                  city: address?.city || form.city,
                  province: address?.province || continuation.province || form.province,
                  postalCode: address?.postalCode || form.postalCode,
                  locations: (address?.locations ?? []).filter((row) => row.type && row.value),
                  vpmsSysId: continuation.vpmsSysId || "",
                  streetSysId: continuation.streetSysId || "",
                });
              }}
              onMore={() => {
                const filled = locations.filter((row) => row.type && row.value);
                void submit({
                  mode: "address",
                  ...form,
                  locations: filled.map((row) => ({ type: row.type, value: row.value.trim() })),
                  paging: result.paging,
                });
              }}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block text-sm font-semibold text-navy-100", className)}>
      <span className="mb-1.5 block">
        {label}
        {required ? <span className="ml-0.5 text-accent-300">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function AvailabilityResult({
  result,
  pending,
  onSelect,
  onMore,
}: {
  result: AvailabilityView;
  pending: boolean;
  onSelect: (continuation: AvailabilityContinuation) => void;
  onMore: () => void;
}) {
  return (
    <div className="mt-6 space-y-5">
      <div
        className={cn(
          "rounded-xl border px-5 py-4 text-sm font-semibold",
          result.tone === "success" && "border-accent-400/40 bg-accent-500/15 text-accent-100",
          result.tone === "warning" && "border-amber-300/40 bg-amber-400/10 text-amber-100",
          result.tone === "error" && "border-red-400/40 bg-red-500/10 text-red-100",
        )}
        role="status"
      >
        {result.message}
      </div>

      {result.needsSelection && result.matches.length > 0 ? (
        <div className="rounded-2xl border border-white/10 bg-navy-950/55 p-6 backdrop-blur-md">
          <h3 className="text-base font-bold text-white">Select the correct address</h3>
          <ul className="mt-4 space-y-3">
            {result.matches.map((match) => (
              <li key={match.label} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-navy-900/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="flex items-start gap-2 text-sm font-semibold text-white">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-accent-300" aria-hidden="true" />
                    {match.label}
                  </p>
                  {match.detail ? <p className="mt-1 text-xs text-navy-300">{match.detail}</p> : null}
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onSelect(match.continuation)}
                  className="rounded-lg bg-accent-500 px-3.5 py-2 text-sm font-semibold text-navy-950 hover:bg-accent-400 disabled:opacity-60"
                >
                  Use this address
                </button>
              </li>
            ))}
          </ul>
          {result.hasMoreMatches && result.paging ? (
            <button
              type="button"
              disabled={pending}
              onClick={onMore}
              className="mt-4 text-sm font-semibold text-accent-300 hover:underline"
            >
              Load more matches
            </button>
          ) : null}
        </div>
      ) : null}

      {result.services ? (
        <div className="rounded-2xl border border-white/10 bg-navy-950/55 p-6 backdrop-blur-md sm:p-8">
          <h3 className="text-xl font-bold text-white">Available services</h3>
          <p className="mt-1 text-sm leading-relaxed text-navy-300">Fibre and copper tiers WirelessCom can deliver at this address.</p>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {result.services.groups.map((group) => (
              <section key={group.title} className="rounded-xl border border-white/10 bg-white/5 p-5">
                <h4 className="text-base font-bold text-white">{group.title}</h4>
                <div className="mt-4 space-y-4">
                  {group.technologies.map((technology) => (
                    <div key={technology.name}>
                      <h5 className="eyebrow text-accent-300/80">{technology.name}</h5>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {technology.tiers.map((tier) => (
                          <li key={`${technology.name}-${tier}`} className="inline-flex items-center gap-1.5 rounded-full border border-accent-400/25 bg-accent-500/10 px-3 py-1 text-sm font-semibold text-white">
                            <Check className="size-3.5 text-accent-300" aria-hidden="true" />
                            {tier}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
          {result.services.rateBand ? (
            <p className="mt-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-navy-100">
              Rate band: {result.services.rateBand}
            </p>
          ) : null}
          {result.services.technical.length > 0 ? (
            <details className="mt-4 rounded-xl border border-white/10 px-4 py-3">
              <summary className="cursor-pointer text-sm font-bold text-white">Technical details</summary>
              <div className="mt-4 space-y-5">
                {result.services.technical.map((group) => (
                  <div key={group.title}>
                    <h4 className="text-sm font-bold text-navy-100">{group.title}</h4>
                    <dl className="mt-2 divide-y divide-white/10 text-sm">
                      {group.rows.map((row) => (
                        <div key={`${group.title}-${row.label}`} className="grid gap-1 py-1.5 sm:grid-cols-[16rem_1fr]">
                          <dt className="text-navy-300">{row.label}</dt>
                          <dd className="font-medium text-white">{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </details>
          ) : null}
          <div className="mt-5">
            <ButtonLink href="/request-quote" variant="accent" size="sm">
              Request this service
            </ButtonLink>
          </div>
        </div>
      ) : null}
    </div>
  );
}
