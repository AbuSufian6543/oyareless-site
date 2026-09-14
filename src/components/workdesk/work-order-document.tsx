import type { ReactNode } from "react";

import {
  type WorkOrderCompany,
  type WorkOrderDocumentModel,
  type WorkOrderNote,
} from "@/lib/workdesk/work-order";
import { WorkOrderPrintBar } from "@/components/workdesk/work-order-print-bar";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="wo-keep min-w-0">
      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-snug text-navy-900">
        {value}
      </dd>
    </div>
  );
}

function Section({
  title,
  children,
  keep = true,
}: {
  title: string;
  children: ReactNode;
  keep?: boolean;
}) {
  return (
    <section className={keep ? "wo-keep mt-5" : "mt-5"}>
      <h2 className="border-b border-navy-900 pb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-navy-900">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function EmptyLine({ children }: { children: ReactNode }) {
  return <p className="text-sm italic text-slate-500">{children}</p>;
}

function NoteBadge({ note }: { note: WorkOrderNote }) {
  const tone =
    note.visibility === "internal"
      ? "border-amber-300 bg-amber-50 text-amber-900"
      : note.visibility === "customer"
        ? "border-slate-300 bg-slate-50 text-slate-700"
        : "border-brand-200 bg-brand-50 text-brand-800";
  return (
    <span
      className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone}`}
    >
      {note.visibilityLabel}
    </span>
  );
}

export function WorkOrderDocument({
  company,
  document,
}: {
  company: WorkOrderCompany;
  document: WorkOrderDocumentModel;
}) {
  const phones = [company.phone, company.localPhone].filter(Boolean);
  const assigned = document.assigned.length > 0 ? document.assigned.join(", ") : "Unassigned";

  return (
    <div className="work-order-page min-h-dvh bg-slate-200 print:bg-white">
      <WorkOrderPrintBar
        backHref={document.backHref}
        backLabel={document.backLabel}
        reference={document.reference}
      />
      <div className="px-3 py-6 print:p-0 sm:px-4">
        <article className="work-order-sheet mx-auto w-full max-w-[8.5in] bg-white px-7 py-7 text-navy-900 shadow-[0_18px_50px_-24px_rgba(7,30,57,0.45)] print:shadow-none sm:px-9">
          <header className="wo-keep flex flex-col gap-5 border-b-[3px] border-navy-900 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              {/* Native img so the logo survives print preview; next/image srcset is often skipped. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={company.logoUrl}
                alt={company.name}
                width={220}
                height={48}
                className="mb-3 h-11 w-auto max-w-[220px] object-contain object-left"
              />
              <p className="text-lg font-bold leading-tight tracking-tight text-navy-900">
                {company.name}
              </p>
              {company.tagline ? (
                <p className="mt-0.5 text-sm text-slate-600">{company.tagline}</p>
              ) : null}
              <address className="mt-3 not-italic text-[13px] leading-5 text-navy-800">
                {company.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
                {phones.length > 0 ? <span className="mt-2 block">{phones.join(" · ")}</span> : null}
                {company.email ? <span className="block">{company.email}</span> : null}
                <a
                  href={company.websiteUrl}
                  className="block text-brand-700 print:text-navy-800 print:no-underline"
                >
                  {company.websiteHost}
                </a>
                {company.hours ? (
                  <span className="mt-1 block text-slate-600">{company.hours}</span>
                ) : null}
              </address>
            </div>
            <div className="w-full shrink-0 rounded-sm border-2 border-navy-900 px-4 py-3 sm:w-[13.5rem]">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Work order
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-navy-900">
                {document.reference}
              </p>
              <p className="mt-2 text-sm font-semibold text-navy-800">{document.kindLabel}</p>
              <p className="mt-3 text-[11px] leading-4 text-slate-600">
                Printed {document.printedAtLabel}
                <span className="block">by {document.printedByName}</span>
              </p>
            </div>
          </header>

          <div className="wo-keep mt-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Job title
            </p>
            <h1 className="mt-1 text-xl font-bold leading-snug tracking-tight text-navy-900">
              {document.title}
            </h1>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
              <Fact label="Status" value={document.statusLabel} />
              <Fact label="Priority" value={document.priorityLabel} />
              <Fact label="Assigned" value={assigned} />
              <Fact label="Total time" value={document.totalDurationLabel} />
              {document.facts.map((fact) => (
                <Fact key={fact.label} label={fact.label} value={fact.value} />
              ))}
            </dl>
          </div>

          {document.customer ? (
            <Section title="Customer and site">
              <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                <Fact label="Customer" value={document.customer.name} />
                {document.customer.accountRef ? (
                  <Fact label="Account" value={document.customer.accountRef} />
                ) : null}
                {document.customer.phone ? (
                  <Fact label="Phone" value={document.customer.phone} />
                ) : null}
                {document.customer.email ? (
                  <Fact label="Email" value={document.customer.email} />
                ) : null}
                {document.customer.address ? (
                  <Fact label="Site address" value={document.customer.address} />
                ) : (
                  <Fact label="Site address" value="Not on file" />
                )}
              </dl>
              {document.customer.accountNotes ? (
                <div className="mt-4 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    Account notes
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-navy-900">
                    {document.customer.accountNotes}
                  </p>
                </div>
              ) : null}
            </Section>
          ) : null}

          <Section title={document.kind === "ticket" ? "Reported issue" : "Job description"}>
            {document.description ? (
              <p className="whitespace-pre-wrap text-sm leading-6 text-navy-900">
                {document.description}
              </p>
            ) : (
              <EmptyLine>No description recorded.</EmptyLine>
            )}
          </Section>

          <Section title="Time and work performed" keep={false}>
            {document.kindTotals.length > 0 ? (
              <ul className="mb-3 flex flex-wrap gap-2">
                {document.kindTotals.map((row) => (
                  <li
                    key={row.kind}
                    className="rounded-sm border border-navy-200 bg-navy-50 px-2.5 py-1 text-xs font-semibold text-navy-800"
                  >
                    {row.kindLabel}: {row.durationLabel}
                  </li>
                ))}
                <li className="rounded-sm border border-navy-900 bg-navy-900 px-2.5 py-1 text-xs font-semibold text-white">
                  Total: {document.totalDurationLabel}
                </li>
              </ul>
            ) : null}
            {document.timeEntries.length === 0 ? (
              <EmptyLine>No time logged yet.</EmptyLine>
            ) : (
              <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-navy-800 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    <th className="py-2 pr-3 font-bold">Date</th>
                    <th className="py-2 pr-3 font-bold">Technician</th>
                    <th className="py-2 pr-3 font-bold">Type</th>
                    <th className="py-2 pr-3 font-bold">Duration</th>
                    <th className="py-2 font-bold">Work performed</th>
                  </tr>
                </thead>
                <tbody>
                  {document.timeEntries.map((row) => (
                    <tr key={row.id} className="border-b border-slate-200 align-top">
                      <td className="whitespace-nowrap py-2.5 pr-3">{row.dateLabel}</td>
                      <td className="py-2.5 pr-3">{row.technician}</td>
                      <td className="py-2.5 pr-3">{row.kindLabel}</td>
                      <td className="whitespace-nowrap py-2.5 pr-3 font-semibold">
                        {row.durationLabel}
                      </td>
                      <td className="py-2.5">
                        {row.notes.length > 0 ? (
                          <ul className="list-disc space-y-0.5 pl-4">
                            {row.notes.map((line, index) => (
                              <li key={`${row.id}-${index}`}>{line}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="pt-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Total time
                    </td>
                    <td className="pt-3 font-bold">{document.totalDurationLabel}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
              </div>
            )}
          </Section>

          <Section title="Products and materials used">
            {document.products.length === 0 ? (
              <EmptyLine>No products recorded.</EmptyLine>
            ) : (
              <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-navy-800 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    <th className="py-2 pr-3 font-bold">Item</th>
                    <th className="py-2 pr-3 font-bold">SKU</th>
                    <th className="py-2 pr-3 font-bold">Qty</th>
                    <th className="py-2 pr-3 font-bold">Added by</th>
                    <th className="py-2 font-bold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {document.products.map((row) => (
                    <tr key={row.id} className="border-b border-slate-200 align-top">
                      <td className="py-2.5 pr-3 font-semibold">{row.name}</td>
                      <td className="py-2.5 pr-3 font-mono text-xs">{row.sku || "—"}</td>
                      <td className="whitespace-nowrap py-2.5 pr-3">{row.quantityLabel}</td>
                      <td className="py-2.5 pr-3">
                        {row.addedBy}
                        <span className="block text-[11px] font-normal text-slate-500">
                          {row.addedOnLabel}
                        </span>
                      </td>
                      <td className="py-2.5">{row.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </Section>

          <Section title="Job notes" keep={false}>
            {document.notes.length === 0 ? (
              <EmptyLine>No notes on this job yet.</EmptyLine>
            ) : (
              <ol className="space-y-3">
                {document.notes.map((note) => (
                  <li
                    key={note.id}
                    className="wo-keep border-b border-slate-200 pb-3 last:border-0 last:pb-0"
                  >
                    <p className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <NoteBadge note={note} />
                      <span className="font-semibold text-navy-800">{note.author}</span>
                      <span>{note.at}</span>
                    </p>
                    {note.body ? (
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-navy-900">
                        {note.body}
                      </p>
                    ) : null}
                    {note.attachments.length > 0 ? (
                      <p className="mt-1 text-xs text-slate-600">
                        Files: {note.attachments.join(", ")}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </Section>

          {document.attachments.length > 0 ? (
            <Section title="Attached files">
              <ul className="list-disc pl-5 text-sm leading-6">
                {document.attachments.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </Section>
          ) : null}

          <Section title="Sign-off">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Technician
                </p>
                <p className="mt-2 min-h-[2.25rem] text-sm text-navy-800">
                  {document.assigned[0] || " "}
                </p>
                <div className="mt-6 border-b border-navy-800" />
                <p className="mt-1 text-[11px] text-slate-500">Signature</p>
                <div className="mt-5 border-b border-navy-800" />
                <p className="mt-1 text-[11px] text-slate-500">Date</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  {document.kind === "ticket" ? "Customer acknowledgement" : "Completed / reviewed"}
                </p>
                <p className="mt-2 min-h-[2.25rem] text-sm text-navy-800">
                  {document.customer?.name || " "}
                </p>
                <div className="mt-6 border-b border-navy-800" />
                <p className="mt-1 text-[11px] text-slate-500">Signature</p>
                <div className="mt-5 border-b border-navy-800" />
                <p className="mt-1 text-[11px] text-slate-500">Date</p>
              </div>
            </div>
            {document.kind === "ticket" ? (
              <p className="mt-4 text-xs leading-5 text-slate-600">
                Work described on this order was completed. Signing confirms the site visit or
                remote work, not a warranty or invoice.
              </p>
            ) : (
              <p className="mt-4 text-xs leading-5 text-slate-600">
                Internal job record. Not a customer invoice.
              </p>
            )}
          </Section>

          <footer className="wo-keep mt-8 border-t border-slate-300 pt-3 text-[11px] leading-5 text-slate-500">
            <p>
              {company.name} · Staff work order {document.reference} · {company.websiteHost}
              {company.email ? ` · ${company.email}` : ""}
              {company.phone ? ` · ${company.phone}` : ""}
            </p>
            {company.footerNote ? <p className="mt-0.5">{company.footerNote}</p> : null}
            <p className="mt-1">
              Internal document. Includes work-log details that customers do not see in the
              portal.
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}
