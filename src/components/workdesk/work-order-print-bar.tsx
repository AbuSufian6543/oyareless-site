"use client";

import { Printer } from "lucide-react";
import { useEffect } from "react";

import { Button, ButtonLink } from "@/components/ui/button";

export function WorkOrderPrintBar({
  backHref,
  backLabel,
  reference,
}: {
  backHref: string;
  backLabel: string;
  reference: string;
}) {
  useEffect(() => {
    const previous = document.title;
    document.title = `Work order ${reference}`;
    return () => {
      document.title = previous;
    };
  }, [reference]);
  return (
    <div className="work-order-chrome sticky top-0 z-10 border-b border-navy-200/80 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex w-full max-w-[8.5in] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-navy-900">Print work order {reference}</p>
          <p className="mt-0.5 text-xs leading-5 text-slate-600">
            Staff copy — time, products, and internal notes print on this page. They are not
            shown in the customer portal.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink href={backHref} variant="ghost" size="sm">
            {backLabel}
          </ButtonLink>
          <Button type="button" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden="true" />
            Print
          </Button>
        </div>
      </div>
    </div>
  );
}
