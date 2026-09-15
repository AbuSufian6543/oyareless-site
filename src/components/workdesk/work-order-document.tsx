import type { ReactNode } from "react";

import {
  compactAddressLines,
  jobRecordLines,
  notesForPrint,
  type WorkOrderCompany,
  type WorkOrderDocumentModel,
  type WorkOrderNote,
  type WorkOrderTimeRow,
} from "@/lib/workdesk/work-order";
import { formatDurationWords } from "@/lib/workdesk/hours";
import { WorkOrderPrintBar } from "@/components/workdesk/work-order-print-bar";

function Section({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: ReactNode;
}) {
  return (
    <section className="wo-section">
      <h2>
        {title}
        {meta ? <span className="wo-heading-meta">{meta}</span> : null}
      </h2>
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

function WorkDone({ notes }: { notes: string[] }) {
  if (notes.length === 0) {
    return <p className="wo-empty">No steps recorded for this time.</p>;
  }
  if (notes.length === 1) {
    return <p className="wo-copy">{notes[0]}</p>;
  }
  return (
    <ol className="wo-steps">
      {notes.map((step, index) => (
        <li key={`${index}-${step.slice(0, 24)}`}>{step}</li>
      ))}
    </ol>
  );
}

function TimeSheet({
  rows,
  totalMinutes,
  kindTotals,
}: {
  rows: WorkOrderTimeRow[];
  totalMinutes: number;
  kindTotals: WorkOrderDocumentModel["kindTotals"];
}) {
  return (
    <>
      <table className="wo-timesheet">
        <thead>
          <tr>
            <th className="wo-col-date">Date</th>
            <th className="wo-col-who">Technician</th>
            <th className="wo-col-kind">Kind of time</th>
            <th className="wo-col-mins">Time spent</th>
            <th>What was done</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.dateLabel}</td>
              <td>{row.technician}</td>
              <td>{row.kindLabel}</td>
              <td className="wo-time">{formatDurationWords(row.minutes)}</td>
              <td>
                <WorkDone notes={row.notes} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="wo-time-summary">
        <p>
          <strong>Total time spent:</strong> {formatDurationWords(totalMinutes)}
        </p>
        {kindTotals.length > 1 ? (
          <p>
            {kindTotals
              .map((row) => `${row.kindLabel}: ${formatDurationWords(row.minutes)}`)
              .join(" · ")}
          </p>
        ) : kindTotals[0] ? (
          <p>All of that time is {kindTotals[0].kindLabel.toLowerCase()}.</p>
        ) : null}
      </div>
    </>
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
  const addressLines = compactAddressLines(company.addressLines);
  const contactBits = [
    phones.length > 0 ? phones.join(" · ") : "",
    company.email,
    company.websiteHost,
    company.hours,
  ].filter(Boolean);
  const notes = notesForPrint(document);
  const recordLines = jobRecordLines(document.facts);
  const customerContact = document.customer
    ? [document.customer.phone, document.customer.email].filter(Boolean).join(" · ")
    : "";

  return (
    <div className="work-order-page min-h-dvh bg-slate-200 print:min-h-0 print:bg-white">
      <WorkOrderPrintBar
        backHref={document.backHref}
        backLabel={document.backLabel}
        reference={document.reference}
      />
      <div className="px-3 py-5 print:p-0 sm:px-4">
        <article className="work-order-sheet mx-auto w-full max-w-[8.5in] bg-white px-5 py-5 shadow-[0_18px_50px_-24px_rgba(7,30,57,0.45)] print:shadow-none sm:px-6">
          <div className="wo-watermark" aria-hidden="true">
            {/* Native img so print keeps the mark; next/image srcset is often skipped. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-mark.png" alt="" width={520} height={520} />
          </div>

          <div className="wo-body">
            <header className="wo-header">
              <div className="wo-brand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={company.logoUrl}
                  alt=""
                  width={210}
                  height={46}
                  className="wo-logo"
                />
                <address className="wo-contact not-italic">
                  {company.tagline ? <span>{company.tagline}</span> : null}
                  {addressLines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                  {contactBits.length > 0 ? <span>{contactBits.join(" · ")}</span> : null}
                </address>
              </div>
              <div className="wo-meta">
                <p className="wo-kicker">Work order</p>
                <p className="wo-ref">{document.reference}</p>
                <p className="wo-kind">{document.kindLabel}</p>
              </div>
            </header>

            <h1 className="wo-title">{document.title}</h1>
            <ul className="wo-summary">
              <li>
                <span>Status</span>
                {document.statusLabel}
              </li>
              <li>
                <span>Priority</span>
                {document.priorityLabel}
              </li>
              <li>
                <span>Assigned</span>
                {assigned}
              </li>
              <li>
                <span>Time on this job</span>
                {formatDurationWords(document.totalMinutes)}
              </li>
            </ul>

            {document.customer || recordLines.length > 0 ? (
              <div className={document.customer ? "wo-split" : undefined}>
                {document.customer ? (
                  <Section title="Who and where">
                    <p className="wo-person">{document.customer.name}</p>
                    {document.customer.accountRef ? (
                      <p className="wo-secondary">Account {document.customer.accountRef}</p>
                    ) : null}
                    {customerContact ? <p className="wo-secondary">{customerContact}</p> : null}
                    {document.customer.address ? (
                      <p className="wo-copy">{document.customer.address}</p>
                    ) : (
                      <p className="wo-empty">Site address is not on file.</p>
                    )}
                    {document.customer.accountNotes ? (
                      <div className="wo-callout">
                        <p className="wo-callout-label">Account notes</p>
                        <p className="wo-copy">{document.customer.accountNotes}</p>
                      </div>
                    ) : null}
                  </Section>
                ) : null}
                {recordLines.length > 0 ? (
                  <Section title="Job record">
                    {recordLines.map((line) => (
                      <p key={line} className="wo-record-line">
                        {line}
                      </p>
                    ))}
                  </Section>
                ) : null}
              </div>
            ) : null}

            <Section title={document.kind === "ticket" ? "What was reported" : "What this job is"}>
              {document.description ? (
                <p className="wo-copy">{document.description}</p>
              ) : (
                <p className="wo-empty">No description recorded.</p>
              )}
            </Section>

            {document.timeEntries.length > 0 ? (
              <Section title="Work performed">
                <TimeSheet
                  rows={document.timeEntries}
                  totalMinutes={document.totalMinutes}
                  kindTotals={document.kindTotals}
                />
              </Section>
            ) : null}

            {document.products.length > 0 ? (
              <Section title="Materials used">
                <ul className="wo-log">
                  {document.products.map((row) => (
                    <li key={row.id}>
                      <p className="wo-log-head">
                        <strong>{row.name}</strong>
                        <span>{row.quantityLabel}</span>
                      </p>
                      <p className="wo-secondary">
                        {[row.sku || "", `${row.addedBy}${row.addedOnLabel ? `, ${row.addedOnLabel}` : ""}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {row.note ? <p className="wo-copy">{row.note}</p> : null}
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {notes.length > 0 ? (
              <Section title="Notes">
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
                        <p className="wo-secondary">Files: {note.attachments.join(", ")}</p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </Section>
            ) : null}

            {document.attachments.length > 0 ? (
              <p className="wo-files">
                <strong>Files on this job:</strong> {document.attachments.join(", ")}
              </p>
            ) : null}

            <Section title="Sign-off">
              <div className="wo-sign">
                <div>
                  <h3>Technician</h3>
                  <p className="wo-person">{assigned === "Unassigned" ? "\u00a0" : assigned}</p>
                  <p className="wo-sign-field">Signature</p>
                  <p className="wo-sign-field">Date</p>
                </div>
                <div>
                  <h3>{document.kind === "ticket" ? "Customer" : "Reviewed by"}</h3>
                  <p className="wo-person">{document.customer?.name || "\u00a0"}</p>
                  <p className="wo-sign-field">Signature</p>
                  <p className="wo-sign-field">Date</p>
                </div>
              </div>
              <p className="wo-legal">
                {document.kind === "ticket"
                  ? "Work described on this order was completed. Signing confirms the site visit or remote work, not a warranty or invoice."
                  : "Internal job record. Not a customer invoice."}
              </p>
            </Section>

            <footer className="wo-footer">
              <p>
                Printed {document.printedAtLabel} by {document.printedByName}. {company.name} ·{" "}
                {document.reference} · {company.websiteHost}
                {company.email ? ` · ${company.email}` : ""}
                {company.phone ? ` · ${company.phone}` : ""}
              </p>
              {company.footerNote ? <p>{company.footerNote}</p> : null}
              <p>
                Internal document. Includes work-log details that customers do not see in the
                portal.
              </p>
            </footer>
          </div>
        </article>
      </div>
    </div>
  );
}
