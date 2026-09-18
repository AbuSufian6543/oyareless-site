import Image from "next/image";

import type { DashboardPersona } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

const ART = {
  BOY: {
    scene: "/workdesk/tech-boy-scene.png",
    avatar: "/workdesk/tech-boy-avatar.png",
    sceneLabel: "Male IT technician at a laptop with network tools",
    avatarLabel: "Portrait of a male IT technician",
  },
  GIRL: {
    scene: "/workdesk/tech-girl-scene.png",
    avatar: "/workdesk/tech-girl-avatar.png",
    sceneLabel: "Female IT technician at a laptop with network tools",
    avatarLabel: "Portrait of a female IT technician",
  },
} as const;

export function StaffIllustration({
  persona,
  className,
  crop = "scene",
}: {
  persona: DashboardPersona | null;
  className?: string;
  crop?: "scene" | "avatar";
}) {
  if (!persona) {
    if (crop === "avatar") {
      return (
        <span
          className={cn(
            "flex size-full items-center justify-center bg-navy-800 text-xs font-bold text-accent-200",
            className,
          )}
          aria-hidden="true"
        >
          IT
        </span>
      );
    }
    return (
      <Image
        src="/workdesk/tech-neutral-scene.png"
        alt="IT technician desk with a laptop and network tools"
        width={1024}
        height={768}
        className={cn("h-auto w-full object-contain", className)}
      />
    );
  }

  const art = ART[persona];
  if (crop === "avatar") {
    return (
      <Image
        src={art.avatar}
        alt={art.avatarLabel}
        width={256}
        height={256}
        className={cn("size-full object-cover", className)}
      />
    );
  }

  return (
    <Image
      src={art.scene}
      alt={art.sceneLabel}
      width={1024}
      height={768}
      className={cn("h-auto w-full object-contain", className)}
    />
  );
}
