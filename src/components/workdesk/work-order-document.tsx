import type { ReactNode } from "react";

import {
  compactAddressLines,
  notesForPrint,
  type WorkOrderCompany,
  type WorkOrderDocumentModel,
  type WorkOrderNote,
} from "@/lib/workdesk/work-order";
import { WorkOrderPrintBar } from "@/components/workdesk/work-order-print-bar";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="wo-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function NoteBadge({ note }: { note: WorkOrderNote }) {
  const tone =
    note.visibility === "internal"
      ? "wo-badge-internal"
      : note.visibility === "customer"
        ? "wo-badge-customer"
        : "wo-badge-staff";
  return <span className={`wo-badge ${tone}`}>{note.visibilityLabel}</span>;
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
  const addressLines = compactAddressLines(company.addressLines);
  const contactBits = [
    phones.length > 0 ? phones.join(" · ") : "",
    company.email,
    company.websiteHost,
    company.hours,
  ].filter(Boolean);
  const notes = notesForPrint(document);

  return (
    <div className="work-order-page min-h-dvh bg-slate-200 print:min-h-0 print:bg-white">
      <WorkOrderPrintBar
        backHref={document.backHref}
        backLabel={document.backLabel}
        reference={document.reference}
      />
      <div className="px-3 py-5 print:p-0 sm:px-4">
        <article className="work-order-sheet mx-auto w-full max-w-[8.5in] bg-white px-5 py-5 shadow-[0_18px_50px_-24px_rgba(7,30,57,0.45)] print:shadow-none sm:px-6">
          <header className="wo-header">
            <div className="wo-brand">
              {/* Native img so the logo survives print preview; next/image srcset is often skipped. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={company.logoUrl}
                alt=""
                width={180}
                height={40}
                className="wo-logo"
              />
              <div className="min-w-0">
                <p className="wo-company">{company.name}</p>
                {company.tagline ? <p className="wo-tagline">{company.tagline}</p> : null}
                <address className="wo-contact not-italic">
                  {addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                  {contactBits.length > 0 ? (
                    <span className="block">{contactBits.join(" · ")}</span>
                  ) : null}
                </address>
              </div>
            </div>
            <div className="wo-meta">
              <p className="wo-kicker">Work order</p>
              <p className="wo-ref">{document.reference}</p>
              <p className="wo-kind">{document.kindLabel}</p>
              <p className="wo-printed">
                {document.printedAtLabel}
                <span className="block">Printed by {document.printedByName}</span>
              </p>
            </div>
          </header>

          <p className="wo-title-label">Job title</p>
          <h1 className="wo-title">{document.title}</h1>
          <dl className="wo-facts">
            <Fact label="Status" value={document.statusLabel} />
            <Fact label="Priority" value={document.priorityLabel} />
            <Fact label="Assigned" value={assigned} />
            <Fact label="Total time" value={document.totalDurationLabel} />
            {document.facts.map((fact) => (
              <Fact key={fact.label} label={fact.label} value={fact.value} />
            ))}
          </dl>

          {document.customer ? (
            <Section title="Customer and site">
              <dl className="wo-facts">
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
                <div className="wo-account-notes">
                  <p className="wo-subhead">Account notes</p>
                  <p className="wo-copy">{document.customer.accountNotes}</p>
                </div>
              ) : null}
            </Section>
          ) : null}

          <Section title={document.kind === "ticket" ? "Reported issue" : "Job description"}>
            {document.description ? (
              <p className="wo-copy">{document.description}</p>
            ) : (
              <p className="wo-empty">No description recorded.</p>
            )}
          </Section>

          {document.timeEntries.length > 0 ? (
            <Section title="Time and work performed">
              {document.kindTotals.length > 1 ? (
                <p className="wo-totals">
                  {document.kindTotals.map((row) => (
                    <span key={row.kind}>
                      {row.kindLabel}: {row.durationLabel}
                    </span>
                  ))}
                </p>
              ) : null}
              <table className="wo-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Technician</th>
                    <th>Type</th>
                    <th>Duration</th>
                    <th>Work performed</th>
                  </tr>
                </thead>
                <tbody>
                  {document.timeEntries.map((row) => (
                    <tr key={row.id}>
                      <td className="wo-num">{row.dateLabel}</td>
                      <td>{row.technician}</td>
                      <td>{row.kindLabel}</td>
                      <td className="wo-num">{row.durationLabel}</td>
                      <td>
                        {row.notes.length > 0 ? row.notes.join(" · ") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="wo-total-label" colSpan={3}>
                      Total time
                    </td>
                    <td>{document.totalDurationLabel}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </Section>
          ) : null}

          {document.products.length > 0 ? (
            <Section title="Products and materials used">
              <table className="wo-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>SKU</th>
                    <th>Qty</th>
                    <th>Added by</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {document.products.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.name}</strong>
                      </td>
                      <td className="wo-mono">{row.sku || "—"}</td>
                      <td className="wo-num">{row.quantityLabel}</td>
                      <td>
                        {row.addedBy}
                        {row.addedOnLabel ? ` · ${row.addedOnLabel}` : ""}
                      </td>
                      <td>{row.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          ) : null}

          {notes.length > 0 ? (
            <Section title="Job notes">
              <ol className="wo-notes">
                {notes.map((note) => (
                  <li key={note.id}>
                    <p className="wo-note-meta">
                      <NoteBadge note={note} />
                      <strong>{note.author}</strong>
                      <span>{note.at}</span>
                    </p>
                    {note.body ? <p className="wo-copy">{note.body}</p> : null}
                    {note.attachments.length > 0 ? (
                      <p className="wo-note-files">
                        Files: {note.attachments.join(", ")}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </Section>
          ) : null}

          {document.attachments.length > 0 ? (
            <Section title="Attached files">
              <ul className="wo-files">
                {document.attachments.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </Section>
          ) : null}

          <Section title="Sign-off">
            <table className="wo-sign">
              <thead>
                <tr>
                  <th> </th>
                  <th>Name</th>
                  <th>Signature</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Technician</th>
                  <td>{assigned === "Unassigned" ? "" : assigned}</td>
                  <td className="wo-sign-line"> </td>
                  <td className="wo-sign-line"> </td>
                </tr>
                <tr>
                  <th scope="row">
                    {document.kind === "ticket" ? "Customer" : "Reviewed"}
                  </th>
                  <td>{document.customer?.name || ""}</td>
                  <td className="wo-sign-line"> </td>
                  <td className="wo-sign-line"> </td>
                </tr>
              </tbody>
            </table>
            <p className="wo-legal">
              {document.kind === "ticket"
                ? "Work described on this order was completed. Signing confirms the site visit or remote work, not a warranty or invoice."
                : "Internal job record. Not a customer invoice."}
            </p>
          </Section>

          <footer className="wo-footer">
            <p>
              {company.name} · Staff work order {document.reference} · {company.websiteHost}
              {company.email ? ` · ${company.email}` : ""}
              {company.phone ? ` · ${company.phone}` : ""}
            </p>
            {company.footerNote ? <p>{company.footerNote}</p> : null}
            <p>Internal document. Includes work-log details that customers do not see in the portal.</p>
          </footer>
        </article>
      </div>
    </div>
  );
}
