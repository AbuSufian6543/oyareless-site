import { StaffIllustration } from "@/components/workdesk/staff-illustration";
import type { DashboardPersona } from "@/generated/prisma/client";
import { DASHBOARD_ILLUSTRATIONS, DEFAULT_DASHBOARD_PERSONA } from "@/lib/workdesk/illustrations";
import { cn } from "@/lib/utils";

export function PersonaPicker({
  action,
  current,
  next,
}: {
  action: (formData: FormData) => void | Promise<void>;
  current: DashboardPersona | null;
  next: string;
}) {
  const selected = current ?? DEFAULT_DASHBOARD_PERSONA;

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-3">
      <input type="hidden" name="next" value={next} />
      {Object.entries(DASHBOARD_ILLUSTRATIONS).map(([value, option]) => {
        const active = selected === value;
        return (
          <button
            key={value}
            type="submit"
            name="persona"
            value={value}
            className={cn(
              "overflow-hidden rounded-2xl border text-left transition",
              active
                ? "border-brand-500 ring-2 ring-brand-200"
                : "border-slate-200 hover:border-brand-300",
            )}
          >
            <StaffIllustration persona={value as DashboardPersona} />
            <span className="flex items-center justify-between gap-2 px-3 py-2">
              <span className="text-sm font-bold text-navy-900">{option.label}</span>
              {value === DEFAULT_DASHBOARD_PERSONA ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Default
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
      <p className="sm:col-span-3 text-xs text-slate-500">
        This only changes the illustration on your workdesk. It is not shown to customers.
      </p>
    </form>
  );
}
