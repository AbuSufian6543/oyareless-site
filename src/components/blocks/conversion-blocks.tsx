import { ChevronDown, Clock, Mail, MapPin, Phone, Quote, Star } from "lucide-react";

import { Section, SectionHeading, isDarkBackground } from "@/components/blocks/section";
import { ButtonLink, type ButtonVariant } from "@/components/ui/button";
import type { BlockOf } from "@/lib/blocks";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { cn, telHref } from "@/lib/utils";

const STYLE_TO_VARIANT: Record<string, ButtonVariant> = {
  primary: "primary",
  secondary: "secondary",
  ghost: "ghost",
  outline: "outline",
};

export function CtaBlock({ block }: { block: BlockOf<"cta"> }) {
  const { data } = block;

  if (data.variant === "boxed") {
    return (
      <Section settings={block.settings} defaultBackground="white">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-brand-900 p-8 lg:p-12">
          <div className="bg-tech-grid absolute inset-0" aria-hidden="true" />
          <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-balance-tight text-2xl font-bold text-white lg:text-3xl">
                {data.heading}
              </h2>
              {data.description && (
                <p className="mt-3 text-navy-200">{data.description}</p>
              )}
            </div>
            <CtaActions data={data} dark />
          </div>
        </div>
      </Section>
    );
  }

  const dark = isDarkBackground(block.settings) || data.variant === "banner";

  return (
    <Section
      settings={block.settings}
      defaultBackground={data.variant === "banner" ? "gradient" : "light"}
      className={data.variant === "banner" ? "bg-tech-grid" : undefined}
    >
      <div
        className={cn(
          "flex flex-col gap-6",
          data.variant === "split"
            ? "lg:flex-row lg:items-center lg:justify-between"
            : "items-center text-center",
        )}
      >
        <div
          className={cn(data.variant === "split" ? "max-w-2xl" : "max-w-3xl")}
        >
          <h2
            className={cn(
              "text-balance-tight text-3xl font-bold lg:text-[2.25rem]",
              dark ? "text-white" : "text-navy-900",
            )}
          >
            {data.heading}
          </h2>
          {data.description && (
            <p
              className={cn(
                "mt-4 text-lg leading-relaxed",
                dark ? "text-navy-200" : "text-slate-600",
              )}
            >
              {data.description}
            </p>
          )}
        </div>
        <CtaActions data={data} dark={dark} centered={data.variant !== "split"} />
      </div>
    </Section>
  );
}

function CtaActions({
  data,
  dark,
  centered = false,
}: {
  data: BlockOf<"cta">["data"];
  dark: boolean;
  centered?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-wrap items-center gap-3",
        centered && "justify-center",
      )}
    >
      {data.buttons.map((button, index) => (
        <ButtonLink
          key={index}
          href={button.href}
          openInNewTab={button.openInNewTab}
          size="lg"
          variant={
            button.style === "primary" && dark
              ? "accent"
              : (STYLE_TO_VARIANT[button.style] ?? "primary")
          }
          className={
            button.style === "outline" && dark
              ? "border-white/35 text-white hover:bg-white/10"
              : undefined
          }
        >
          {button.label}
        </ButtonLink>
      ))}

      {data.phone && (
        <a
          href={telHref(data.phone)}
          className={cn(
            "inline-flex items-center gap-2 text-lg font-bold transition-colors",
            dark
              ? "text-white hover:text-accent-300"
              : "text-navy-800 hover:text-brand-700",
          )}
        >
          <Phone className="size-5" aria-hidden="true" />
          {data.phone}
        </a>
      )}
    </div>
  );
}

/**
 * Native `<details>` keeps the accordion keyboard-accessible and functional
 * without client-side JavaScript.
 */
export function FaqBlock({ block }: { block: BlockOf<"faq"> }) {
  const dark = isDarkBackground(block.settings);

  return (
    <Section settings={block.settings}>
      <SectionHeading
        heading={block.data.heading}
        description={block.data.description}
        dark={dark}
      />

      <div className="space-y-3">
        {block.data.items.map((item, index) => (
          <details
            key={index}
            className={cn(
              "group rounded-xl border transition-colors",
              dark
                ? "border-navy-700 bg-navy-800/50 open:border-accent-500/40"
                : "border-slate-200 bg-white open:border-brand-200 open:shadow-card",
            )}
          >
            <summary
              className={cn(
                "flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold",
                dark ? "text-white" : "text-navy-800",
              )}
            >
              {item.question}
              <ChevronDown
                className={cn(
                  "size-5 shrink-0 transition-transform group-open:rotate-180",
                  dark ? "text-navy-400" : "text-slate-400",
                )}
                aria-hidden="true"
              />
            </summary>
            <div
              className={cn(
                "px-5 pb-5 text-[0.9375rem] leading-relaxed",
                dark ? "text-navy-200" : "text-slate-600",
              )}
            >
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </Section>
  );
}

export async function TestimonialsBlock({
  block,
}: {
  block: BlockOf<"testimonials">;
}) {
  const dark = isDarkBackground(block.settings);

  let items = block.data.items.map((item) => ({
    quote: item.quote,
    authorName: item.authorName,
    authorRole: item.authorRole,
    company: item.company,
    rating: item.rating,
  }));

  if (block.data.source === "database") {
    try {
      const records = await prisma.testimonial.findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ featured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
        take: block.data.limit,
      });
      items = records.map((record) => ({
        quote: record.quote,
        authorName: record.authorName,
        authorRole: record.authorRole ?? "",
        company: record.company ?? "",
        rating: record.rating,
      }));
    } catch {
      items = [];
    }
  }

  if (items.length === 0) return null;

  return (
    <Section settings={block.settings} defaultBackground="light">
      <SectionHeading heading={block.data.heading} dark={dark} align="center" />

      <div
        className={cn(
          "grid gap-6",
          items.length === 2 && "sm:grid-cols-2",
          items.length >= 3 && "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {items.map((item, index) => (
          <figure
            key={index}
            className={cn(
              "flex flex-col rounded-xl border p-6",
              dark ? "border-navy-700 bg-navy-800/60" : "border-slate-200 bg-white",
            )}
          >
            <Quote
              className={cn(
                "size-7",
                dark ? "text-accent-500/40" : "text-brand-200",
              )}
              aria-hidden="true"
            />
            <blockquote
              className={cn(
                "mt-3 flex-1 text-[0.9375rem] leading-relaxed",
                dark ? "text-navy-200" : "text-slate-600",
              )}
            >
              {item.quote}
            </blockquote>

            {item.rating > 0 && (
              <div
                className="mt-4 flex gap-0.5"
                aria-label={`${item.rating} out of 5 stars`}
              >
                {Array.from({ length: 5 }, (_, starIndex) => (
                  <Star
                    key={starIndex}
                    className={cn(
                      "size-4",
                      starIndex < item.rating
                        ? "fill-accent-500 text-accent-500"
                        : dark
                          ? "text-navy-600"
                          : "text-slate-300",
                    )}
                    aria-hidden="true"
                  />
                ))}
              </div>
            )}

            <figcaption
              className={cn(
                "mt-4 border-t pt-4",
                dark ? "border-navy-700" : "border-slate-200",
              )}
            >
              <span
                className={cn(
                  "block font-bold",
                  dark ? "text-white" : "text-navy-800",
                )}
              >
                {item.authorName}
              </span>
              {(item.authorRole || item.company) && (
                <span
                  className={cn(
                    "text-sm",
                    dark ? "text-navy-400" : "text-slate-500",
                  )}
                >
                  {[item.authorRole, item.company].filter(Boolean).join(", ")}
                </span>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}

export async function ContactDetailsBlock({
  block,
}: {
  block: BlockOf<"contactDetails">;
}) {
  const settings = await getSettings();
  const dark = isDarkBackground(block.settings);
  const mapUrl = block.data.mapEmbedUrl || settings.mapEmbedUrl;

  return (
    <Section settings={block.settings}>
      <SectionHeading heading={block.data.heading} dark={dark} />

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-5">
          <DetailRow
            Icon={MapPin}
            label="Visit us"
            dark={dark}
            lines={[
              settings.addressLine1,
              settings.addressLine2,
              `${settings.city}, ${settings.province} ${settings.postalCode}`,
              settings.country,
            ].filter(Boolean)}
          />
          <DetailRow
            Icon={Phone}
            label="Call us"
            dark={dark}
            lines={[settings.phone, settings.localPhone].filter(Boolean)}
            href={telHref(settings.phone)}
          />
          <DetailRow
            Icon={Mail}
            label="Email us"
            dark={dark}
            lines={[settings.email]}
            href={`mailto:${settings.email}`}
          />
          {settings.businessHours && (
            <DetailRow
              Icon={Clock}
              label="Hours"
              dark={dark}
              lines={[settings.businessHours, settings.emergencyNote].filter(Boolean)}
            />
          )}

          {block.data.extraNote && (
            <p
              className={cn(
                "rounded-xl border p-4 text-sm leading-relaxed",
                dark
                  ? "border-navy-700 bg-navy-800/50 text-navy-200"
                  : "border-slate-200 bg-slate-50 text-slate-600",
              )}
            >
              {block.data.extraNote}
            </p>
          )}
        </div>

        {block.data.showMap && mapUrl && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <iframe
              src={mapUrl}
              title={`Map showing ${settings.companyName}`}
              className="h-80 w-full lg:h-full lg:min-h-[22rem]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}
      </div>
    </Section>
  );
}

function DetailRow({
  Icon,
  label,
  lines,
  href,
  dark,
}: {
  Icon: typeof MapPin;
  label: string;
  lines: string[];
  href?: string;
  dark: boolean;
}) {
  const content = (
    <>
      <span
        className={cn(
          "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg",
          dark ? "bg-navy-700 text-accent-400" : "bg-brand-50 text-brand-600",
        )}
      >
        <Icon className="size-4.5" aria-hidden="true" />
      </span>
      <span>
        <span
          className={cn(
            "block text-xs font-bold uppercase tracking-wider",
            dark ? "text-navy-400" : "text-slate-500",
          )}
        >
          {label}
        </span>
        {lines.map((line, index) => (
          <span
            key={index}
            className={cn(
              "block",
              index === 0
                ? cn("font-semibold", dark ? "text-white" : "text-navy-800")
                : cn("text-sm", dark ? "text-navy-300" : "text-slate-600"),
            )}
          >
            {line}
          </span>
        ))}
      </span>
    </>
  );

  return href ? (
    <a href={href} className="flex gap-4 transition-opacity hover:opacity-80">
      {content}
    </a>
  ) : (
    <div className="flex gap-4">{content}</div>
  );
}
