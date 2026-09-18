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
  size = "scene",
}: {
  persona: DashboardPersona | null;
  className?: string;
  size?: "scene" | "thumb";
}) {
  const key = resolveDashboardPersona(persona);
  const art = DASHBOARD_ILLUSTRATIONS[key];

  if (size === "thumb") {
    return (
      <span className={cn("block size-full overflow-hidden", art.frame, className)}>
        <Image
          src={art.src}
          alt={art.alt}
          width={96}
          height={96}
          className="size-full object-cover object-center"
        />
      </span>
    );
  }

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
