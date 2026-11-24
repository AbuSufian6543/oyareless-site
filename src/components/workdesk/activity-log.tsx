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
    <ol className="space-y-3">
      {events.map((event, index) => (
        <li key={event.id} className="wc-row relative pl-5" style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}>
          <span className="absolute left-0 top-1.5 size-2.5 rounded-full bg-brand-500 ring-4 ring-white" />
          {index < events.length - 1 ? (
            <span className="absolute bottom-[-0.75rem] left-[4px] top-4 w-px bg-slate-200" aria-hidden="true" />
          ) : null}
          <p className="text-sm text-navy-900">{event.summary}</p>
          <p className="text-xs text-slate-500">
            {event.kind.replace(/_/g, " ").toLowerCase()} · {formatDateTime(event.createdAt)}
          </p>
        </li>
      ))}
    </ol>
  );
}
