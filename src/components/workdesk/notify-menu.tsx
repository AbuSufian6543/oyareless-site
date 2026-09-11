import { Card, CardTitle } from "@/components/admin/ui";
import { WORKDESK_NOTIFY_CHANNELS } from "@/lib/workdesk/notice";

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
      <CardTitle description="Assignment already emails people you add. Email now pings everyone currently on this item. Chat apps show up here once connected.">
        Notify
      </CardTitle>
      <form action={action} className="space-y-2">
        {Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <input type="hidden" name="channel" value="email" />
        <button
          type="submit"
          disabled={!hasRecipients}
          className="w-full rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          Email now
        </button>
        {!hasRecipients ? (
          <p className="text-xs text-slate-500">Assign someone first.</p>
        ) : null}
      </form>
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
