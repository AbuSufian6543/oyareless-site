"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Mail, Menu, Phone, Search, Shield, X } from "lucide-react";

import type { NavNode } from "@/lib/navigation";
import { cn, telHref } from "@/lib/utils";

type Props = {
  nav: NavNode[];
  phone: string;
  email: string;
  companyName: string;
  tagline: string;
  logoUrl: string;
};

export function SiteHeader({
  nav,
  phone,
  email,
  companyName,
  tagline,
  logoUrl,
}: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Menus close on navigation. Adjusting during render rather than in an effect
  // avoids painting the drawer over the new page for a frame first.
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (pathname !== renderedPath) {
    setRenderedPath(pathname);
    setMobileOpen(false);
    setOpenDropdown(null);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Prevent the page behind the mobile drawer from scrolling.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setOpenDropdown(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 160);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      {/* Utility bar */}
      <div className="hidden bg-navy-900 text-navy-100 lg:block">
        <div className="container-page flex h-10 items-center justify-between text-[0.8125rem]">
          <div className="flex items-center gap-2 text-navy-200">
            <Shield className="size-3.5 text-accent-400" aria-hidden="true" />
            <span>{tagline} &middot; Serving Northern Ontario since 2005</span>
          </div>
          <div className="flex items-center gap-5">
            <a
              href={telHref(phone)}
              className="flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <Phone className="size-3.5" aria-hidden="true" />
              {phone}
            </a>
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <Mail className="size-3.5" aria-hidden="true" />
              {email}
            </a>
            <Link
              href="/search"
              className="flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <Search className="size-3.5" aria-hidden="true" />
              Search
            </Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <header
        className={cn(
          "sticky top-0 z-50 border-b bg-white/95 backdrop-blur-md transition-shadow",
          scrolled ? "border-slate-200 shadow-sm" : "border-transparent",
        )}
      >
        <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-[4.5rem]">
          <Link
            href="/"
            className="flex shrink-0 items-center"
            aria-label={`${companyName} home`}
          >
            <Image
              src={logoUrl}
              alt={companyName}
              width={230}
              height={44}
              priority
              className="h-8 w-auto lg:h-9"
            />
          </Link>

          <nav
            className="hidden items-center gap-0.5 xl:flex"
            aria-label="Primary"
          >
            {nav.map((item) =>
              item.children.length > 0 ? (
                <div
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => {
                    cancelClose();
                    setOpenDropdown(item.id);
                  }}
                  onMouseLeave={scheduleClose}
                >
                  <button
                    type="button"
                    aria-expanded={openDropdown === item.id}
                    aria-haspopup="true"
                    onClick={() =>
                      setOpenDropdown(openDropdown === item.id ? null : item.id)
                    }
                    className={cn(
                      "flex items-center gap-1 rounded-md px-3 py-2 text-[0.9375rem] font-medium transition-colors",
                      isActive(item.href)
                        ? "text-brand-700"
                        : "text-navy-700 hover:bg-navy-50 hover:text-brand-700",
                    )}
                  >
                    {item.label}
                    <ChevronDown
                      className={cn(
                        "size-3.5 transition-transform",
                        openDropdown === item.id && "rotate-180",
                      )}
                      aria-hidden="true"
                    />
                  </button>

                  {openDropdown === item.id && (
                    <div className="absolute left-0 top-full z-50 w-72 pt-2">
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-lift">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.id}
                            node={child}
                            className="block px-4 py-2.5 text-sm text-navy-700 transition-colors hover:bg-navy-50 hover:text-brand-700"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  key={item.id}
                  node={item}
                  className={cn(
                    "rounded-md px-3 py-2 text-[0.9375rem] font-medium transition-colors",
                    isActive(item.href)
                      ? "text-brand-700"
                      : "text-navy-700 hover:bg-navy-50 hover:text-brand-700",
                  )}
                />
              ),
            )}
          </nav>

          <div className="flex items-center gap-2">
            <form action="/search" className="relative hidden lg:block">
              <label htmlFor="header-search" className="sr-only">
                Search the site
              </label>
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-navy-400"
                aria-hidden="true"
              />
              <input
                id="header-search"
                type="search"
                name="q"
                placeholder="Search"
                className="w-40 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm text-navy-800 placeholder:text-navy-400 focus:border-brand-400 focus:bg-white focus:outline-none xl:w-52"
              />
            </form>
            <Link
              href="/search"
              className="rounded-md p-2 text-navy-800 transition-colors hover:bg-navy-50 lg:hidden"
              aria-label="Search the site"
            >
              <Search className="size-5" aria-hidden="true" />
            </Link>
            <a
              href={telHref(phone)}
              className="hidden items-center gap-2 rounded-lg border-2 border-navy-200 px-3.5 py-2 text-sm font-semibold text-navy-800 transition-colors hover:border-brand-600 hover:text-brand-700 sm:flex xl:hidden 2xl:flex"
            >
              <Phone className="size-4" aria-hidden="true" />
              <span className="hidden 2xl:inline">{phone}</span>
              <span className="2xl:hidden">Call</span>
            </a>
            <Link
              href="/request-quote"
              className="hidden rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md sm:block"
            >
              Request a quote
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-2 text-navy-800 transition-colors hover:bg-navy-50 xl:hidden"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="size-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-100 xl:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
              <Image
                src={logoUrl}
                alt={companyName}
                width={190}
                height={36}
                className="h-7 w-auto"
              />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-2 text-navy-700 hover:bg-navy-50"
                aria-label="Close menu"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <nav
              className="flex-1 overflow-y-auto px-3 py-4"
              aria-label="Mobile"
            >
              {nav.map((item) => (
                <div key={item.id} className="mb-0.5">
                  {item.children.length > 0 ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenDropdown(
                            openDropdown === item.id ? null : item.id,
                          )
                        }
                        aria-expanded={openDropdown === item.id}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-[0.9375rem] font-semibold text-navy-800 hover:bg-navy-50"
                      >
                        {item.label}
                        <ChevronDown
                          className={cn(
                            "size-4 shrink-0 text-navy-400 transition-transform",
                            openDropdown === item.id && "rotate-180",
                          )}
                          aria-hidden="true"
                        />
                      </button>
                      {openDropdown === item.id && (
                        <div className="ml-3 border-l-2 border-slate-200 pl-2">
                          {item.children.map((child) => (
                            <NavLink
                              key={child.id}
                              node={child}
                              className="block rounded-lg px-3 py-2.5 text-sm text-navy-600 hover:bg-navy-50 hover:text-brand-700"
                            />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <NavLink
                      node={item}
                      className={cn(
                        "block rounded-lg px-3 py-3 text-[0.9375rem] font-semibold hover:bg-navy-50",
                        isActive(item.href) ? "text-brand-700" : "text-navy-800",
                      )}
                    />
                  )}
                </div>
              ))}
            </nav>

            <div className="shrink-0 space-y-2 border-t border-slate-200 p-4">
              <form action="/search" className="flex gap-2">
                <label htmlFor="mobile-search" className="sr-only">
                  Search the site
                </label>
                <input
                  id="mobile-search"
                  type="search"
                  name="q"
                  placeholder="Search"
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-navy-800 px-3 py-2.5 text-sm font-semibold text-white"
                >
                  Search
                </button>
              </form>
              <a
                href={telHref(phone)}
                className="flex items-center justify-center gap-2 rounded-lg bg-navy-800 px-4 py-3 text-sm font-semibold text-white"
              >
                <Phone className="size-4" aria-hidden="true" />
                {phone}
              </a>
              <Link
                href="/request-quote"
                className="flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white"
              >
                Request a quote
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NavLink({
  node,
  className,
}: {
  node: NavNode;
  className?: string;
}) {
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
