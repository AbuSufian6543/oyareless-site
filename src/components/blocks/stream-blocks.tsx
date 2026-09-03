import { MapPin, Radio } from "lucide-react";

import { Section, SectionHeading, isDarkBackground } from "@/components/blocks/section";
import { StreamGate } from "@/components/blocks/stream-gate";
import { LiveBadge } from "@/components/blocks/live-badge";
import { MistPlayerSlot } from "@/components/blocks/mist-player-slot";
import { StreamPlayer } from "@/components/blocks/stream-player";
import { parseMistEmbed } from "@/lib/html-stream-embed";
import {
  isHtmlStreamType,
  streamAspectClass,
  streamFrameClass,
  type StreamLayout,
} from "@/lib/stream-public";
import type { BlockOf } from "@/lib/blocks";
import {
  getStreamAccess,
  iframeSourceFor,
  listStreamAccess,
  type StreamAccess,
} from "@/lib/streams";
import { cn } from "@/lib/utils";

export async function LiveStreamBlock({
  block,
}: {
  block: BlockOf<"liveStream">;
}) {
  const dark = isDarkBackground(block.settings);

  if (!block.data.streamSlug) {
    return (
      <Section settings={block.settings}>
        <SectionHeading
          heading={block.data.heading}
          description={block.data.description}
          dark={dark}
        />
        <div className={streamFrameClass("feature")}>
          <EmptyStreamNotice message="Select a stream in the page editor. Create it under Live Streams first if you have not already — that is where the player embed and optional password live." />
        </div>
      </Section>
    );
  }

  const access = await getStreamAccess(block.data.streamSlug).catch(
    () => ({ state: "missing" as const }),
  );

  return (
    <Section settings={block.settings} defaultBackground="dark">
      <SectionHeading
        heading={block.data.heading}
        description={block.data.description}
        dark={isDarkBackground(block.settings, "dark")}
      />
      <StreamCard access={access} showTitle={block.data.showTitle} layout="feature" />
    </Section>
  );
}

const STREAM_COLUMNS: Record<string, string> = {
  "1": "",
  "2": "lg:grid-cols-2",
  "3": "md:grid-cols-2 xl:grid-cols-3",
};

export async function StreamGridBlock({
  block,
}: {
  block: BlockOf<"streamGrid">;
}) {
  const dark = isDarkBackground(block.settings, "dark");
  const hasSlugs = block.data.slugs.length > 0;
  const streams = await listStreamAccess({
    slugs: hasSlugs ? block.data.slugs : undefined,
    featuredOnly: block.data.featuredOnly,
    listedOnly: !hasSlugs,
  }).catch(() => []);
  const layout: StreamLayout =
    streams.length <= 1 || block.data.columns === "1" ? "feature" : "grid";
  const columnsClass =
    layout === "feature"
      ? ""
      : block.data.columns === "3" && streams.length >= 3
        ? STREAM_COLUMNS["3"]
        : STREAM_COLUMNS["2"];

  return (
    <Section settings={block.settings} defaultBackground="dark">
      <SectionHeading
        heading={block.data.heading}
        description={block.data.description}
        dark={dark}
      />

      {streams.length === 0 ? (
        <EmptyStreamNotice message="No published streams yet. Add one under Live Streams in the admin." />
      ) : (
        <div className={cn("grid gap-6", columnsClass)}>
          {streams.map((access, index) => (
            <StreamCard key={index} access={access} showTitle layout={layout} />
          ))}
        </div>
      )}
    </Section>
  );
}

export function StreamCard({
  access,
  showTitle = true,
  layout = "feature",
}: {
  access: StreamAccess;
  showTitle?: boolean;
  layout?: StreamLayout;
}) {
  if (access.state === "missing") {
    return (
      <div className={streamFrameClass(layout)}>
        <EmptyStreamNotice message="This stream is no longer available." />
      </div>
    );
  }

  if (access.state === "locked") {
    return (
      <div className={streamFrameClass(layout)}>
        <StreamGate
          slug={access.slug}
          title={access.title}
          description={access.description}
        />
      </div>
    );
  }

  const { stream } = access;
  const htmlStream = isHtmlStreamType(stream.type);
  const mist = htmlStream ? parseMistEmbed(stream.source) : null;
  const aspectClass = streamAspectClass(stream.aspectRatio);

  return (
    <figure className={streamFrameClass(layout)}>
      {mist ? (
        <MistPlayerSlot
          streamName={mist.streamName}
          loop={mist.loop}
          poster={stream.posterUrl ?? mist.poster ?? ""}
          title={stream.title}
          fallbackHref={
            mist.fallbackHref ??
            `https://videostreamcanada.ca/${mist.streamName}.html`
          }
          aspectClass={aspectClass}
        />
      ) : (
        <StreamPlayer
          stream={htmlStream ? { ...stream, source: "" } : stream}
          iframeSrc={htmlStream ? "" : iframeSourceFor(stream)}
          html={
            htmlStream
              ? stream.source.replace(/<\/script/gi, "<\\/script")
              : ""
          }
          layout="grid"
        />
      )}

      {showTitle && (
        <figcaption className="mt-3.5">
          <div className="flex flex-wrap items-center gap-2.5">
            {stream.isLive && <LiveBadge />}
            <h3 className="text-[1.0625rem] font-bold text-white">
              {stream.title}
            </h3>
          </div>
          {stream.location && (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-navy-300">
              <MapPin className="size-3.5" aria-hidden="true" />
              {stream.location}
            </p>
          )}
          {stream.description && (
            <p className="mt-2 text-sm leading-relaxed text-navy-300">
              {stream.description}
            </p>
          )}
        </figcaption>
      )}
    </figure>
  );
}

function EmptyStreamNotice({ message }: { message: string }) {
  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-navy-700 bg-navy-900/50 p-8 text-center">
      <Radio className="size-8 text-navy-500" aria-hidden="true" />
      <p className="max-w-sm text-sm text-navy-400">{message}</p>
    </div>
  );
}
