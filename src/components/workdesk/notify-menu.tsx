import { Card, CardTitle } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { WORKDESK_NOTIFY_CHANNELS } from "@/lib/workdesk/notice";

export function EmailStaffButton({
  action,
  hiddenFields,
  disabled,
  compact = false,
  className,
}: {
  action: (formData: FormData) => Promise<void>;
  hiddenFields: Record<string, string>;
  disabled?: boolean;
  compact?: boolean;
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
        title={disabled ? "Assign someone first" : "Email everyone currently assigned"}
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
}: {
  action: (formData: FormData) => Promise<void>;
  hiddenFields: Record<string, string>;
  hasRecipients: boolean;
}) {
  const apps = WORKDESK_NOTIFY_CHANNELS.filter((channel) => !channel.enabled);

  return (
    <Card>
      <CardTitle description="Creating or assigning already emails people. Send reminder pings everyone currently on this item. Chat apps show up here once connected.">
        Notify
      </CardTitle>
      <EmailStaffButton
        action={action}
        hiddenFields={hiddenFields}
        disabled={!hasRecipients}
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
