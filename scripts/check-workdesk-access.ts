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

process.exit(failed === 0 ? 0 : 1);
