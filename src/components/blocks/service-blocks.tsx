import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";

import { Section, SectionHeading, isDarkBackground } from "@/components/blocks/section";
import { ButtonLink } from "@/components/ui/button";
import { BlockIcon } from "@/components/ui/icon";
import { SectionImage } from "@/components/visuals/section-image";
import { StatCounter } from "@/components/visuals/stat-counter";
import type { BlockOf } from "@/lib/blocks";
import { cn } from "@/lib/utils";

const GRID_COLUMNS: Record<string, string> = {
  "2": "sm:grid-cols-2",
  "3": "sm:grid-cols-2 lg:grid-cols-3",
  "4": "sm:grid-cols-2 lg:grid-cols-4",
};

export function FeatureGridBlock({ block }: { block: BlockOf<"featureGrid"> }) {
  const { data } = block;
  const dark = isDarkBackground(block.settings);

  return (
    <Section settings={block.settings}>
      <SectionHeading
        heading={data.heading}
        description={data.description}
        dark={dark}
        align={block.settings?.align ?? "left"}
      />

      <div className={cn("grid gap-5", GRID_COLUMNS[data.columns] ?? GRID_COLUMNS["3"])}>
        {data.items.map((item, index) => (
          <div
            key={index}
            className={cn(
              "group relative",
              data.style === "card" &&
                (dark
                  ? "rounded-xl border border-navy-700 bg-navy-800/60 p-6 transition-all hover:border-accent-500/40 hover:bg-navy-800"
                  : "rounded-xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"),
              data.style === "bordered" &&
                (dark
                  ? "border-l-2 border-accent-500/50 pl-5"
                  : "border-l-2 border-brand-200 pl-5"),
              data.style === "plain" && "",
              data.style === "numbered" && "",
            )}
          >
            {data.style === "numbered" ? (
              <span
                className={cn(
                  "mb-4 flex size-10 items-center justify-center rounded-lg text-base font-bold",
                  dark
                    ? "bg-accent-500/15 text-accent-300"
                    : "bg-brand-50 text-brand-700",
                )}
              >
                {index + 1}
              </span>
            ) : (
              <span
                className={cn(
                  "mb-4 flex size-11 items-center justify-center rounded-lg transition-colors",
                  dark
                    ? "bg-navy-700 text-accent-400 group-hover:bg-accent-500/20"
                    : "bg-brand-50 text-brand-600 group-hover:bg-brand-100",
                )}
              >
                <BlockIcon name={item.icon} className="size-5.5" />
              </span>
            )}

            <h3
              className={cn(
                "text-[1.0625rem] font-bold",
                dark ? "text-white" : "text-navy-800",
              )}
            >
              {item.title}
            </h3>
            {item.description && (
              <p
                className={cn(
                  "mt-2 text-[0.9375rem] leading-relaxed",
                  dark ? "text-navy-300" : "text-slate-600",
                )}
              >
                {item.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

export function ServiceGridBlock({ block }: { block: BlockOf<"serviceGrid"> }) {
  const { data } = block;
  const dark = isDarkBackground(block.settings);

  return (
    <Section settings={block.settings}>
      <SectionHeading
        heading={data.heading}
        description={data.description}
        dark={dark}
        align={block.settings?.align ?? "left"}
      />

      <div className={cn("grid gap-5", GRID_COLUMNS[data.columns] ?? GRID_COLUMNS["3"])}>
        {data.items.map((item, index) => {
          const inner = (
            <>
              {item.imageUrl && (
                <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-lg">
                  <SectionImage
                    src={item.imageUrl}
                    alt={item.imageAlt || item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors",
                    dark
                      ? "bg-navy-700 text-accent-400 group-hover:bg-accent-500/20"
                      : "bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white",
                  )}
                >
                  <BlockIcon name={item.icon} className="size-5.5" />
                </span>
                {item.badge && (
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-wide",
                      dark
                        ? "bg-accent-500/20 text-accent-300"
                        : "bg-accent-100 text-accent-800",
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              <h3
                className={cn(
                  "mt-4 text-lg font-bold",
                  dark ? "text-white" : "text-navy-800",
                )}
              >
                {item.title}
              </h3>
              {item.description && (
                <p
                  className={cn(
                    "mt-2 flex-1 text-[0.9375rem] leading-relaxed",
                    dark ? "text-navy-300" : "text-slate-600",
                  )}
                >
                  {item.description}
                </p>
              )}
              {item.href && (
                <span
                  className={cn(
                    "mt-5 inline-flex items-center gap-1.5 text-sm font-semibold",
                    dark ? "text-accent-400" : "text-brand-600",
                  )}
                >
                  Learn more
                  <ArrowUpRight
                    className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </span>
              )}
            </>
          );

          const cardClass = cn(
            "group flex h-full flex-col rounded-xl border p-6 transition-all",
            dark
              ? "border-navy-700 bg-navy-800/60 hover:border-accent-500/40 hover:bg-navy-800"
              : "border-slate-200 bg-white hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift",
          );

          return item.href ? (
            <Link key={index} href={item.href} className={cardClass}>
              {inner}
            </Link>
          ) : (
            <div key={index} className={cardClass}>
              {inner}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

export function StepsBlock({ block }: { block: BlockOf<"steps"> }) {
  const dark = isDarkBackground(block.settings);

  return (
    <Section settings={block.settings}>
      <SectionHeading
        heading={block.data.heading}
        description={block.data.description}
        dark={dark}
      />

      <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {block.data.items.map((item, index) => (
          <li key={index} className="relative">
            {/* Connector line between steps on wide screens. */}
            {index < block.data.items.length - 1 && (
              <span
                className={cn(
                  "absolute left-11 top-5 hidden h-px w-[calc(100%-1.5rem)] lg:block",
                  dark ? "bg-navy-700" : "bg-slate-200",
                )}
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                "relative flex size-10 items-center justify-center rounded-full text-sm font-bold",
                dark
                  ? "bg-accent-500 text-navy-950"
                  : "bg-brand-600 text-white",
              )}
            >
              {index + 1}
            </span>
            <h3
              className={cn(
                "mt-4 font-bold",
                dark ? "text-white" : "text-navy-800",
              )}
            >
              {item.title}
            </h3>
            <p
              className={cn(
                "mt-1.5 text-sm leading-relaxed",
                dark ? "text-navy-300" : "text-slate-600",
              )}
            >
              {item.description}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function SpecTableBlock({ block }: { block: BlockOf<"specTable"> }) {
  const { data } = block;
  const dark = isDarkBackground(block.settings);

  return (
    <Section settings={block.settings}>
      <SectionHeading
        heading={data.heading}
        description={data.description}
        dark={dark}
      />

      <div
        className={cn(
          "overflow-x-auto rounded-xl border",
          dark ? "border-navy-700" : "border-slate-200",
        )}
      >
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className={dark ? "bg-navy-800" : "bg-slate-50"}>
              {data.columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className={cn(
                    "px-4 py-3.5 font-bold",
                    dark ? "text-white" : "text-navy-800",
                  )}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  "border-t",
                  dark ? "border-navy-700" : "border-slate-200",
                  rowIndex % 2 === 1 && (dark ? "bg-navy-800/40" : "bg-slate-50/60"),
                )}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={cn(
                      "px-4 py-3 align-top",
                      cellIndex === 0
                        ? dark
                          ? "font-semibold text-navy-100"
                          : "font-semibold text-navy-800"
                        : dark
                          ? "text-navy-300"
                          : "text-slate-600",
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

export function PricingBlock({ block }: { block: BlockOf<"pricing"> }) {
  const { data } = block;
  const dark = isDarkBackground(block.settings);

  return (
    <Section settings={block.settings}>
      <SectionHeading
        heading={data.heading}
        description={data.description}
        dark={dark}
        align="center"
      />

      <div
        className={cn(
          "grid gap-6",
          data.plans.length === 2 && "sm:grid-cols-2",
          data.plans.length === 3 && "lg:grid-cols-3",
          data.plans.length >= 4 && "sm:grid-cols-2 lg:grid-cols-4",
        )}
      >
        {data.plans.map((plan, index) => (
          <div
            key={index}
            className={cn(
              "relative flex flex-col rounded-xl border p-6",
              plan.highlighted
                ? "border-brand-500 bg-white shadow-lift ring-1 ring-brand-500"
                : dark
                  ? "border-navy-700 bg-navy-800/60"
                  : "border-slate-200 bg-white",
            )}
          >
            {plan.highlighted && (
              <span className="absolute -top-3 left-6 rounded-full bg-brand-600 px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-wide text-white">
                Most popular
              </span>
            )}

            <h3
              className={cn(
                "text-lg font-bold",
                dark && !plan.highlighted ? "text-white" : "text-navy-800",
              )}
            >
              {plan.name}
            </h3>
            {plan.description && (
              <p
                className={cn(
                  "mt-1.5 text-sm",
                  dark && !plan.highlighted ? "text-navy-300" : "text-slate-600",
                )}
              >
                {plan.description}
              </p>
            )}

            {plan.price && (
              <p className="mt-5 flex items-baseline gap-1">
                <span
                  className={cn(
                    "text-3xl font-extrabold",
                    dark && !plan.highlighted ? "text-white" : "text-navy-900",
                  )}
                >
                  {plan.price}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    dark && !plan.highlighted ? "text-navy-400" : "text-slate-500",
                  )}
                >
                  {plan.period}
                </span>
              </p>
            )}

            <ul className="mt-6 flex-1 space-y-2.5">
              {plan.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-start gap-2.5 text-sm">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-accent-600"
                    aria-hidden="true"
                  />
                  <span
                    className={
                      dark && !plan.highlighted
                        ? "text-navy-200"
                        : "text-slate-600"
                    }
                  >
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <ButtonLink
              href={plan.button?.href ?? "/contact"}
              variant={plan.highlighted ? "primary" : "outline"}
              className="mt-6 w-full"
            >
              {plan.button?.label ?? "Request a quote"}
            </ButtonLink>
          </div>
        ))}
      </div>

      {data.footnote && (
        <p
          className={cn(
            "mt-6 text-center text-sm",
            dark ? "text-navy-400" : "text-slate-500",
          )}
        >
          {data.footnote}
        </p>
      )}
    </Section>
  );
}

export function StatsBlock({ block }: { block: BlockOf<"stats"> }) {
  const dark = isDarkBackground(block.settings);
  const chips = block.data.chips ?? [];

  return (
    <Section
      settings={block.settings}
      defaultBackground="grid"
      defaultPadding="md"
      className="isolate before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-warm-500 before:via-warm-400 before:to-accent-400 before:content-['']"
    >
      {(block.data.heading || chips.length > 0) && (
        <div className={cn("mb-8", block.data.heading ? "" : "text-center")}>
          {block.data.heading ? (
            <SectionHeading
              heading={block.data.heading}
              dark={dark}
              align="center"
              className={chips.length > 0 ? "mb-5" : undefined}
            />
          ) : null}
          {chips.length > 0 && (
            <ul className="flex flex-wrap items-center justify-center gap-2">
              {chips.map((chip) => (
                <li
                  key={chip}
                  className={cn(
                    "rounded-full border px-2.5 py-1 font-mono text-[0.6875rem] font-semibold tracking-wide",
                    dark
                      ? "border-accent-500/25 bg-navy-950/40 text-accent-200"
                      : "border-slate-200 bg-white text-navy-700",
                  )}
                >
                  {chip}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <dl
        className={cn(
          "grid gap-4 text-center sm:gap-5",
          block.data.items.length === 2 && "sm:grid-cols-2",
          block.data.items.length === 3 && "sm:grid-cols-3",
          block.data.items.length === 5 && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
          (block.data.items.length === 4 || block.data.items.length > 5) &&
            "grid-cols-2 lg:grid-cols-4",
        )}
      >
        {block.data.items.map((item, index) => (
          <div
            key={index}
            className={cn(
              "rounded-xl border px-4 py-6 lg:px-5 lg:py-7",
              dark
                ? "border-warm-400/25 bg-navy-900/55 shadow-[0_0_0_1px_rgb(232_148_58/0.08)]"
                : "border-warm-200 bg-warm-50",
            )}
          >
            <dt className="sr-only">{item.label}</dt>
            <dd>
              <span
                className={cn(
                  "mx-auto mb-3 flex size-9 items-center justify-center rounded-lg",
                  dark
                    ? "bg-warm-400/15 text-warm-300"
                    : "bg-warm-100 text-warm-700",
                )}
              >
                <BlockIcon name={statIcon(item.value, item.label)} className="size-4" />
              </span>
              <StatCounter
                value={item.value}
                suffix={item.suffix}
                className={cn(
                  "block font-extrabold tracking-tight tabular-nums text-4xl lg:text-5xl",
                  dark ? "text-warm-400" : "text-warm-600",
                )}
              />
              <span
                className={cn(
                  "mt-2.5 block text-sm font-medium leading-snug",
                  dark ? "text-navy-100" : "text-slate-600",
                )}
              >
                {item.label}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

function statIcon(value: string, label: string): string {
  const hay = `${value} ${label}`.toLowerCase();
  if (hay.includes("24/7") || hay.includes("alarm") || hay.includes("monitor")) {
    return "siren";
  }
  if (hay.includes("2005") || hay.includes("since")) return "award";
  if (hay.includes("year")) return "activity";
  if (hay.includes("pillar")) return "layers";
  if (hay.includes("esa")) return "shield-check";
  return "network";
}

export function LogoStripBlock({ block }: { block: BlockOf<"logoStrip"> }) {
  const dark = isDarkBackground(block.settings);

  return (
    <Section settings={block.settings} defaultBackground="light" defaultPadding="md">
      {block.data.heading && (
        <p
          className={cn(
            "mb-8 text-center text-xs font-bold uppercase tracking-[0.14em]",
            dark ? "text-navy-300" : "text-slate-500",
          )}
        >
          {block.data.heading}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
        {block.data.images.map((image, index) => (
          <Image
            key={index}
            src={image.url}
            alt={image.alt}
            width={1024}
            height={266}
            className={cn(
              "h-12 w-auto max-w-full object-contain lg:h-14",
              block.data.grayscale &&
                "grayscale opacity-70 transition hover:grayscale-0 hover:opacity-100",
            )}
          />
        ))}
      </div>
    </Section>
  );
}
