import {
  Check,
  CircleAlert,
  CircleCheck,
  Download,
  FileText,
  Info,
  TriangleAlert,
} from "lucide-react";

import { Section, SectionHeading, isDarkBackground } from "@/components/blocks/section";
import { ButtonLink, type ButtonVariant } from "@/components/ui/button";
import { SectionImage } from "@/components/visuals/section-image";
import type { BlockOf } from "@/lib/blocks";
import { sanitizeRichText } from "@/lib/sanitize";
import { cn } from "@/lib/utils";

const STYLE_TO_VARIANT: Record<string, ButtonVariant> = {
  primary: "primary",
  secondary: "secondary",
  ghost: "ghost",
  outline: "outline",
};

export function HeadingBlock({ block }: { block: BlockOf<"heading"> }) {
  const dark = isDarkBackground(block.settings);
  const align = block.settings?.align ?? "left";

  return (
    <Section settings={block.settings} defaultPadding="md">
      <SectionHeading
        eyebrow={block.data.eyebrow}
        heading={block.data.text}
        description={block.data.description}
        dark={dark}
        align={align}
        as={block.data.level}
        className="mb-0"
      />
    </Section>
  );
}

export function RichTextBlock({ block }: { block: BlockOf<"richText"> }) {
  const dark = isDarkBackground(block.settings);

  return (
    <Section settings={block.settings} defaultPadding="md">
      <div
        className={cn(
          "prose-wc",
          dark && "prose-wc-invert",
          block.data.columns === "2" && "lg:columns-2 lg:gap-12",
        )}
        dangerouslySetInnerHTML={{
          __html: sanitizeRichText(block.data.html),
        }}
      />
    </Section>
  );
}

export function ImageTextBlock({ block }: { block: BlockOf<"imageText"> }) {
  const { data } = block;
  const dark = isDarkBackground(block.settings);
  const imageFirst = data.imagePosition === "left";

  return (
    <Section settings={block.settings} className="overflow-hidden">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className={cn(imageFirst && "lg:order-2")}>
          {data.eyebrow && (
            <p
              className={cn(
                "mb-3 text-xs font-bold uppercase tracking-[0.14em]",
                dark ? "text-accent-400" : "text-brand-600",
              )}
            >
              {data.eyebrow}
            </p>
          )}
          {data.heading && (
            <h2
              className={cn(
                "text-balance-tight text-3xl leading-tight lg:text-[2.25rem]",
                dark ? "text-white" : "text-navy-900",
              )}
            >
              {data.heading}
            </h2>
          )}
          {data.html && (
            <div
              className={cn("prose-wc mt-5", dark && "prose-wc-invert")}
              dangerouslySetInnerHTML={{
                __html: sanitizeRichText(data.html),
              }}
            />
          )}
          {data.bullets.length > 0 && (
            <ul className="mt-6 space-y-3">
              {data.bullets.map((bullet, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                      dark ? "bg-accent-500/20" : "bg-accent-100",
                    )}
                  >
                    <Check
                      className={cn(
                        "size-3",
                        dark ? "text-accent-300" : "text-accent-700",
                      )}
                      aria-hidden="true"
                    />
                  </span>
                  <span
                    className={cn(
                      "text-[0.9375rem] leading-relaxed",
                      dark ? "text-navy-200" : "text-slate-600",
                    )}
                  >
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {data.buttons.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {data.buttons.map((button, index) => (
                <ButtonLink
                  key={index}
                  href={button.href}
                  openInNewTab={button.openInNewTab}
                  variant={STYLE_TO_VARIANT[button.style] ?? "primary"}
                >
                  {button.label}
                </ButtonLink>
              ))}
            </div>
          )}
        </div>

        {data.image.url && (
          <figure className={cn("relative", imageFirst && "lg:order-1")}>
            <SectionImage
              src={data.image.url}
              alt={data.image.alt}
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="w-full rounded-xl object-cover shadow-card"
            />
            {data.image.caption && (
              <figcaption
                className={cn(
                  "mt-3 text-sm",
                  dark ? "text-navy-300" : "text-slate-500",
                )}
              >
                {data.image.caption}
              </figcaption>
            )}
          </figure>
        )}
      </div>
    </Section>
  );
}

const BANNER_TONES = {
  info: {
    wrapper: "border-brand-200 bg-brand-50 text-brand-900",
    icon: "text-brand-600",
    Icon: Info,
  },
  warning: {
    wrapper: "border-amber-200 bg-amber-50 text-amber-900",
    icon: "text-amber-600",
    Icon: TriangleAlert,
  },
  success: {
    wrapper: "border-accent-200 bg-accent-50 text-accent-900",
    icon: "text-accent-600",
    Icon: CircleCheck,
  },
  critical: {
    wrapper: "border-red-200 bg-red-50 text-red-900",
    icon: "text-red-600",
    Icon: CircleAlert,
  },
} as const;

export function BannerBlock({ block }: { block: BlockOf<"banner"> }) {
  const tone = BANNER_TONES[block.data.tone];
  const { Icon } = tone;

  return (
    <Section settings={block.settings} defaultPadding="sm">
      <div
        className={cn(
          "flex items-start gap-3.5 rounded-xl border p-4 lg:p-5",
          tone.wrapper,
        )}
        role={
          block.data.tone === "critical" || block.data.tone === "warning"
            ? "alert"
            : undefined
        }
      >
        {block.data.icon && (
          <Icon className={cn("mt-0.5 size-5 shrink-0", tone.icon)} aria-hidden="true" />
        )}
        <div className="flex-1 text-[0.9375rem] leading-relaxed">
          {block.data.text}
          {block.data.link?.href && (
            <a
              href={block.data.link.href}
              className="ml-2 font-semibold underline underline-offset-2"
            >
              {block.data.link.label}
            </a>
          )}
        </div>
      </div>
    </Section>
  );
}

export function DownloadsBlock({ block }: { block: BlockOf<"downloads"> }) {
  const dark = isDarkBackground(block.settings);

  return (
    <Section settings={block.settings}>
      <SectionHeading
        heading={block.data.heading}
        description={block.data.description}
        dark={dark}
      />
      <ul className="space-y-3">
        {block.data.items.map((item, index) => (
          <li key={index}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "group flex items-center gap-4 rounded-xl border p-4 transition-all hover:shadow-card",
                dark
                  ? "border-navy-700 bg-navy-800/60 hover:border-accent-500/50"
                  : "border-slate-200 bg-white hover:border-brand-300",
              )}
            >
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-lg",
                  dark ? "bg-navy-700 text-accent-400" : "bg-brand-50 text-brand-600",
                )}
              >
                <FileText className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate font-semibold",
                    dark ? "text-white" : "text-navy-800",
                  )}
                >
                  {item.title}
                </span>
                <span
                  className={cn(
                    "text-xs uppercase tracking-wide",
                    dark ? "text-navy-400" : "text-slate-500",
                  )}
                >
                  {item.fileType}
                  {item.fileSize ? ` · ${item.fileSize}` : ""}
                </span>
              </span>
              <Download
                className={cn(
                  "size-5 shrink-0 transition-transform group-hover:translate-y-0.5",
                  dark ? "text-navy-400" : "text-slate-400",
                )}
                aria-hidden="true"
              />
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}

const SPACER_SIZES: Record<string, string> = {
  sm: "h-8",
  md: "h-14",
  lg: "h-20",
  xl: "h-28",
};

export function SpacerBlock({ block }: { block: BlockOf<"spacer"> }) {
  return (
    <div className={cn(isDarkBackground(block.settings) ? "bg-navy-900" : "bg-white")}>
      <div className="container-page">
        <div
          className={cn(
            "flex items-center",
            SPACER_SIZES[block.data.size] ?? SPACER_SIZES.md,
          )}
        >
          {block.data.showDivider && (
            <hr className="w-full border-t border-slate-200" />
          )}
        </div>
      </div>
    </div>
  );
}
