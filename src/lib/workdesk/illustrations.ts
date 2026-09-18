import type { DashboardPersona } from "@/generated/prisma/client";

export const DEFAULT_DASHBOARD_PERSONA = "RACK" satisfies DashboardPersona;

export const DASHBOARD_ILLUSTRATIONS = {
  RACK: {
    src: "/workdesk/rack.png",
    label: "Rack technician",
    alt: "Technician wiring a network cabinet with a laptop on the floor",
    frame: "bg-white",
  },
  ENGINEERING: {
    src: "/workdesk/engineering.png",
    label: "Computer engineering",
    alt: "Engineer in a suit holding a laptop, motherboard, and tools",
    frame: "bg-[#fb5339]",
  },
  BENCH: {
    src: "/workdesk/bench.png",
    label: "Repair bench",
    alt: "Technician at a bench repairing a circuit board",
    frame: "bg-white",
  },
} as const satisfies Record<
  DashboardPersona,
  { src: string; label: string; alt: string; frame: string }
>;

export function resolveDashboardPersona(
  value: DashboardPersona | null | undefined,
): DashboardPersona {
  return value && value in DASHBOARD_ILLUSTRATIONS ? value : DEFAULT_DASHBOARD_PERSONA;
}
