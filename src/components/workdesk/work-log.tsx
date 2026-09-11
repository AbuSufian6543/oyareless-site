import { Clock3, Package } from "lucide-react";

import { ConfirmSubmit } from "@/components/workdesk/confirm-submit";
import { ProductLogForm, TimeLogForm } from "@/components/workdesk/work-log-forms";
import { removeProductUsageAction, removeTimeEntryAction } from "@/app/workdesk/log-actions";
import { formatDate } from "@/lib/utils";
import { formatLoggedDuration, formatProductQuantity } from "@/lib/workdesk/hours";
import { TIME_ENTRY_KIND_LABELS } from "@/lib/workdesk/labels";

const KIND_PILL: Record<string, string> = {
  REMOTE: "bg-sky-100 text-sky-800",
  ONSITE: "bg-emerald-100 text-emerald-800",
  TRAVEL: "bg-amber-100 text-amber-800",
  BENCH: "bg-violet-100 text-violet-800",
  OTHER: "bg-slate-100 text-slate-700",
};

type TimeRow = {
  id: string;
  minutes: number;
  kind: string;
  workedOn: Date;
  note: string;
  userId: string;
  user: { id: string; name: string };
};

type ProductRow = {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
  unit: string;
  note: string;
  addedById: string;
  createdAt: Date;
  addedBy: { id: string; name: string };
};

type CatalogRow = {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  category: string;
};

export function WorkLog({
  ticketId,
  taskId,
  timeEntries,
  productUsages,
  catalog,
  currentUserId,
  canManageAll,
  canEdit,
  canSaveToCatalog,
}: {
  ticketId?: string;
  taskId?: string;
  timeEntries: TimeRow[];
  productUsages: ProductRow[];
  catalog: CatalogRow[];
  currentUserId: string;
  canManageAll: boolean;
  canEdit: boolean;
  canSaveToCatalog: boolean;
}) {
  const totalMinutes = timeEntries.reduce((sum, row) => sum + row.minutes, 0);

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-navy-900 to-navy-800 px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold tracking-tight">Work log</h2>
          <p className="mt-0.5 text-xs text-navy-100">
            Hours spent and products used on this job. Not shown to the customer.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
            <Clock3 className="size-3.5" aria-hidden="true" />
            {totalMinutes > 0 ? `${formatLoggedDuration(totalMinutes)} logged` : "No time yet"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
            <Package className="size-3.5" aria-hidden="true" />
            {productUsages.length === 1 ? "1 product" : `${productUsages.length} products`}
          </span>
        </div>
      </header>

      <div className="grid lg:grid-cols-2">
        <div className="border-b border-slate-100 p-5 lg:border-b-0 lg:border-r">
          <h3 className="mb-3 text-sm font-bold text-navy-900">Time spent</h3>
          {timeEntries.length === 0 ? (
            <p className="mb-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
              No hours logged yet. Add the time you spent on this work.
            </p>
          ) : (
            <ul className="mb-4 space-y-2">
              {timeEntries.map((row) => (
                <li
                  key={row.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-semibold text-navy-900">
                        {formatLoggedDuration(row.minutes)}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            KIND_PILL[row.kind] ?? KIND_PILL.OTHER
                          }`}
                        >
                          {TIME_ENTRY_KIND_LABELS[row.kind] ?? row.kind}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {row.user.name} · {formatDate(row.workedOn)}
                      </p>
                      {row.note ? (
                        <p className="mt-1 text-sm text-navy-800">{row.note}</p>
                      ) : null}
                    </div>
                    {canEdit && (canManageAll || row.userId === currentUserId) ? (
                      <form action={removeTimeEntryAction}>
                        <input type="hidden" name="entryId" value={row.id} />
                        <ConfirmSubmit
                          message="Remove this time entry?"
                          className="text-xs font-semibold text-red-600 hover:underline"
                        >
                          Remove
                        </ConfirmSubmit>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {canEdit ? (
            <TimeLogForm ticketId={ticketId} taskId={taskId} />
          ) : (
            <p className="text-xs text-slate-500">This job is closed. An employee can still correct the log.</p>
          )}
        </div>

        <div className="p-5">
          <h3 className="mb-3 text-sm font-bold text-navy-900">Products used</h3>
          {productUsages.length === 0 ? (
            <p className="mb-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
              No products recorded. Log cable, radios, cameras, or other parts used.
            </p>
          ) : (
            <ul className="mb-4 space-y-2">
              {productUsages.map((row) => (
                <li
                  key={row.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-navy-900">{row.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatProductQuantity(row.quantity, row.unit)}
                        {row.sku ? ` · ${row.sku}` : ""} · {row.addedBy.name} · {formatDate(row.createdAt)}
                      </p>
                      {row.note ? (
                        <p className="mt-1 text-sm text-navy-800">{row.note}</p>
                      ) : null}
                    </div>
                    {canEdit && (canManageAll || row.addedById === currentUserId) ? (
                      <form action={removeProductUsageAction}>
                        <input type="hidden" name="usageId" value={row.id} />
                        <ConfirmSubmit
                          message={`Remove ${row.name} from this job?`}
                          className="text-xs font-semibold text-red-600 hover:underline"
                        >
                          Remove
                        </ConfirmSubmit>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {canEdit ? (
            <ProductLogForm
              ticketId={ticketId}
              taskId={taskId}
              catalog={catalog}
              canSaveToCatalog={canSaveToCatalog}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function WorkLogSummary({
  minutes,
  productCount,
  hideEmpty = false,
}: {
  minutes: number;
  productCount: number;
  hideEmpty?: boolean;
}) {
  if (hideEmpty && minutes <= 0 && productCount <= 0) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
      <span className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2.5 py-1 text-navy-800">
        <Clock3 className="size-3" aria-hidden="true" />
        {minutes > 0 ? formatLoggedDuration(minutes) : "0h"}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
        <Package className="size-3" aria-hidden="true" />
        {productCount === 1 ? "1 product" : `${productCount} products`}
      </span>
    </span>
  );
}
