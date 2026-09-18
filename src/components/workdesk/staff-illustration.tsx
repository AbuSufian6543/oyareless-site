import Image from "next/image";

import type { DashboardPersona } from "@/generated/prisma/client";
import {
  DASHBOARD_ILLUSTRATIONS,
  resolveDashboardPersona,
} from "@/lib/workdesk/illustrations";
import { cn } from "@/lib/utils";

export function StaffIllustration({
  persona,
  className,
}: {
  persona: DashboardPersona | null;
  className?: string;
}) {
  const key = resolveDashboardPersona(persona);
  const art = DASHBOARD_ILLUSTRATIONS[key];

  return (
    <span className={cn("block overflow-hidden", art.frame, className)}>
      <Image
        src={art.src}
        alt={art.alt}
        width={960}
        height={720}
        className="h-auto w-full object-contain"
      />
    </span>
  );
}
