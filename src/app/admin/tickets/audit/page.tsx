import { redirect } from "next/navigation";

export const metadata = { title: "Audit log" };

/** Old workdesk URL. Ticket and task trails now live under Configuration → Audit log. */
export default async function TicketAuditRedirect({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string; ticket?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  query.set("action", params.action?.trim() || "ticket.");
  if (params.ticket?.trim()) query.set("q", params.ticket.trim());
  if (params.page && params.page !== "1") query.set("page", params.page);
  redirect(`/admin/audit?${query.toString()}`);
}
