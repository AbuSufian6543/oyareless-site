import { BlockIcon } from "@/components/ui/icon";

/**
 * Decorative architecture card for the home hero. It illustrates how we
 * typically layer a site — not live telemetry, and not a specific customer.
 */

const LAYERS = [
  {
    icon: "shield" as const,
    title: "Perimeter",
    tags: ["NGFW", "VPN", "Email filter"],
  },
  {
    icon: "network" as const,
    title: "LAN",
    tags: ["Switching", "VLAN", "Fiber"],
  },
  {
    icon: "wifi" as const,
    title: "Wireless",
    tags: ["Wi-Fi", "Site survey", "APs"],
  },
  {
    icon: "phone" as const,
    title: "Voice",
    tags: ["VoIP", "DMR radio"],
  },
  {
    icon: "cctv" as const,
    title: "Physical",
    tags: ["CCTV", "Access", "Alarms"],
  },
];

export function SiteStackPanel() {
  return (
    <aside
      className="relative mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end"
      aria-label="Typical site stack we design: perimeter, LAN, wireless, voice and physical security"
    >
      <div
        className="pointer-events-none absolute -inset-6 rounded-3xl bg-accent-500/10 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-navy-950/70 shadow-lift backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-navy-300">
            Typical site stack
          </p>
          <span className="inline-flex items-center gap-1.5 text-[0.6875rem] font-semibold text-accent-300">
            <span className="size-1.5 rounded-full bg-accent-400 animate-live-dot" />
            Designed as one system
          </span>
        </div>

        <ol className="relative px-5 py-4">
          <span
            className="absolute top-6 bottom-6 left-[2.05rem] w-px bg-gradient-to-b from-accent-400/80 via-brand-400/50 to-accent-400/30"
            aria-hidden="true"
          />

          {LAYERS.map((layer, index) => (
            <li key={layer.title} className="relative flex gap-3.5 py-2.5">
              <span className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-lg border border-accent-500/25 bg-navy-900 text-accent-300">
                <BlockIcon name={layer.icon} className="size-4" />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="flex items-baseline justify-between gap-3 text-sm font-semibold text-white">
                  {layer.title}
                  <span className="font-mono text-[0.625rem] font-medium text-navy-500">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </p>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {layer.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[0.625rem] font-medium tracking-wide text-navy-200"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>

        <p className="border-t border-white/10 px-5 py-3 text-[0.6875rem] leading-relaxed text-navy-400">
          Firewalls, switching, Wi-Fi, phones, cameras and doors designed to
          work together — not five separate vendors.
        </p>
      </div>
    </aside>
  );
}
