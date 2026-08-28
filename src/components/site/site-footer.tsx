import Image from "next/image";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { FooterProducts } from "@/components/site/footer-products";
import { NewsletterForm } from "@/components/site/newsletter-form";
import { ProudlyCanadian } from "@/components/site/proudly-canadian";
import {
  FacebookIcon,
  LinkedInIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/ui/social-icons";
import type { NavNode } from "@/lib/navigation";
import type { SiteSettings } from "@/lib/settings";
import { telHref } from "@/lib/utils";

/** Drops a leading “Proudly Canadian” so the visual badge is not repeated. */
function servingNote(footerNote: string): string {
  return footerNote.replace(/Proudly Canadian\.?\s*/gi, "").trim();
}

type FooterColumn = { key: string; heading: string; links: NavNode[] };

/**
 * Builds the footer link columns from the admin-managed FOOTER navigation.
 *
 * A top-level item with children becomes a column, using its own label as the
 * heading. Loose top-level items are gathered into a final column so nothing an
 * admin adds silently disappears. If nobody has grouped anything, the flat list
 * is split in two so the footer still looks deliberate.
 */
function buildColumns(nav: NavNode[]): FooterColumn[] {
  const grouped = nav.filter((item) => item.children.length > 0);
  const loose = nav.filter((item) => item.children.length === 0);

  if (grouped.length === 0) {
    const midpoint = Math.ceil(loose.length / 2);
    return [
      { key: "services", heading: "Services", links: loose.slice(0, midpoint) },
      { key: "company", heading: "Company", links: loose.slice(midpoint) },
    ].filter((column) => column.links.length > 0);
  }

  const columns: FooterColumn[] = grouped.map((item) => ({
    key: item.id,
    heading: item.label,
    links: item.children,
  }));

  if (loose.length > 0) {
    columns.push({ key: "more", heading: "More", links: loose });
  }

  return columns;
}

export function SiteFooter({
  nav,
  settings,
}: {
  nav: NavNode[];
  settings: SiteSettings;
}) {
  const year = new Date().getFullYear();
  // "WirelessCom.Ca Inc." already ends in a period.
  const legalName = settings.companyName.replace(/\.$/, "");

  const socials = [
    { href: settings.socialLinkedIn, Icon: LinkedInIcon, label: "LinkedIn" },
    { href: settings.socialFacebook, Icon: FacebookIcon, label: "Facebook" },
    { href: settings.socialYouTube, Icon: YouTubeIcon, label: "YouTube" },
    { href: settings.socialX, Icon: XIcon, label: "X" },
  ].filter((social) => social.href);

  const columns = buildColumns(nav);

  return (
    <footer className="border-t border-accent-500/20 bg-navy-900 text-navy-200">
      <div className="bg-tech-grid border-b border-navy-800">
        <div className="container-page py-12 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
            {/* Company */}
            <div className="lg:col-span-3">
              <Image
                src={settings.logoInverseUrl || "/brand/logo-inverse.png"}
                alt={settings.companyName}
                width={220}
                height={42}
                className="h-9 w-auto"
              />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-navy-300">
                {settings.description}
              </p>

              <div className="mt-5 space-y-2.5 text-sm">
                <p className="flex items-start gap-2.5">
                  <MapPin
                    className="mt-0.5 size-4 shrink-0 text-accent-400"
                    aria-hidden="true"
                  />
                  <span>
                    {settings.addressLine1}
                    {settings.addressLine2 ? `, ${settings.addressLine2}` : ""}
                    <br />
                    {settings.city}, {settings.province} {settings.postalCode}
                  </span>
                </p>
                <p className="flex items-center gap-2.5">
                  <Phone
                    className="size-4 shrink-0 text-accent-400"
                    aria-hidden="true"
                  />
                  <a
                    href={telHref(settings.phone)}
                    className="font-semibold text-white transition-colors hover:text-accent-300"
                  >
                    {settings.phone}
                  </a>
                </p>
                <p className="flex items-center gap-2.5">
                  <Mail
                    className="size-4 shrink-0 text-accent-400"
                    aria-hidden="true"
                  />
                  <a
                    href={`mailto:${settings.email}`}
                    className="transition-colors hover:text-white"
                  >
                    {settings.email}
                  </a>
                </p>
                {settings.businessHours && (
                  <p className="flex items-start gap-2.5">
                    <Clock
                      className="mt-0.5 size-4 shrink-0 text-accent-400"
                      aria-hidden="true"
                    />
                    <span>{settings.businessHours}</span>
                  </p>
                )}
              </div>

              {socials.length > 0 && (
                <div className="mt-5 flex gap-2">
                  {socials.map(({ href, Icon, label }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="rounded-lg bg-navy-800 p-2.5 text-navy-300 transition-colors hover:bg-accent-500 hover:text-navy-950"
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Links */}
            <div className="grid gap-8 sm:grid-cols-2 lg:col-span-6 lg:grid-cols-4">
              {columns.map((column) => (
                <div key={column.key}>
                  <h3 className="mb-3.5 text-xs font-bold uppercase tracking-wider text-white">
                    {column.heading}
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {column.links.map((item) => (
                      <li key={item.id}>
                        <FooterLink node={item} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Newsletter */}
            <div className="lg:col-span-3">
              <h3 className="mb-3.5 text-xs font-bold uppercase tracking-wider text-white">
                Stay informed
              </h3>
              <NewsletterForm />
            </div>
          </div>

          <FooterProducts />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="container-page flex flex-col gap-4 py-5 text-xs text-navy-400 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-5">
          <ProudlyCanadian />
          <p>
            &copy; {year} {legalName}. All rights reserved.
            {settings.footerNote ? ` ${servingNote(settings.footerNote)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link
            href="/privacy-policy"
            className="transition-colors hover:text-white"
          >
            Privacy Policy
          </Link>
          <Link href="/e-911" className="transition-colors hover:text-white">
            E-911 Notice
          </Link>
          <Link href="/support" className="transition-colors hover:text-white">
            Support
          </Link>
          <Link href="/portal" className="transition-colors hover:text-white">
            Customer Portal
          </Link>
          <Link
            href="/login"
            className="transition-colors hover:text-white"
            rel="nofollow"
          >
            Staff Login
          </Link>
        </div>
      </div>
    </footer>
  );
}

/** External hrefs and new-tab links need an anchor rather than next/link. */
function FooterLink({ node }: { node: NavNode }) {
  const className =
    "text-navy-300 transition-colors hover:text-accent-300";

  if (node.openInNewTab || /^https?:\/\//.test(node.href)) {
    return (
      <a
        href={node.href}
        className={className}
        {...(node.openInNewTab
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {node.label}
      </a>
    );
  }

  return (
    <Link href={node.href} className={className}>
      {node.label}
    </Link>
  );
}
