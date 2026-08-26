import Image from "next/image";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { NewsletterForm } from "@/components/site/newsletter-form";
import {
  FacebookIcon,
  LinkedInIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/ui/social-icons";
import type { NavNode } from "@/lib/navigation";
import type { SiteSettings } from "@/lib/settings";
import { telHref } from "@/lib/utils";

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

  // Split the footer link list into two balanced columns.
  const midpoint = Math.ceil(nav.length / 2);
  const columns = [nav.slice(0, midpoint), nav.slice(midpoint)];

  return (
    <footer className="bg-navy-900 text-navy-200">
      <div className="bg-tech-grid border-b border-navy-800">
        <div className="container-page py-12 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
            {/* Company */}
            <div className="lg:col-span-4">
              <div className="inline-flex rounded-lg bg-white p-2.5">
                <Image
                  src="/brand/logo.jpg"
                  alt={settings.companyName}
                  width={220}
                  height={42}
                  className="h-8 w-auto"
                />
              </div>
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
                      className="rounded-lg bg-navy-800 p-2.5 text-navy-300 transition-colors hover:bg-brand-600 hover:text-white"
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Links */}
            <div className="grid gap-8 sm:grid-cols-2 lg:col-span-5">
              {columns.map((column, index) => (
                <div key={index}>
                  <h3 className="mb-3.5 text-xs font-bold uppercase tracking-wider text-white">
                    {index === 0 ? "Services" : "Company"}
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {column.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className="text-navy-300 transition-colors hover:text-accent-300"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Newsletter + trust marks */}
            <div className="lg:col-span-3">
              <h3 className="mb-3.5 text-xs font-bold uppercase tracking-wider text-white">
                Stay informed
              </h3>
              <NewsletterForm />

              <div className="mt-6 space-y-3">
                <div className="rounded-lg bg-white p-2.5">
                  <Image
                    src="/brand/partner-logos.jpg"
                    alt="Rogers, Hytera Authorized Dealer, Tait Communications, Ubiquiti Networks, SureCall, and Genetec certified partner"
                    width={1024}
                    height={266}
                    className="h-auto w-full"
                  />
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2">
                  <Image
                    src="/brand/cdn.jpg"
                    alt="Proudly Canadian"
                    width={148}
                    height={38}
                    className="h-5 w-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="container-page flex flex-col gap-3 py-5 text-xs text-navy-400 sm:flex-row sm:items-center sm:justify-between">
        <p>
          &copy; {year} {legalName}. All rights reserved.
          {settings.footerNote ? ` ${settings.footerNote}` : ""}
        </p>
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
