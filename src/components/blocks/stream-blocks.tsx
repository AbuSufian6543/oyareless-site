import { MapPin, Radio } from "lucide-react";

import { Section, SectionHeading, isDarkBackground } from "@/components/blocks/section";
import { StreamGate } from "@/components/blocks/stream-gate";
import { LiveBadge, StreamPlayer } from "@/components/blocks/stream-player";
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
        <EmptyStreamNotice message="Select a stream in the page editor. Create it under Live Streams first if you have not already — that is where the player embed and optional password live." />
      </Section>
    );
  }

  const access = await getStreamAccess(block.data.streamSlug);

  return (
    <Section settings={block.settings} defaultBackground="dark">
      <SectionHeading
        heading={block.data.heading}
        description={block.data.description}
        dark={isDarkBackground(block.settings, "dark")}
      />
      <StreamCard access={access} showTitle={block.data.showTitle} />
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
  });

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
        <div
          className={cn(
            "grid gap-6",
            STREAM_COLUMNS[block.data.columns] ?? STREAM_COLUMNS["2"],
          )}
        >
          {streams.map((access, index) => (
            <StreamCard key={index} access={access} showTitle />
          ))}
        </div>
      )}
    </Section>
  );
}

export function StreamCard({
  access,
  showTitle = true,
}: {
  access: StreamAccess;
  showTitle?: boolean;
}) {
  if (access.state === "missing") {
    return <EmptyStreamNotice message="This stream is no longer available." />;
  }

  if (access.state === "locked") {
    return (
      <div>
        <StreamGate
          slug={access.slug}
          title={access.title}
          description={access.description}
        />
      </div>
    );
  }

  const { stream } = access;

  return (
    <figure>
      <StreamPlayer stream={stream} iframeSrc={iframeSourceFor(stream)} />

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
