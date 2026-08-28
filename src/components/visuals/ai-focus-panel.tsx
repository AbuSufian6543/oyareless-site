import { SectionImage } from "@/components/visuals/section-image";
import { DetectionCorners } from "@/components/visuals/detection-corners";
import { cn } from "@/lib/utils";

/**
 * Hero-side illustration of the two places we actually put AI: cameras and
 * phones. Photographs are real install photography; overlays are chrome, not
 * live detections or a recorded call.
 */

const CARDS = [
  {
    src: "/images/ai-camera-1400.webp",
    alt: "IP dome camera in the foreground with a security monitor showing cyan AI detection overlays on a night-time scene",
    kicker: "Cameras",
    title: "People, vehicles and search",
    kind: "camera" as const,
  },
  {
    src: "/images/ai-phone-1400.webp",
    alt: "Black executive VoIP desk phone whose display shows an abstract cyan assistant waveform",
    kicker: "Phones",
    title: "Attendant and transcription",
    kind: "phone" as const,
  },
];

export function AiFocusPanel() {
  return (
    <aside
      className="relative mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end"
      aria-label="Illustration of AI on cameras and phones. Not live site data."
    >
      <div
        className="pointer-events-none absolute -inset-6 rounded-3xl bg-accent-500/12 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-navy-950/75 shadow-lift backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-navy-300">
            Practical AI
          </p>
          <span className="inline-flex items-center gap-1.5 text-[0.6875rem] font-semibold text-accent-300">
            <span className="size-1.5 rounded-full bg-accent-400 animate-live-dot" />
            On equipment you own
          </span>
        </div>

        <ul className="grid gap-3 p-3">
          {CARDS.map((card) => (
            <li key={card.kind}>
              <figure className="relative overflow-hidden rounded-xl border border-white/10 bg-navy-900">
                <div className="relative aspect-16/10">
                  <SectionImage
                    src={card.src}
                    alt={card.alt}
                    sizes="(min-width: 1024px) 22rem, 100vw"
                    className="size-full object-cover"
                    priority={card.kind === "camera"}
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/20 to-transparent"
                    aria-hidden="true"
                  />
                  {card.kind === "camera" ? (
                    <DetectionCorners inset />
                  ) : (
                    <WaveformChrome />
                  )}
                </div>
                <figcaption className="absolute inset-x-0 bottom-0 px-3.5 pb-3 pt-8">
                  <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-accent-300">
                    {card.kicker}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-white">
                    {card.title}
                  </p>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>

        <p className="border-t border-white/10 px-5 py-3 text-[0.6875rem] leading-relaxed text-navy-400">
          Analytics on the cameras. An attendant on the phones. Not a chatbot
          on the website, and not a replacement for a lock or a person.
        </p>
      </div>
    </aside>
  );
}

function WaveformChrome() {
  const bars = [40, 70, 55, 90, 48, 76, 42, 64];

  return (
    <div
      className="pointer-events-none absolute inset-x-4 bottom-12 flex h-8 items-end justify-end gap-1 opacity-80"
      aria-hidden="true"
    >
      {bars.map((height, index) => (
        <span
          key={index}
          className={cn(
            "w-1 rounded-full bg-accent-400/90 origin-bottom animate-ai-bar",
          )}
          style={{
            height: `${height}%`,
            animationDelay: `${index * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}
