import { ContactFormBlock } from "@/components/blocks/contact-form";
import {
  BannerBlock,
  DownloadsBlock,
  HeadingBlock,
  ImageTextBlock,
  RichTextBlock,
  SpacerBlock,
} from "@/components/blocks/content-blocks";
import {
  ContactDetailsBlock,
  CtaBlock,
  FaqBlock,
  TestimonialsBlock,
} from "@/components/blocks/conversion-blocks";
import { JobsBlock, PostsBlock } from "@/components/blocks/dynamic-blocks";
import { HeroBlock } from "@/components/blocks/hero-block";
import {
  EmbedBlock,
  GalleryBlock,
  VideoEmbedBlock,
} from "@/components/blocks/media-blocks";
import {
  BrandGridBlock,
  CapabilityGridBlock,
  CaseStudyGridBlock,
  DefenseInDepthBlock,
  KbHighlightsBlock,
  PillarsBlock,
  TechHeroBlock,
  ToolGridBlock,
} from "@/components/blocks/platform-blocks";
import { Section, SectionHeading, isDarkBackground } from "@/components/blocks/section";
import {
  FeatureGridBlock,
  LogoStripBlock,
  PricingBlock,
  ServiceGridBlock,
  SpecTableBlock,
  StatsBlock,
  StepsBlock,
} from "@/components/blocks/service-blocks";
import { SpeedTest } from "@/components/blocks/speed-test";
import { StatusStripBlock } from "@/components/blocks/status-strip-block";
import { TechBackdrop } from "@/components/visuals/tech-backdrop";
import {
  LiveStreamBlock,
  StreamGridBlock,
} from "@/components/blocks/stream-blocks";
import { MediaSlideshow } from "@/components/blocks/media-slideshow";
import { visibleSlideshow, type SlideshowItem } from "@/lib/slideshow";
import type { Block } from "@/lib/blocks";

/**
 * Renders one block. Unknown types render nothing so that content authored
 * against a newer schema cannot crash an older deployment.
 */
export function BlockRenderer({
  block,
  sourcePage,
}: {
  block: Block;
  sourcePage: string;
}) {
  switch (block.type) {
    case "hero":
      return <HeroBlock block={block} />;
    case "heading":
      return <HeadingBlock block={block} />;
    case "richText":
      return <RichTextBlock block={block} />;
    case "imageText":
      return <ImageTextBlock block={block} />;
    case "banner":
      return <BannerBlock block={block} />;
    case "downloads":
      return <DownloadsBlock block={block} />;
    case "spacer":
      return <SpacerBlock block={block} />;
    case "featureGrid":
      return <FeatureGridBlock block={block} />;
    case "serviceGrid":
      return <ServiceGridBlock block={block} />;
    case "steps":
      return <StepsBlock block={block} />;
    case "specTable":
      return <SpecTableBlock block={block} />;
    case "pricing":
      return <PricingBlock block={block} />;
    case "stats":
      return <StatsBlock block={block} />;
    case "logoStrip":
      return <LogoStripBlock block={block} />;
    case "gallery":
      return <GalleryBlock block={block} />;
    case "videoEmbed":
      return <VideoEmbedBlock block={block} />;
    case "embed":
      return <EmbedBlock block={block} />;
    case "cta":
      return <CtaBlock block={block} />;
    case "faq":
      return <FaqBlock block={block} />;
    case "testimonials":
      return <TestimonialsBlock block={block} />;
    case "contactDetails":
      return <ContactDetailsBlock block={block} />;
    case "liveStream":
      return <LiveStreamBlock block={block} />;
    case "streamGrid":
      return <StreamGridBlock block={block} />;
    case "posts":
      return <PostsBlock block={block} />;
    case "jobs":
      return <JobsBlock block={block} />;
    case "techHero":
      return <TechHeroBlock block={block} />;
    case "pillars":
      return <PillarsBlock block={block} />;
    case "capabilityGrid":
      return <CapabilityGridBlock block={block} />;
    case "brandGrid":
      return <BrandGridBlock block={block} />;
    case "statusStrip":
      return <StatusStripBlock block={block} />;
    case "defenseInDepth":
      return <DefenseInDepthBlock block={block} />;
    case "toolGrid":
      return <ToolGridBlock block={block} />;
    case "caseStudyGrid":
      return <CaseStudyGridBlock block={block} />;
    case "kbHighlights":
      return <KbHighlightsBlock block={block} />;
    case "speedTest":
      return (
        <section
          id={block.settings?.anchor || undefined}
          className="relative isolate overflow-hidden bg-navy-950"
          style={
            block.settings?.anchor
              ? { scrollMarginTop: "6rem" }
              : undefined
          }
        >
          <TechBackdrop network density={0.7} glow="center" mood="network" />
          <div className="container-page py-14 lg:py-20">
            <SectionHeading
              heading={block.data.heading}
              description={block.data.description}
              dark
              align="center"
              className="mb-8 lg:mb-10"
            />
            <SpeedTest note={block.data.note} dark />
          </div>
        </section>
      );
    case "contactForm":
      return (
        <Section settings={block.settings}>
          <SectionHeading
            heading={block.data.heading}
            description={block.data.description}
            dark={isDarkBackground(block.settings)}
          />
          <ContactFormBlock
            config={{
              formType: block.data.formType,
              showCompany: block.data.showCompany,
              showAddress: block.data.showAddress,
              showServiceInterest: block.data.showServiceInterest,
              successMessage: block.data.successMessage,
              sourcePage,
              dark: isDarkBackground(block.settings),
            }}
          />
        </Section>
      );
    default:
      return null;
  }
}

export function BlockList({
  blocks,
  sourcePage,
  slideshow = [],
}: {
  blocks: Block[];
  sourcePage: string;
  slideshow?: SlideshowItem[];
}) {
  const slides = visibleSlideshow(slideshow);
  const heroIndex = blocks.findIndex(
    (block) => block.type === "hero" || block.type === "techHero",
  );

  const nodes = blocks.map((block) => (
    <BlockRenderer key={block.id} block={block} sourcePage={sourcePage} />
  ));

  if (slides.length === 0) return <>{nodes}</>;

  const carousel = (
    <section key="page-slideshow" className="bg-slate-50 py-12 lg:py-16">
      <div className="container-page">
        <MediaSlideshow items={slides} />
      </div>
    </section>
  );

  if (heroIndex === -1) {
    return (
      <>
        {carousel}
        {nodes}
      </>
    );
  }

  return (
    <>
      {nodes.slice(0, heroIndex + 1)}
      {carousel}
      {nodes.slice(heroIndex + 1)}
    </>
  );
}
