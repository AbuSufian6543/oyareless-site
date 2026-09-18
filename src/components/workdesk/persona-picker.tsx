import { StaffIllustration } from "@/components/workdesk/staff-illustration";
import type { DashboardPersona } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

const OPTIONS: Array<{
  value: DashboardPersona;
  label: string;
}> = [
  { value: "BOY", label: "Male technician" },
  { value: "GIRL", label: "Female technician" },
];

export function PersonaPicker({
  action,
  current,
  next,
  compact = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  current: DashboardPersona | null;
  next: string;
  compact?: boolean;
}) {
  return (
    <form action={action} className={cn(compact ? "mt-3 space-y-2" : "grid gap-3 sm:grid-cols-2")}>
      <input type="hidden" name="next" value={next} />
      {compact ? (
        <p className="text-xs text-navy-200">Choose the technician illustration for your dashboard</p>
      ) : null}
      <div className={cn("grid gap-2", compact ? "grid-cols-2" : "contents")}>
        {OPTIONS.map((option) => {
          const selected = current === option.value;
          return (
            <button
              key={option.value}
              type="submit"
              name="persona"
              value={option.value}
              className={cn(
                "overflow-hidden rounded-2xl border text-left transition",
                selected
                  ? "border-accent-400 ring-2 ring-accent-300"
                  : "border-slate-200 hover:border-brand-300",
                compact ? "bg-white/10" : "bg-white",
              )}
            >
              <StaffIllustration
                persona={option.value}
                crop={compact ? "avatar" : "scene"}
                className={compact ? "mx-auto h-20 w-20" : "h-28"}
              />
              <span
                className={cn(
                  "block px-3 py-2 text-sm font-bold",
                  compact ? "text-white" : "text-navy-900",
                )}
              >
                {compact ? (option.value === "BOY" ? "Male" : "Female") : option.label}
              </span>
            </button>
          );
        })}
      </div>
      {!compact ? (
        <p className="sm:col-span-2 text-xs text-slate-500">
          This only changes the illustration on your workdesk. It is not shown to customers.
        </p>
      ) : null}
    </form>
  );
}
