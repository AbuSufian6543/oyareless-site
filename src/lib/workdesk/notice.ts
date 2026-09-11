/**
 * Copy for ticket/task staff notices. Safe to import from Node checks and
 * from server modules — no database or cookie access.
 */

export const WORKDESK_NOTIFY_CHANNELS = [
  { id: "email", label: "Email now", enabled: true },
  { id: "telegram", label: "Telegram", enabled: false },
  { id: "discord", label: "Discord", enabled: false },
  { id: "slack", label: "Slack", enabled: false },
] as const;

export type WorkdeskNotifyChannelId = (typeof WORKDESK_NOTIFY_CHANNELS)[number]["id"];

export function joinStaffNames(names: string[]): string {
  const clean = names.map((name) => name.trim()).filter(Boolean);
  if (clean.length === 0) return "no one";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")}, and ${clean[clean.length - 1]}`;
}

function clip(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

export function assignmentNotice(input: {
  actorName: string;
  reference: string;
  subject: string;
  addedNames: string[];
  allNames: string[];
  kind: "ticket" | "task";
  previousCount: number;
}): { title: string; body: string } {
  const added = joinStaffNames(input.addedNames);
  const all = joinStaffNames(input.allNames);
  const noun = input.kind === "ticket" ? "ticket" : "task";
  const title =
    input.previousCount === 0
      ? `${input.reference} assigned to ${added}`
      : `${added} added to ${input.reference}`;
  const body =
    input.previousCount === 0
      ? `${input.actorName} assigned this ${noun} to ${added}. ${input.subject}`
      : `${input.actorName} added ${added}. Now assigned to ${all}. ${input.subject}`;
  return { title: clip(title, 200), body: clip(body, 500) };
}

export function reminderNotice(input: {
  actorName: string;
  reference: string;
  subject: string;
  assigneeNames: string[];
  kind: "ticket" | "task";
}): { title: string; body: string } {
  const assigned = joinStaffNames(input.assigneeNames);
  return {
    title: clip(`Reminder: ${input.reference}`, 200),
    body: clip(
      `${input.actorName} sent a reminder about this ${input.kind}. Assigned to ${assigned}. ${input.subject}`,
      500,
    ),
  };
}

export function accessGrantNotice(input: {
  actorName: string;
  grantedName: string;
  reference: string;
  subject: string;
}): { title: string; body: string } {
  return {
    title: clip(`${input.grantedName} can work on ${input.reference}`, 200),
    body: clip(
      `${input.actorName} granted ${input.grantedName} extra access to this ticket. ${input.subject}`,
      500,
    ),
  };
}
