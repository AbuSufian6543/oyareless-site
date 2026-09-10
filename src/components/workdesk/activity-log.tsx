import { formatDateTime } from "@/lib/utils";

export function ActivityLog({
  events,
}: {
  events: Array<{
    id: string;
    summary: string;
    createdAt: Date;
    kind: string;
  }>;
}) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-500">No history yet.</p>;
  }

  return (
    <ol className="space-y-3 border-l border-slate-200 pl-4">
      {events.map((event) => (
        <li key={event.id} className="relative">
          <span className="absolute -left-[21px] mt-1.5 size-2.5 rounded-full bg-brand-500" />
          <p className="text-sm text-navy-900">{event.summary}</p>
          <p className="text-xs text-slate-500">{formatDateTime(event.createdAt)}</p>
        </li>
      ))}
    </ol>
  );
}
