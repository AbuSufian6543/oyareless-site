import { MoreHorizontal } from "lucide-react";

import { deleteTaskAction, notifyTaskStaffAction } from "@/app/admin/tasks/actions";
import { EmailStaffButton } from "@/components/workdesk/notify-menu";
import { ConfirmSubmit } from "@/components/workdesk/confirm-submit";

export function TaskQuickActions({
  taskId,
  reference,
  returnTo,
  canNotify,
  canDelete,
  menu = false,
}: {
  taskId: string;
  reference: string;
  returnTo: string;
  canNotify: boolean;
  canDelete: boolean;
  menu?: boolean;
}) {
  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <EmailStaffButton
        action={notifyTaskStaffAction}
        hiddenFields={{ taskId, returnTo }}
        disabled={!canNotify}
        includesFullTask
        compact
      />
      {canDelete ? (
        <form action={deleteTaskAction}>
          <input type="hidden" name="taskId" value={taskId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <ConfirmSubmit
            message={`Delete ${reference}? This cannot be undone.`}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
          >
            Delete
          </ConfirmSubmit>
        </form>
      ) : null}
    </div>
  );
  if (!menu) return controls;
  return (
    <details className="relative">
      <summary className="flex size-8 cursor-pointer list-none items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-navy-900 [&::-webkit-details-marker]:hidden">
        <MoreHorizontal className="size-4" aria-hidden="true" />
        <span className="sr-only">Actions for {reference}</span>
      </summary>
      <div className="absolute right-0 z-30 mt-1 w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
        {controls}
      </div>
    </details>
  );
}
