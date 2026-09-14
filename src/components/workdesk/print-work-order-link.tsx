import { Printer } from "lucide-react";
import Link from "next/link";

import { workOrderPath, type WorkOrderKind } from "@/lib/workdesk/work-order";

export function PrintWorkOrderLink({
  kind,
  id,
  compact = false,
}: {
  kind: WorkOrderKind;
  id: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={workOrderPath(kind, id)}
      target="_blank"
      rel="noopener noreferrer"
      title="Open a printable work order with company details, time, products, and notes"
      className={
        compact
          ? "inline-flex items-center gap-1.5 rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-800 hover:border-brand-600 hover:bg-brand-50 hover:text-brand-800"
          : "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-800 hover:border-brand-600 hover:bg-brand-50 hover:text-brand-800 sm:w-auto"
      }
    >
      <Printer className="size-4" aria-hidden="true" />
      Print work order
    </Link>
  );
}
