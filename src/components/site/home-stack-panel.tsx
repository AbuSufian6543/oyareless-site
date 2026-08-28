import { BlockIcon } from "@/components/ui/icon";

const LINES = [
  {
    icon: "network",
    title: "Networks & IT",
    detail: "Switching, Wi-Fi, firewalls, cabling, Microsoft 365 and cloud.",
  },
  {
    icon: "cctv",
    title: "Building security",
    detail: "Cameras, alarms, access control, and monitoring we contract.",
  },
  {
    icon: "phone",
    title: "Voice",
    detail: "Hosted VoIP, desk phones, and an attendant when the site needs one.",
  },
  {
    icon: "radio",
    title: "Two-way radio",
    detail: "Hytera DMR — we are an authorized dealer.",
  },
] as const;

/**
 * Hero-side scope card. It lists the work, not a product pitch, so the home
 * page reads as a technology firm rather than an AI feature.
 */
export function HomeStackPanel() {
  return (
    <aside
      className="relative mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end"
      aria-label="What WirelessCom.Ca Inc. designs and supports"
    >
      <div
        className="pointer-events-none absolute -inset-6 rounded-3xl bg-accent-500/10 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-navy-950/80 shadow-lift backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-navy-300">
            Scope of work
          </p>
          <span className="text-[0.6875rem] font-semibold text-accent-300">
            Since 2005
          </span>
        </div>
        <ul className="divide-y divide-white/10">
          {LINES.map((line) => (
            <li key={line.title} className="flex gap-3.5 px-5 py-4">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-500/15 text-accent-300">
                <BlockIcon name={line.icon} className="size-4.5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-white">
                  {line.title}
                </span>
                <span className="mt-0.5 block text-[0.8125rem] leading-relaxed text-navy-300">
                  {line.detail}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
