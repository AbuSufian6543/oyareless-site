import { existsSync, readFileSync } from "node:fs";
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
import {
  canAccessApplications,
  canAccessCatalogue,
  canAccessConfiguration,
  canAccessContent,
  canAccessEnquiries,
  canAccessKnowledge,
  canAccessOperations,
  canAccessPortalUsers,
  canAccessWorkdesk,
} from "../src/lib/staff-access";
import {
  accessGrantNotice,
  assignmentNotice,
  joinStaffNames,
  reminderNotice,
  taskChangeNotice,
  unassignedCreateNotice,
  WORKDESK_NOTIFY_CHANNELS,
} from "../src/lib/workdesk/notice";
import { renderTaskEmailCard } from "../src/lib/workdesk/task-mail";
import {
  formatDurationWords,
  formatLoggedDuration,
  joinWorkNoteLines,
  parseLoggedMinutes,
  parseProductQuantity,
  splitWorkNoteLines,
} from "../src/lib/workdesk/hours";
import { calendarDateKey, DEFAULT_DISPLAY_TIMEZONE } from "../src/lib/timezone";
import { formatDate, formatDateTime } from "../src/lib/utils";
import { parseDateInput } from "../src/lib/workdesk/dates";
import {
  companyAddressLines,
  compactAddressLines,
  formatSiteAddress,
  jobRecordLines,
  minutesByKind,
  notesForPrint,
  publicCompanyWebsite,
  sumMinutes,
  ticketNoteMeta,
  workOrderPath,
} from "../src/lib/workdesk/work-order";

let failed = 0;

function assert(label: string, ok: boolean) {
  if (ok) console.log(`  OK    ${label}`);
  else {
    failed += 1;
    console.log(`  FAIL  ${label}`);
  }
}

assert(
  "technician cannot satisfy VIEWER, EMPLOYEE, MANAGER, EDITOR, ADMIN, or SUPERADMIN checks",
  !roleMeetsMinimum("TECHNICIAN", "VIEWER") &&
    !roleMeetsMinimum("TECHNICIAN", "EMPLOYEE") &&
    !roleMeetsMinimum("TECHNICIAN", "MANAGER") &&
    !roleMeetsMinimum("TECHNICIAN", "EDITOR") &&
    !roleMeetsMinimum("TECHNICIAN", "ADMIN") &&
    !roleMeetsMinimum("TECHNICIAN", "SUPERADMIN"),
);
assert("viewer cannot satisfy EMPLOYEE", !roleMeetsMinimum("VIEWER", "EMPLOYEE"));
assert("employee qualifies for workdesk admin", roleMeetsMinimum("EMPLOYEE", "EMPLOYEE"));
assert("employee cannot satisfy MANAGER", !roleMeetsMinimum("EMPLOYEE", "MANAGER"));
assert("employee cannot satisfy EDITOR", !roleMeetsMinimum("EMPLOYEE", "EDITOR"));
assert("manager qualifies as employee", roleMeetsMinimum("MANAGER", "EMPLOYEE"));
assert("manager cannot satisfy EDITOR", !roleMeetsMinimum("MANAGER", "EDITOR"));
assert("manager cannot satisfy ADMIN", !roleMeetsMinimum("MANAGER", "ADMIN"));
assert("editor still qualifies as employee", roleMeetsMinimum("EDITOR", "EMPLOYEE"));
assert("editor still qualifies as editor", roleMeetsMinimum("EDITOR", "EDITOR"));
assert("admin still qualifies as editor", roleMeetsMinimum("ADMIN", "EDITOR"));

const manager = { role: "MANAGER" as const };
assert("manager has workdesk", canAccessWorkdesk(manager));
assert("manager has knowledge", canAccessKnowledge(manager));
assert("manager has enquiries", canAccessEnquiries(manager));
assert("manager has operations", canAccessOperations(manager));
assert("manager has portal users", canAccessPortalUsers(manager));
assert("manager does not have applications", !canAccessApplications(manager));
assert("manager does not have CMS content", !canAccessContent(manager));
assert("manager does not have catalogue", !canAccessCatalogue(manager));
assert("manager does not have configuration", !canAccessConfiguration(manager));
assert("editor does not inherit operations", !canAccessOperations({ role: "EDITOR" }));
assert("employee does not inherit enquiries", !canAccessEnquiries({ role: "EMPLOYEE" }));

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
assert(
  "customers do not see time or product log events",
  !(CUSTOMER_VISIBLE_EVENT_KINDS as readonly string[]).includes("TIME_LOGGED") &&
    !(CUSTOMER_VISIBLE_EVENT_KINDS as readonly string[]).includes("PRODUCT_USED"),
);

assert("1h 30m parses from hours and minutes fields", parseLoggedMinutes("1", "30") === 90);
assert("30 minutes alone is accepted", parseLoggedMinutes("0", "30") === 30);
assert("empty duration is rejected", parseLoggedMinutes("", "") === null);
assert("more than 24 hours is rejected", parseLoggedMinutes("25", "0") === null);
assert("duration formats as 1h 30m", formatLoggedDuration(90) === "1h 30m");
assert("45m formats without hours", formatLoggedDuration(45) === "45m");
assert(
  "print durations say min and hr so they are not read as clock times",
  formatDurationWords(45) === "45 min" &&
    formatDurationWords(60) === "1 hr" &&
    formatDurationWords(105) === "1 hr 45 min" &&
    formatDurationWords(1) === "1 min",
);
assert("product quantity keeps two decimals", parseProductQuantity("12.5") === 12.5);
assert("zero product quantity is rejected", parseProductQuantity("0") === null);
assert(
  "work notes join as one step per line",
  joinWorkNoteLines([" Replaced radio ", "", "Tested coverage"]) ===
    "Replaced radio\nTested coverage",
);
assert(
  "work notes split back into a list",
  splitWorkNoteLines("Replaced radio\nTested coverage").join("|") ===
    "Replaced radio|Tested coverage",
);

const torontoNoon = new Date("2026-09-11T16:00:00.000Z");
const torontoEveningUtc = new Date("2026-09-11T03:00:00.000Z");
assert("office clock defaults to Toronto", DEFAULT_DISPLAY_TIMEZONE === "America/Toronto");
assert(
  "timestamps display noon Eastern, not UTC",
  formatDateTime(torontoNoon).includes("12") &&
    formatDateTime(torontoNoon).includes("Sep") &&
    formatDateTime(torontoNoon).includes("11"),
);
assert(
  "late UTC evening still shows the Toronto calendar date",
  formatDate(torontoEveningUtc) === "September 10, 2026" &&
    calendarDateKey(torontoEveningUtc) === "2026-09-10",
);
assert(
  "date-only fields save noon in the office timezone",
  (() => {
    const parsed = parseDateInput("2026-09-11");
    return parsed !== null && formatDate(parsed) === "September 11, 2026";
  })(),
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
assert("schema Role enum includes MANAGER", roleEnum.includes("MANAGER"));
assert(
  "internal tasks can link to one inbox or quote item",
  schema.includes("enquiryKind") && schema.includes("enquiryId"),
);

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
  "manager nav uses capability checks; users stay SUPERADMIN",
  shell.includes("canAccessEnquiries") &&
    shell.includes("canAccessApplications") &&
    shell.includes("canAccessOperations") &&
    shell.includes("canAccessKnowledge") &&
    shell.includes('href: "/admin/backup"') &&
    shell.includes("STAFF_ROLE_RANK.SUPERADMIN"),
);

const enquiryTask = readFileSync(
  path.join(process.cwd(), "src/lib/workdesk/enquiry-task.ts"),
  "utf8",
);
assert(
  "inbox and quotes open workdesk tasks with assignable staff",
  enquiryTask.includes("createOrOpenEnquiryTask") &&
    enquiryTask.includes('kind: "task"') &&
    enquiryTask.includes("enquiryKind"),
);

const assigneeUi = readFileSync(
  path.join(process.cwd(), "src/components/workdesk/assignee-checklist.tsx"),
  "utf8",
);
assert(
  "assignment UI lists office staff including managers",
  assigneeUi.includes("OFFICE_ASSIGNABLE_ROLES") &&
    assigneeUi.includes("managers") &&
    assigneeUi.includes("employees"),
);

assert("joinStaffNames uses and-lists", joinStaffNames(["Sarah Chen"]) === "Sarah Chen");
assert(
  "joinStaffNames uses and between two names",
  joinStaffNames(["Sarah Chen", "Mike Tech"]) === "Sarah Chen and Mike Tech",
);
assert(
  "joinStaffNames uses commas and a final and",
  joinStaffNames(["Sarah", "Mike", "Jane"]) === "Sarah, Mike, and Jane",
);

const firstAssign = assignmentNotice({
  actorName: "Abu",
  reference: "WC-1042",
  subject: "Printer offline",
  addedNames: ["Sarah Chen"],
  allNames: ["Sarah Chen"],
  kind: "ticket",
  previousCount: 0,
});
assert(
  "first assignment names the employee in the title and body",
  firstAssign.title.includes("Sarah Chen") &&
    firstAssign.body.includes("Abu assigned this ticket to Sarah Chen") &&
    firstAssign.body.includes("Printer offline"),
);

const addedLater = assignmentNotice({
  actorName: "Abu",
  reference: "WT-12",
  subject: "Site survey",
  addedNames: ["Jane Employee"],
  allNames: ["Sarah Chen", "Jane Employee"],
  kind: "task",
  previousCount: 1,
});
assert(
  "adding someone names who was added and who is now assigned",
  addedLater.title.includes("Jane Employee") &&
    addedLater.body.includes("Abu added Jane Employee") &&
    addedLater.body.includes("Sarah Chen and Jane Employee"),
);

const reminder = reminderNotice({
  actorName: "Abu",
  reference: "WC-1042",
  subject: "Printer offline",
  assigneeNames: ["Sarah Chen", "Mike Tech"],
  kind: "ticket",
});
assert(
  "manual reminder names current assignees",
  reminder.title.includes("WC-1042") &&
    reminder.body.includes("Sarah Chen and Mike Tech") &&
    reminder.body.includes("Printer offline"),
);

const taskEdit = taskChangeNotice({
  actorName: "Abu",
  reference: "WT-12",
  changes: ["updated the description", "set the due date to 2026-09-12"],
});
assert(
  "task edit notice points to the full details below",
  taskEdit.title.includes("WT-12") &&
    taskEdit.body.includes("updated the description") &&
    taskEdit.body.includes("The current task details are below"),
);

const taskCard = renderTaskEmailCard({
  reference: "WT-12",
  title: "Replace the north tower radio",
  description: "Climb the tower and swap the radio. <script>alert(1)</script>",
  status: "IN_PROGRESS",
  statusLabel: "In progress",
  priority: "HIGH",
  priorityLabel: "High",
  dueLabel: "September 12, 2026",
  assigneeNames: ["Sarah Chen"],
  createdByName: "Abu",
  createdAtLabel: "Sep 11, 2026, 1:00 p.m.",
  attachmentNames: ["photos.zip"],
  hoursLogged: "1h 30m",
  productLines: ["1 each Spare radio"],
  recentNotes: [
    { authorName: "Sarah Chen", at: "Sep 11, 2026, 9:15 a.m.", body: "Heading to site." },
  ],
});
assert(
  "task email card includes the live details and escapes HTML",
  taskCard.includes("WT-12") &&
    taskCard.includes("Replace the north tower radio") &&
    taskCard.includes("Climb the tower and swap the radio") &&
    taskCard.includes("Description") &&
    taskCard.includes("Due date") &&
    taskCard.includes("Assigned to") &&
    taskCard.includes("Sarah Chen") &&
    taskCard.includes("photos.zip") &&
    taskCard.includes("Heading to site") &&
    !taskCard.includes("<script>alert(1)</script>"),
);

const grant = accessGrantNotice({
  actorName: "Abu",
  grantedName: "Mike Tech",
  reference: "WC-1042",
  subject: "Printer offline",
});
assert(
  "extra access names the technician",
  grant.title.includes("Mike Tech") && grant.body.includes("Mike Tech"),
);

assert(
  "unassigned create copy asks an employee or admin to pick the item up",
  unassignedCreateNotice({
    actorName: "Abu",
    reference: "WC-1042",
    subject: "Printer offline",
    kind: "ticket",
  }).title.includes("needs an owner") &&
    unassignedCreateNotice({
      actorName: "Abu",
      reference: "WC-1042",
      subject: "Printer offline",
      kind: "ticket",
    }).body.includes("no one assigned"),
);

assert(
  "email is the only live notify channel for now",
  WORKDESK_NOTIFY_CHANNELS.filter((channel) => channel.enabled).map((channel) => channel.id).join() ===
    "email" &&
    WORKDESK_NOTIFY_CHANNELS.some((channel) => channel.id === "telegram" && !channel.enabled) &&
    WORKDESK_NOTIFY_CHANNELS.some((channel) => channel.id === "discord" && !channel.enabled) &&
    WORKDESK_NOTIFY_CHANNELS.some((channel) => channel.id === "slack" && !channel.enabled),
);

assert(
  "admin ticket assign and create use named assignment notices",
  adminTickets.includes("assignmentNotice") &&
    adminTickets.includes("notifyTicketStaffAction") &&
    adminTickets.includes("ticket.notified"),
);
assert(
  "admin task assign, create, and edit use named notices",
  adminTasks.includes("assignmentNotice") &&
    adminTasks.includes("taskChangeNotice") &&
    adminTasks.includes("notifyTaskStaffAction") &&
    adminTasks.includes("task.notified"),
);

const notifyMenu = readFileSync(
  path.join(process.cwd(), "src/components/workdesk/notify-menu.tsx"),
  "utf8",
);
assert(
  "admin ticket create emails assignees without waiting for a reminder",
  (() => {
    const start = adminTickets.indexOf("export async function createStaffTicketAction");
    const end = adminTickets.indexOf("export async function replyStaffTicketAction");
    const create = adminTickets.slice(start, end);
    return (
      create.includes("notifyNewWork") &&
      !create.includes("excludeUserIds") &&
      create.includes("assigneeIds")
    );
  })(),
);
assert(
  "admin task create emails assignees without waiting for a reminder",
  (() => {
    const start = adminTasks.indexOf("export async function createTaskAction");
    const end = adminTasks.indexOf("export async function updateTaskAction");
    const create = adminTasks.slice(start, end);
    return create.includes("notifyNewWork") && !create.includes("excludeUserIds");
  })(),
);

const notifyLib = readFileSync(
  path.join(process.cwd(), "src/lib/workdesk/notify.ts"),
  "utf8",
);
assert(
  "new tickets still copy the office inbox; new tasks email only assignees",
  notifyLib.includes("export async function notifyNewWork") &&
    notifyLib.includes("emailAdminInbox") &&
    notifyLib.includes("unassignedCreateNotice") &&
    notifyLib.includes("async function notifyNewTaskAssignees") &&
    (() => {
      const start = notifyLib.indexOf("async function notifyNewTaskAssignees");
      const end = notifyLib.indexOf("async function listWorkdeskManagerIds");
      const taskFn = notifyLib.slice(start, end);
      return (
        taskFn.includes("userIds: input.assigneeIds") &&
        !taskFn.includes("emailAdminInbox") &&
        !taskFn.includes("listWorkdeskManagerIds")
      );
    })(),
);

assert(
  "notify menu offers Send reminder and disabled chat apps",
  notifyMenu.includes("Send reminder") &&
    notifyMenu.includes("Telegram") &&
    notifyMenu.includes("Discord") &&
    notifyMenu.includes("Slack") &&
    notifyMenu.includes("Not connected yet"),
);

const adminTaskPage = readFileSync(
  path.join(process.cwd(), "src/app/admin/tasks/page.tsx"),
  "utf8",
);
assert(
  "internal tasks have completed and closed tabs plus list notify/delete",
  adminTaskPage.includes('view=completed') &&
    adminTaskPage.includes('view=closed') &&
    adminTaskPage.includes("TaskQuickActions") &&
    adminTaskPage.includes("canDelete={canManage && done}"),
);

const dashboard = readFileSync(path.join(process.cwd(), "src/app/admin/page.tsx"), "utf8");
const calendarUi = readFileSync(
  path.join(process.cwd(), "src/components/workdesk/workdesk-calendar.tsx"),
  "utf8",
);
assert(
  "workdesk dashboard surfaces today's and upcoming tasks",
  dashboard.includes("Today's tasks") &&
    dashboard.includes("WorkdeskCalendar") &&
    dashboard.includes("dashboardPersona") &&
    calendarUi.includes("/admin?day=") &&
    calendarUi.includes("createTaskAction") &&
    calendarUi.includes("Assigned to me") &&
    calendarUi.includes("Assigned to others"),
);

assert(
  "workdesk technician illustrations are present",
  ["rack.png", "engineering.png", "bench.png"].every((file) =>
    existsSync(path.join(process.cwd(), "public/workdesk", file)),
  ),
);

const illustrationLib = readFileSync(
  path.join(process.cwd(), "src/lib/workdesk/illustrations.ts"),
  "utf8",
);
assert(
  "workdesk default illustration is the rack technician",
  illustrationLib.includes('DEFAULT_DASHBOARD_PERSONA = "RACK"') &&
    schema.includes("enum DashboardPersona") &&
    schema.includes("RACK") &&
    schema.includes("ENGINEERING") &&
    schema.includes("BENCH") &&
    !schema.includes("BOY") &&
    !schema.includes("GIRL"),
);

const resetPage = readFileSync(
  path.join(process.cwd(), "src/app/login/reset/page.tsx"),
  "utf8",
);
assert(
  "password-reset page does not bounce signed-in staff to /admin",
  !resetPage.includes('redirect("/admin")') && resetPage.includes("ResetPasswordForm"),
);

const proxy = readFileSync(path.join(process.cwd(), "src/proxy.ts"), "utf8");
assert(
  "unauthenticated /admin, /tech, and /work-orders visits keep the original path",
  proxy.includes("loginUrlFor") &&
    proxy.includes("wc_session") &&
    proxy.includes("x-wc-path") &&
    proxy.includes('pathname.startsWith("/work-orders")'),
);

const loginActions = readFileSync(
  path.join(process.cwd(), "src/app/login/actions.ts"),
  "utf8",
);
assert(
  "sign-in honors the email next= path",
  loginActions.includes("destinationAfterLogin"),
);

assert(
  "task notify and delete honor returnTo",
  adminTasks.includes("taskReturnPath") &&
    adminTasks.includes("returnTo") &&
    adminTasks.includes("notifyTaskStaffAction"),
);

const mailer = readFileSync(path.join(process.cwd(), "src/lib/mail.ts"), "utf8");
assert(
  "staff emails include a copyable URL under the button",
  mailer.includes("emailActionLink") &&
    mailer.includes("If the button does not open") &&
    mailer.includes("Choose a new password"),
);

const workdeskMail = readFileSync(
  path.join(process.cwd(), "src/lib/workdesk/notify.ts"),
  "utf8",
);
assert(
  "assignment emails use See task / Open ticket / Open admin buttons",
  workdeskMail.includes("See task") &&
    workdeskMail.includes("Open ticket") &&
    workdeskMail.includes("Open admin") &&
    workdeskMail.includes("emailActionLink") &&
    workdeskMail.includes("staffEmailDocument") &&
    workdeskMail.includes("renderTaskEmailCard"),
);

const dateUtils = readFileSync(path.join(process.cwd(), "src/lib/utils.ts"), "utf8");
const rootLayout = readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8");
const siteSettings = readFileSync(
  path.join(process.cwd(), "src/lib/settings-defaults.ts"),
  "utf8",
);
const settingsPage = readFileSync(
  path.join(process.cwd(), "src/app/admin/settings/page.tsx"),
  "utf8",
);
assert(
  "dates use the office timezone everywhere, including a settings field",
  dateUtils.includes("displayTimeZone()") &&
    dateUtils.includes("timeZoneName") &&
    rootLayout.includes("data-timezone") &&
    siteSettings.includes("displayTimeZone") &&
    settingsPage.includes("Display timezone"),
);

assert(
  "schema has work time entries and a product catalog",
  schema.includes("model WorkTimeEntry") &&
    schema.includes("model WorkProduct") &&
    schema.includes("model WorkProductUsage") &&
    schema.includes("TIME_LOGGED"),
);

const workLogUi = readFileSync(
  path.join(process.cwd(), "src/components/workdesk/work-log.tsx"),
  "utf8",
);
const workLogForms = readFileSync(
  path.join(process.cwd(), "src/components/workdesk/work-log-forms.tsx"),
  "utf8",
);
const workLogActions = readFileSync(
  path.join(process.cwd(), "src/app/workdesk/log-actions.ts"),
  "utf8",
);
assert(
  "work log UI records time and products",
  workLogUi.includes("Work log") &&
    workLogForms.includes("Log time") &&
    workLogForms.includes("Add product") &&
    workLogForms.includes("Quick duration"),
);
assert(
  "work log notes are a list with an add-step control",
  workLogForms.includes("What did you do?") &&
    workLogForms.includes('name="noteLine"') &&
    workLogForms.includes("Add another step") &&
    workLogUi.includes("WorkNoteList") &&
    workLogActions.includes("readWorkNoteFromForm"),
);

const adminTicketDetail = readFileSync(
  path.join(process.cwd(), "src/app/admin/tickets/[id]/page.tsx"),
  "utf8",
);
const adminTaskDetail = readFileSync(
  path.join(process.cwd(), "src/app/admin/tasks/[id]/page.tsx"),
  "utf8",
);
const techTicketDetail = readFileSync(
  path.join(process.cwd(), "src/app/tech/tickets/[id]/page.tsx"),
  "utf8",
);
const techTaskDetail = readFileSync(
  path.join(process.cwd(), "src/app/tech/tasks/[id]/page.tsx"),
  "utf8",
);
const newTaskPage = readFileSync(
  path.join(process.cwd(), "src/app/admin/tasks/new/page.tsx"),
  "utf8",
);
assert(
  "task create, edit, and reminder screens mention the full-detail email",
  newTaskPage.includes("TaskEmailHint") &&
    newTaskPage.includes("TaskEmailPreview") &&
    adminTaskDetail.includes("TaskEmailHint") &&
    adminTaskDetail.includes("includesFullTask") &&
    notifyMenu.includes("Email includes full task details"),
);
assert(
  "admin and technician ticket/task pages show the work log",
  adminTicketDetail.includes("<WorkLog") &&
    adminTaskDetail.includes("<WorkLog") &&
    techTicketDetail.includes("<WorkLog") &&
    techTaskDetail.includes("<WorkLog"),
);

const portalTicket = readFileSync(
  path.join(process.cwd(), "src/app/portal/tickets/[id]/page.tsx"),
  "utf8",
);
assert(
  "customer portal tickets do not show the work log",
  !portalTicket.includes("WorkLog") &&
    portalTicket.includes("CUSTOMER_VISIBLE_EVENT_KINDS"),
);

assert(
  "workdesk audit includes time and product actions",
  cmsAudit.includes('"ticket.time_logged"') &&
    cmsAudit.includes('"task.product_used"'),
);

assert(
  "admin nav includes the job product list",
  shell.includes("/admin/products") && shell.includes("Products"),
);

assert(
  "work order paths stay on the staff print routes",
  workOrderPath("ticket", "abc") === "/work-orders/ticket/abc" &&
    workOrderPath("task", "abc") === "/work-orders/task/abc",
);
assert(
  "work order site address stacks street then city",
  formatSiteAddress({
    addressLine1: "97 White Oak Drive, East",
    city: "Sault Ste. Marie",
    province: "ON",
    postalCode: "P6B 4J7",
  }) === "97 White Oak Drive, East\nSault Ste. Marie, ON P6B 4J7",
);
assert(
  "company address keeps Canada on its own line",
  companyAddressLines({
    addressLine1: "97 White Oak Drive, East",
    city: "Sault Ste. Marie",
    province: "ON",
    postalCode: "P6B 4J7",
    country: "Canada",
  }).join("|") ===
    "97 White Oak Drive, East|Sault Ste. Marie, ON P6B 4J7|Canada",
);
assert(
  "print address keeps the street, then folds city and country onto one line",
  compactAddressLines(
    companyAddressLines({
      addressLine1: "97 White Oak Drive, East",
      city: "Sault Ste. Marie",
      province: "ON",
      postalCode: "P6B 4J7",
      country: "Canada",
    }),
  ).join("|") ===
    "97 White Oak Drive, East|Sault Ste. Marie, ON P6B 4J7 · Canada",
);

const openingNote = {
  id: "m1",
  at: "Sep 15, 2026, 9:00 a.m.",
  author: "Pat",
  visibility: "customer" as const,
  visibilityLabel: "Customer",
  body: "Radio is down at the yard.",
  attachments: [] as string[],
};
const followUpNote = {
  id: "m2",
  at: "Sep 15, 2026, 11:00 a.m.",
  author: "Alex",
  visibility: "internal" as const,
  visibilityLabel: "Internal",
  body: "Antenna swapped. Testing overnight.",
  attachments: [] as string[],
};
assert(
  "ticket print skips the opening message already used as the description",
  notesForPrint({
    kind: "ticket",
    description: openingNote.body,
    notes: [openingNote, followUpNote],
  })
    .map((note) => note.id)
    .join("|") === "m2",
);
assert(
  "ticket print keeps opening-message files when the body is already in the description",
  notesForPrint({
    kind: "ticket",
    description: openingNote.body,
    notes: [{ ...openingNote, attachments: ["yard-photo.jpg"] }, followUpNote],
  })
    .map((note) => `${note.id}:${note.body}:${note.attachments.join(",")}`)
    .join("|") === "m1::yard-photo.jpg|m2:Antenna swapped. Testing overnight.:",
);
assert(
  "task print keeps every note, including one that matches the description",
  notesForPrint({
    kind: "task",
    description: openingNote.body,
    notes: [openingNote, followUpNote],
  }).length === 2,
);
assert(
  "job record lines keep every fact in readable sentences",
  jobRecordLines([
    { label: "Category", value: "Radio" },
    { label: "Opened", value: "Sep 15, 2026, 8:14 a.m." },
    { label: "Opened by", value: "Alex Nguyen" },
    { label: "Last updated", value: "Sep 15, 2026, 10:40 a.m." },
    { label: "PO number", value: "PO-88" },
  ]).join("|") ===
    "Radio · opened Sep 15, 2026, 8:14 a.m. by Alex Nguyen|Last updated Sep 15, 2026, 10:40 a.m.|PO number PO-88",
);
assert(
  "work order totals add minutes and group by kind",
  sumMinutes([{ minutes: 45 }, { minutes: 90 }]) === 135 &&
    minutesByKind([
      { kind: "ONSITE", minutes: 60 },
      { kind: "TRAVEL", minutes: 30 },
      { kind: "ONSITE", minutes: 15 },
    ])
      .map((row) => `${row.kind}:${row.durationLabel}`)
      .join("|") === "ONSITE:1h 15m|TRAVEL:30m",
);
assert(
  "internal ticket notes stay labelled internal on the work order",
  ticketNoteMeta({
    isInternal: true,
    authorStaffName: "Alex",
    authorCustomerUser: { name: "Pat" },
  }).visibility === "internal",
);
assert(
  "work order website is wirelesscom.org, not the mailbox domain",
  publicCompanyWebsite().host === "wirelesscom.org" &&
    publicCompanyWebsite().url === "https://wirelesscom.org",
);

const ticketWorkOrderPage = readFileSync(
  path.join(process.cwd(), "src/app/work-orders/ticket/[id]/page.tsx"),
  "utf8",
);
const taskWorkOrderPage = readFileSync(
  path.join(process.cwd(), "src/app/work-orders/task/[id]/page.tsx"),
  "utf8",
);
const workOrderCss = readFileSync(
  path.join(process.cwd(), "src/app/work-orders/work-order.css"),
  "utf8",
);
const workOrderDocument = readFileSync(
  path.join(process.cwd(), "src/components/workdesk/work-order-document.tsx"),
  "utf8",
);
assert(
  "printable work orders re-check ticket and task access",
  ticketWorkOrderPage.includes("assertTicketAccess") &&
    taskWorkOrderPage.includes("assertTaskAccess") &&
    ticketWorkOrderPage.includes("workdeskStaffOrRedirect") &&
    taskWorkOrderPage.includes("workdeskStaffOrRedirect"),
);
assert(
  "work order print uses a compact letter page and hides the on-screen chrome",
  workOrderCss.includes("size: letter") &&
    workOrderCss.includes(".work-order-chrome") &&
    workOrderCss.includes("display: none") &&
    workOrderCss.includes("font-size: 15px") &&
    workOrderCss.includes(".wo-watermark") &&
    !workOrderCss.includes("wo-keep"),
);
assert(
  "work order print keeps unique job fields, a watermark, and a compact sign-off",
  workOrderDocument.includes("notesForPrint") &&
    workOrderDocument.includes("What was reported") &&
    workOrderDocument.includes("Work performed") &&
    workOrderDocument.includes("Time spent") &&
    workOrderDocument.includes("What was done") &&
    workOrderDocument.includes("wo-timesheet") &&
    workOrderDocument.includes("Materials used") &&
    workOrderDocument.includes("wo-sign") &&
    workOrderDocument.includes("wo-watermark") &&
    workOrderDocument.includes("/brand/logo-mark.png") &&
    workOrderDocument.includes("Account notes") &&
    workOrderDocument.includes("Files on this job"),
);
assert(
  "admin and technician job pages offer a printable work order",
  adminTicketDetail.includes("PrintWorkOrderLink") &&
    adminTaskDetail.includes("PrintWorkOrderLink") &&
    techTicketDetail.includes("PrintWorkOrderLink") &&
    techTaskDetail.includes("PrintWorkOrderLink"),
);
assert(
  "customer portal tickets do not offer a staff work order print",
  !portalTicket.includes("PrintWorkOrderLink") &&
    !portalTicket.includes("work-orders"),
);

const robots = readFileSync(path.join(process.cwd(), "src/app/robots.ts"), "utf8");
assert(
  "robots.txt keeps work orders out of search",
  robots.includes('"/work-orders"') && robots.includes('"/work-orders/"'),
);

process.exit(failed === 0 ? 0 : 1);
