export function workdeskFileHref(kind: "ticket" | "task", id: string): string {
  return `/api/workdesk/attachments/${kind}/${id}`;
}
