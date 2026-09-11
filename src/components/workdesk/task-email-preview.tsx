import { renderTaskEmailCard } from "@/lib/workdesk/task-mail";

const SAMPLE = {
  reference: "TASK-1042",
  title: "Replace the north tower radio",
  description:
    "Climb the tower, swap the radio, and confirm the link is back. Take photos of the old unit and the installed spare.",
  status: "IN_PROGRESS",
  statusLabel: "In progress",
  priority: "HIGH",
  priorityLabel: "High",
  dueLabel: "September 12, 2026",
  assigneeNames: ["Alex Rivera", "Jordan Lee"],
  createdByName: "Sam Patel",
  createdAtLabel: "Sep 11, 2026, 1:00 p.m.",
  attachmentNames: ["site-photos.zip"],
  hoursLogged: "1h 30m",
  productLines: ["1 each Spare radio"],
  recentNotes: [
    {
      authorName: "Alex Rivera",
      at: "Sep 11, 2026, 9:15 a.m.",
      body: "Spare is on the truck. Heading to site after lunch.",
    },
  ],
};

export function TaskEmailPreview() {
  const html = renderTaskEmailCard(SAMPLE);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#eef2f7]">
      <div className="border-b border-slate-200 bg-white px-5 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">
          Email preview
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Create, save, and reminder emails use this layout with the live task details.
        </p>
      </div>
      <div className="p-4 sm:p-6">
        <div
          className="mx-auto max-w-[620px] overflow-hidden rounded-xl bg-white px-5 py-4 shadow-[0_2px_12px_rgba(15,42,73,0.08)]"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
