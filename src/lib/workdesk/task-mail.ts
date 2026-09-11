import { joinStaffNames } from "@/lib/workdesk/notice";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function clip(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

export type TaskMailNote = {
  authorName: string;
  at: string;
  body: string;
};

export type TaskMailSnapshot = {
  reference: string;
  title: string;
  description: string;
  status: string;
  statusLabel: string;
  priority: string;
  priorityLabel: string;
  dueLabel: string;
  assigneeNames: string[];
  createdByName: string;
  createdAtLabel: string;
  attachmentNames: string[];
  hoursLogged: string;
  productLines: string[];
  recentNotes: TaskMailNote[];
};

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  OPEN: { bg: "#e7f0fb", fg: "#0a5fae" },
  IN_PROGRESS: { bg: "#eef6e8", fg: "#2d6a1f" },
  WAITING: { bg: "#fff4d6", fg: "#8a5a00" },
  COMPLETED: { bg: "#e8f6ee", fg: "#1e6b3a" },
  CLOSED: { bg: "#eef1f5", fg: "#3d4f63" },
};

const PRIORITY_TONE: Record<string, { bg: string; fg: string }> = {
  LOW: { bg: "#eef1f5", fg: "#3d4f63" },
  NORMAL: { bg: "#e7f0fb", fg: "#0a5fae" },
  HIGH: { bg: "#fff4d6", fg: "#8a5a00" },
  EMERGENCY: { bg: "#fde8e8", fg: "#b42318" },
};

function pill(label: string, tone: { bg: string; fg: string }): string {
  return `<span style="display:inline-block;background:${tone.bg};color:${tone.fg};padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.02em;line-height:1.3;">${escapeHtml(label)}</span>`;
}

function factCell(label: string, html: string, lastInRow = false): string {
  return `<td width="50%" valign="top" style="padding:12px 14px;border-bottom:1px solid #e3e9f0;${lastInRow ? "" : "border-right:1px solid #e3e9f0;"}width:50%;">
    <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#5a6b80;font-weight:700;margin-bottom:6px;">${escapeHtml(label)}</div>
    <div style="font-size:14px;color:#12263f;line-height:1.5;white-space:pre-wrap;">${html}</div>
  </td>`;
}

function row(label: string, value: string): string {
  if (!value.trim()) return "";
  return `
    <tr>
      <td style="padding:10px 14px;background:#f7f9fc;border-bottom:1px solid #e3e9f0;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#5a6b80;width:138px;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e3e9f0;font-size:14px;color:#12263f;line-height:1.55;white-space:pre-wrap;">${escapeHtml(value)}</td>
    </tr>`;
}

function filesLabel(names: string[]): string {
  if (names.length === 0) return "";
  const shown = names.slice(0, 8);
  const extra = names.length - shown.length;
  return extra > 0 ? `${shown.join("\n")}\n+${extra} more` : shown.join("\n");
}

function notesBlock(notes: TaskMailNote[]): string {
  if (notes.length === 0) return "";
  const items = notes
    .map(
      (note) => `
        <tr>
          <td style="padding:0 0 12px;">
            <div style="font-size:12px;color:#5a6b80;margin-bottom:4px;">${escapeHtml(note.authorName)} · ${escapeHtml(note.at)}</div>
            <div style="font-size:14px;color:#12263f;line-height:1.6;white-space:pre-wrap;">${escapeHtml(clip(note.body, 800))}</div>
          </td>
        </tr>`,
    )
    .join("");
  return `
    <tr>
      <td style="padding:16px 18px;background:#ffffff;border-top:1px solid #e3e9f0;">
        <div style="font-size:11px;letter-spacing:.8px;text-transform:uppercase;color:#0a2a4e;font-weight:700;margin-bottom:12px;">Recent notes</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table>
      </td>
    </tr>`;
}

/**
 * HTML card of the full internal task, safe to embed in a branded staff email.
 * Inline styles only — email clients ignore stylesheets.
 */
export function renderTaskEmailCard(task: TaskMailSnapshot): string {
  const assigned =
    task.assigneeNames.length > 0 ? joinStaffNames(task.assigneeNames) : "Unassigned";
  const description = task.description.trim()
    ? escapeHtml(clip(task.description, 8000))
    : '<span style="color:#8194ab;">No description was added.</span>';
  const statusTone = STATUS_TONE[task.status] ?? STATUS_TONE.OPEN;
  const priorityTone = PRIORITY_TONE[task.priority] ?? PRIORITY_TONE.NORMAL;
  const products = task.productLines.length > 0 ? task.productLines.join("\n") : "";

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 22px;border-collapse:separate;border:1px solid #d7e0ea;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="background:#0a2a4e;padding:18px 20px;">
          <div style="font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#9dbadb;font-weight:700;">Internal task</div>
          <div style="margin-top:5px;font-size:13px;font-weight:700;letter-spacing:.04em;color:#6fc04a;font-family:ui-monospace,Menlo,Consolas,monospace;">${escapeHtml(task.reference)}</div>
          <div style="margin-top:8px;font-size:20px;font-weight:700;color:#ffffff;line-height:1.35;">${escapeHtml(task.title)}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:0;background:#ffffff;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              ${factCell("Status", pill(task.statusLabel, statusTone))}
              ${factCell("Priority", pill(task.priorityLabel, priorityTone), true)}
            </tr>
            <tr>
              ${factCell("Due date", escapeHtml(task.dueLabel))}
              ${factCell("Assigned to", escapeHtml(assigned), true)}
            </tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            ${row("Created by", task.createdByName)}
            ${row("Created", task.createdAtLabel)}
            ${row("Time logged", task.hoursLogged)}
            ${row("Products used", products)}
            ${row("Files", filesLabel(task.attachmentNames))}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 18px;background:#f7fbf4;border-top:1px solid #e3e9f0;">
          <div style="font-size:11px;letter-spacing:.8px;text-transform:uppercase;color:#3d6b2a;font-weight:700;margin-bottom:8px;">Description</div>
          <div style="font-size:14px;color:#12263f;line-height:1.65;white-space:pre-wrap;">${description}</div>
        </td>
      </tr>
      ${notesBlock(task.recentNotes)}
    </table>`;
}
