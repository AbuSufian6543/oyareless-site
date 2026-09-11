import { Card, CardTitle } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { WORKDESK_NOTIFY_CHANNELS } from "@/lib/workdesk/notice";

export function TaskEmailHint({
  tone,
  className,
}: {
  tone: "create" | "save" | "reminder";
  className?: string;
}) {
  const text =
    tone === "create"
      ? "Assigned staff and the office inbox receive an email with the title, description, due date, priority, files, notes, and who is assigned."
      : tone === "save"
        ? "Saving emails assigned staff with the full current task, not only the fields you changed."
        : "This reminder includes the full task in the email, not just a one-line ping.";

  return (
    <div
      className={cn(
        "rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white px-3.5 py-3",
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">
        Email includes full task details
      </p>
      <p className="mt-1 text-xs leading-5 text-navy-800">{text}</p>
    </div>
  );
}

export function EmailStaffButton({
  action,
  hiddenFields,
  disabled,
  compact = false,
  includesFullTask = false,
  className,
}: {
  action: (formData: FormData) => Promise<void>;
  hiddenFields: Record<string, string>;
  disabled?: boolean;
  compact?: boolean;
  includesFullTask?: boolean;
  className?: string;
}) {
  return (
    <form action={action} className={className}>
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <input type="hidden" name="channel" value="email" />
      <button
        type="submit"
        disabled={disabled}
        title={
          disabled
            ? "Assign someone first"
            : includesFullTask
              ? "Email everyone currently assigned. The message includes the full task."
              : "Email everyone currently assigned"
        }
        className={cn(
          compact
            ? "rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
            : "inline-flex w-full items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 sm:w-auto",
        )}
      >
        Send reminder
      </button>
    </form>
  );
}

export function WorkdeskNotifyMenu({
  action,
  hiddenFields,
  hasRecipients,
  includesFullTask = false,
}: {
  action: (formData: FormData) => Promise<void>;
  hiddenFields: Record<string, string>;
  hasRecipients: boolean;
  includesFullTask?: boolean;
}) {
  const apps = WORKDESK_NOTIFY_CHANNELS.filter((channel) => !channel.enabled);

  return (
    <Card>
      <CardTitle
        description={
          includesFullTask
            ? "Creating, saving, or reminding already emails people. Each task email includes the full details — not a one-line ping."
            : "Creating or assigning already emails people. Send reminder pings everyone currently on this item. Chat apps show up here once connected."
        }
      >
        Notify
      </CardTitle>
      {includesFullTask ? <TaskEmailHint tone="reminder" className="mb-3" /> : null}
      <EmailStaffButton
        action={action}
        hiddenFields={hiddenFields}
        disabled={!hasRecipients}
        includesFullTask={includesFullTask}
        className="w-full [&_button]:w-full"
      />
      {!hasRecipients ? (
        <p className="mt-2 text-xs text-slate-500">Assign someone first.</p>
      ) : null}
      <ul className="mt-3 space-y-1.5">
        {apps.map((channel) => (
          <li key={channel.id}>
            <button
              type="button"
              disabled
              title="Not connected yet"
              className="w-full cursor-not-allowed rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-400"
            >
              {channel.label}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-slate-400">Telegram, Discord, and Slack are not connected yet.</p>
    </Card>
  );
}
