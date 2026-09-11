import { deleteTaskAction, notifyTaskStaffAction } from "@/app/admin/tasks/actions";
import { EmailStaffButton } from "@/components/workdesk/notify-menu";
import { ConfirmSubmit } from "@/components/workdesk/confirm-submit";

export function TaskQuickActions({
  taskId,
  reference,
  returnTo,
  canNotify,
  canDelete,
}: {
  taskId: string;
  reference: string;
  returnTo: string;
  canNotify: boolean;
  canDelete: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <EmailStaffButton
        action={notifyTaskStaffAction}
        hiddenFields={{ taskId, returnTo }}
        disabled={!canNotify}
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
}
