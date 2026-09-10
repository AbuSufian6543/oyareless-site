import { readFileSync } from "node:fs";
import path from "node:path";

import {
  CUSTOMER_VISIBLE_EVENT_KINDS,
  roleMeetsMinimum,
  technicianCanSeeTask,
  technicianCanSeeTicket,
  technicianMaySetTaskStatus,
  technicianMaySetTicketStatus,
  workdeskAdminMaySetTaskStatus,
  workdeskAdminMaySetTicketStatus,
} from "../src/lib/workdesk/rules";

let failed = 0;

function assert(label: string, ok: boolean) {
  if (ok) console.log(`  OK    ${label}`);
  else {
    failed += 1;
    console.log(`  FAIL  ${label}`);
  }
}

assert(
  "technician cannot satisfy VIEWER, EDITOR, ADMIN, or SUPERADMIN checks",
  !roleMeetsMinimum("TECHNICIAN", "VIEWER") &&
    !roleMeetsMinimum("TECHNICIAN", "EDITOR") &&
    !roleMeetsMinimum("TECHNICIAN", "ADMIN") &&
    !roleMeetsMinimum("TECHNICIAN", "SUPERADMIN"),
);
assert("editor still qualifies as editor", roleMeetsMinimum("EDITOR", "EDITOR"));
assert("admin still qualifies as editor", roleMeetsMinimum("ADMIN", "EDITOR"));

const assigned = {
  userId: "tech-1",
  assignedToId: "tech-1",
  assigneeIds: ["tech-1"],
  grantUserIds: [] as string[],
};
const someoneElse = {
  userId: "tech-1",
  assignedToId: "tech-2",
  assigneeIds: ["tech-2"],
  grantUserIds: [] as string[],
};
const extraGrant = {
  userId: "tech-1",
  assignedToId: "tech-2",
  assigneeIds: ["tech-2"],
  grantUserIds: ["tech-1"],
};
const coAssigned = {
  userId: "tech-1",
  assignedToId: "tech-2",
  assigneeIds: ["tech-1", "tech-2"],
  grantUserIds: [] as string[],
};

assert("technician can see a ticket assigned to them", technicianCanSeeTicket(assigned));
assert("technician cannot see another technician's ticket", !technicianCanSeeTicket(someoneElse));
assert(
  "technician can see a ticket after an admin grant",
  technicianCanSeeTicket(extraGrant),
);
assert(
  "technician can see a ticket they are co-assigned on",
  technicianCanSeeTicket(coAssigned),
);

assert(
  "technician can see a task they are assigned to",
  technicianCanSeeTask({ userId: "tech-1", assigneeIds: ["tech-1", "tech-2"] }),
);
assert(
  "technician cannot see a task they are not assigned to",
  !technicianCanSeeTask({ userId: "tech-1", assigneeIds: ["tech-2"] }),
);

assert("technician may set IN_PROGRESS", technicianMaySetTicketStatus("IN_PROGRESS"));
assert("technician may set RESOLVED", technicianMaySetTicketStatus("RESOLVED"));
assert("technician may not set NEW", !technicianMaySetTicketStatus("NEW"));
assert("technician may not close a ticket", !technicianMaySetTicketStatus("CLOSED"));
assert("admin may close a ticket", workdeskAdminMaySetTicketStatus("CLOSED"));

assert("technician may set COMPLETED", technicianMaySetTaskStatus("COMPLETED"));
assert("technician may not close a task", !technicianMaySetTaskStatus("CLOSED"));
assert("admin may close a task", workdeskAdminMaySetTaskStatus("CLOSED"));

assert(
  "customers do not see assignment or internal notes in history",
  !(CUSTOMER_VISIBLE_EVENT_KINDS as readonly string[]).includes("ASSIGNED") &&
    !(CUSTOMER_VISIBLE_EVENT_KINDS as readonly string[]).includes("NOTE") &&
    !(CUSTOMER_VISIBLE_EVENT_KINDS as readonly string[]).includes("GRANT_ADDED"),
);
assert(
  "customers still see status, messages, and attachments",
  (CUSTOMER_VISIBLE_EVENT_KINDS as readonly string[]).includes("STATUS_CHANGED") &&
    (CUSTOMER_VISIBLE_EVENT_KINDS as readonly string[]).includes("MESSAGE") &&
    (CUSTOMER_VISIBLE_EVENT_KINDS as readonly string[]).includes("ATTACHMENT"),
);

const schema = readFileSync(path.join(process.cwd(), "prisma/schema.prisma"), "utf8");
const ticketAuditModel = schema.slice(
  schema.indexOf("model TicketAuditLog"),
  schema.indexOf("model QuoteRequest"),
);
assert(
  "ticket audit log is a separate model with no Ticket foreign key",
  ticketAuditModel.includes("model TicketAuditLog") &&
    !ticketAuditModel.includes("ticket   Ticket") &&
    !ticketAuditModel.includes("Ticket   @relation"),
);

const cmsAudit = readFileSync(path.join(process.cwd(), "src/lib/audit.ts"), "utf8");
assert(
  "CMS audit log does not mix in ticket actions",
  !cmsAudit.includes('"ticket.created"') && !cmsAudit.includes("| \"ticket."),
);

const writer = readFileSync(
  path.join(process.cwd(), "src/lib/workdesk/ticket-audit.ts"),
  "utf8",
);
assert(
  "ticket audit writer never stores message bodies",
  writer.includes("recordTicketAudit") && !writer.includes("body:"),
);

const adminTickets = readFileSync(
  path.join(process.cwd(), "src/app/admin/tickets/actions.ts"),
  "utf8",
);
const techTickets = readFileSync(path.join(process.cwd(), "src/app/tech/actions.ts"), "utf8");
const portalTickets = readFileSync(
  path.join(process.cwd(), "src/app/portal/tickets/actions.ts"),
  "utf8",
);
assert(
  "admin ticket create, update, and delete write the ticket audit log",
  adminTickets.includes("ticket.created") &&
    adminTickets.includes("ticket.deleted") &&
    adminTickets.includes("ticket.status_changed") &&
    adminTickets.includes("ticket.assigned") &&
    adminTickets.includes("recordTicketAudit"),
);
assert(
  "technician ticket replies and status changes write the ticket audit log",
  techTickets.includes("recordTicketAudit") &&
    techTickets.includes("ticket.replied") &&
    techTickets.includes("ticket.status_changed"),
);
assert(
  "customer portal ticket create and replies write the ticket audit log",
  portalTickets.includes("recordTicketAudit") &&
    portalTickets.includes("ticket.created") &&
    portalTickets.includes("ticket.replied"),
);

process.exit(failed === 0 ? 0 : 1);
