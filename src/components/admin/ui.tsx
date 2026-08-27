import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: { href: string; label: string };
}) {
  return (
    <header className="mb-7">
      {breadcrumb && (
        <Link
          href={breadcrumb.href}
          className="mb-2 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          ← {breadcrumb.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-sm",
        padded && "p-5 lg:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  description,
}: {
  children: ReactNode;
  description?: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="font-bold text-navy-900">{children}</h2>
      {description && (
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      )}
    </div>
  );
}

const BADGE_TONES = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-brand-50 text-brand-700",
  navy: "bg-navy-100 text-navy-800",
} as const;

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof BADGE_TONES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "PUBLISHED"
      ? "success"
      : status === "DRAFT"
        ? "warning"
        : status === "ARCHIVED"
          ? "neutral"
          : "info";
  return (
    <Badge tone={tone}>
      {status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ")}
    </Badge>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 px-6 py-14 text-center">
      {icon && <div className="text-slate-400">{icon}</div>}
      <h3 className="font-bold text-navy-800">{title}</h3>
      {description && (
        <p className="max-w-md text-sm leading-relaxed text-slate-500">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function DataTable({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[42rem] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form controls
// ---------------------------------------------------------------------------

export const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-navy-900 transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-500";

export function Label({
  children,
  htmlFor,
  required,
  hint,
}: {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-semibold text-navy-800"
    >
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
      {hint && (
        <span className="ml-2 font-normal text-xs text-slate-500">{hint}</span>
      )}
    </label>
  );
}

export function TextField({
  label,
  name,
  hint,
  required,
  className,
  ...props
}: ComponentProps<"input"> & { label: string; hint?: string }) {
  const id = props.id ?? name;
  return (
    <div className={className}>
      <Label htmlFor={id} required={required} hint={hint}>
        {label}
      </Label>
      <input
        id={id}
        name={name}
        required={required}
        className={inputClass}
        {...props}
      />
    </div>
  );
}

export function TextAreaField({
  label,
  name,
  hint,
  required,
  className,
  ...props
}: ComponentProps<"textarea"> & { label: string; hint?: string }) {
  const id = props.id ?? name;
  return (
    <div className={className}>
      <Label htmlFor={id} required={required} hint={hint}>
        {label}
      </Label>
      <textarea
        id={id}
        name={name}
        required={required}
        className={cn(inputClass, "resize-y")}
        {...props}
      />
    </div>
  );
}

export function SelectField({
  label,
  name,
  options,
  hint,
  required,
  className,
  ...props
}: Omit<ComponentProps<"select">, "children"> & {
  label: string;
  hint?: string;
  options: Array<{ value: string; label: string }>;
}) {
  const id = props.id ?? name;
  return (
    <div className={className}>
      <Label htmlFor={id} required={required} hint={hint}>
        {label}
      </Label>
      <select id={id} name={name} className={inputClass} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CheckboxField({
  label,
  name,
  description,
  defaultChecked,
  ...props
}: ComponentProps<"input"> & { label: string; description?: string }) {
  const id = props.id ?? name;
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50"
    >
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        {...props}
      />
      <span>
        <span className="block text-sm font-semibold text-navy-800">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

export function Alert({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  children: ReactNode;
}) {
  const tones = {
    info: "border-brand-200 bg-brand-50 text-brand-900",
    // Emerald rather than the brand accent: the accent is now cyan, and
    // "saved successfully" should stay unambiguously green.
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    danger: "border-red-200 bg-red-50 text-red-900",
  };
  return (
    <div
      className={cn(
        "rounded-lg border p-3.5 text-sm leading-relaxed",
        tones[tone],
      )}
      role={tone === "danger" || tone === "warning" ? "alert" : undefined}
    >
      {children}
    </div>
  );
}
