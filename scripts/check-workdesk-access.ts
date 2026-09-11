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
  "technician cannot satisfy VIEWER, EMPLOYEE, EDITOR, ADMIN, or SUPERADMIN checks",
  !roleMeetsMinimum("TECHNICIAN", "VIEWER") &&
    !roleMeetsMinimum("TECHNICIAN", "EMPLOYEE") &&
    !roleMeetsMinimum("TECHNICIAN", "EDITOR") &&
    !roleMeetsMinimum("TECHNICIAN", "ADMIN") &&
    !roleMeetsMinimum("TECHNICIAN", "SUPERADMIN"),
);
assert("viewer cannot satisfy EMPLOYEE", !roleMeetsMinimum("VIEWER", "EMPLOYEE"));
assert("employee qualifies for workdesk admin", roleMeetsMinimum("EMPLOYEE", "EMPLOYEE"));
assert("employee cannot satisfy EDITOR", !roleMeetsMinimum("EMPLOYEE", "EDITOR"));
assert("editor still qualifies as employee", roleMeetsMinimum("EDITOR", "EMPLOYEE"));
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
const auditStart = schema.indexOf("model AuditLog");
const auditEnd = schema.indexOf("\nmodel ", auditStart + 1);
const auditModel = schema.slice(auditStart, auditEnd === -1 ? undefined : auditEnd);
assert("ticket audit is not a separate Prisma model", !schema.includes("model TicketAuditLog"));
assert(
  "unified AuditLog stores IP and user-agent and has no Ticket or Task foreign key",
  auditModel.includes("ipAddress") &&
    auditModel.includes("userAgent") &&
    !auditModel.includes("Ticket") &&
    !auditModel.includes("InternalTask"),
);

const cmsAudit = readFileSync(path.join(process.cwd(), "src/lib/audit.ts"), "utf8");
assert(
  "unified audit writer records ticket and task actions with IP",
  cmsAudit.includes('"ticket.created"') &&
    cmsAudit.includes('"task.created"') &&
    cmsAudit.includes('"task.deleted"') &&
    cmsAudit.includes("ipAddress") &&
    cmsAudit.includes("requestAuditTrace"),
);

const writer = readFileSync(
  path.join(process.cwd(), "src/lib/workdesk/audit.ts"),
  "utf8",
);
assert(
  "workdesk audit wrappers never store message bodies",
  writer.includes("recordTicketAudit") &&
    writer.includes("recordTaskAudit") &&
    !writer.includes("body:"),
);

const adminTickets = readFileSync(
  path.join(process.cwd(), "src/app/admin/tickets/actions.ts"),
  "utf8",
);
const adminTasks = readFileSync(
  path.join(process.cwd(), "src/app/admin/tasks/actions.ts"),
  "utf8",
);
const techTickets = readFileSync(path.join(process.cwd(), "src/app/tech/actions.ts"), "utf8");
const portalTickets = readFileSync(
  path.join(process.cwd(), "src/app/portal/tickets/actions.ts"),
  "utf8",
);
assert(
  "admin ticket create, update, and delete write the unified audit log",
  adminTickets.includes("ticket.created") &&
    adminTickets.includes("ticket.deleted") &&
    adminTickets.includes("ticket.status_changed") &&
    adminTickets.includes("ticket.assigned") &&
    adminTickets.includes("recordTicketAudit"),
);
assert(
  "admin task create, update, and delete write the unified audit log",
  adminTasks.includes("recordTaskAudit") &&
    adminTasks.includes("task.created") &&
    adminTasks.includes("task.deleted") &&
    adminTasks.includes("task.status_changed") &&
    adminTasks.includes("task.assigned"),
);
assert(
  "technician ticket and task changes write the unified audit log",
  techTickets.includes("recordTicketAudit") &&
    techTickets.includes("ticket.replied") &&
    techTickets.includes("ticket.status_changed") &&
    techTickets.includes("recordTaskAudit") &&
    techTickets.includes("task.noted") &&
    techTickets.includes("task.status_changed"),
);
assert(
  "customer portal ticket create and replies write the unified audit log",
  portalTickets.includes("recordTicketAudit") &&
    portalTickets.includes("ticket.created") &&
    portalTickets.includes("ticket.replied"),
);

const roleStart = schema.indexOf("enum Role");
const roleEnd = schema.indexOf("}", roleStart);
const roleEnum = schema.slice(roleStart, roleEnd === -1 ? undefined : roleEnd);
assert("schema Role enum includes EMPLOYEE", roleEnum.includes("EMPLOYEE"));

const access = readFileSync(path.join(process.cwd(), "src/lib/workdesk/access.ts"), "utf8");
assert(
  "workdesk admin CRUD starts at EMPLOYEE",
  access.includes('hasRole(user, "EMPLOYEE")') &&
    access.includes("export function isWorkdeskAdmin"),
);

const auditPage = readFileSync(path.join(process.cwd(), "src/app/admin/audit/page.tsx"), "utf8");
assert(
  "employees can open ticket and task audit, not the full CMS trail",
  auditPage.includes('requireAdminRole("EMPLOYEE")') &&
    auditPage.includes("workdeskAuditWhere") &&
    auditPage.includes("fullAudit"),
);

const shell = readFileSync(
  path.join(process.cwd(), "src/components/admin/admin-shell.tsx"),
  "utf8",
);
assert(
  "CMS and enquiry nav require EDITOR; configuration stays ADMIN+",
  shell.includes("STAFF_ROLE_RANK.EDITOR") &&
    shell.includes("STAFF_ROLE_RANK.ADMIN") &&
    shell.includes("STAFF_ROLE_RANK.SUPERADMIN"),
);

process.exit(failed === 0 ? 0 : 1);
