import { NextResponse, type NextRequest } from "next/server";

/**
 * The legacy site used `.html` URLs. Redirecting them permanently keeps
 * existing search rankings and inbound links working.
 *
 * Runs at the edge with no database access so redirects stay fast; additional
 * admin-managed redirects are resolved from the Redirect table in the page
 * handler.
 */
const EXPLICIT_REDIRECTS: Record<string, string> = {
  "/index.html": "/",
  "/home.html": "/",
  "/ai.html": "/ai-services",
  "/firewall.html": "/firewalls",
  "/firewalls.html": "/firewalls",
  "/blog.html": "/news",
  "/news.html": "/news",
  "/live-video-broadcasting.html": "/live",
  "/live.html": "/live",
  "/stream.html": "/live",
  "/streamtest.html": "/live",
  "/tv.html": "/live",
  "/video-conference.html": "/live",
  "/join-our-team.html": "/careers",
  "/careers.html": "/careers",
  "/e-911-information.html": "/e-911",
  "/e911.html": "/e-911",
  "/data-cabling--fiber-optic-services.html": "/data-cabling-fiber-optic",
  "/data-cabling-fiber-optic-services.html": "/data-cabling-fiber-optic",
  "/2-way-radios.html": "/two-way-radios",
  "/privacy.html": "/privacy-policy",
  "/contact-us.html": "/contact",
  "/about-us.html": "/",
};

/** Legacy per-camera pages now live under /live/<slug>. */
const LEGACY_CAMERA_SLUGS = new Set([
  "ptz1",
  "ptz2",
  "615bay",
  "49stmarys",
  "39chapple",
  "trinity",
  "zentra",
  "avery",
]);

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const explicit = EXPLICIT_REDIRECTS[pathname.toLowerCase()];
  if (explicit) {
    return NextResponse.redirect(new URL(`${explicit}${search}`, request.url), 301);
  }

  if (pathname.toLowerCase().endsWith(".html")) {
    const slug = pathname.slice(1, -".html".length).toLowerCase();

    if (LEGACY_CAMERA_SLUGS.has(slug)) {
      return NextResponse.redirect(
        new URL(`/live/${slug}${search}`, request.url),
        301,
      );
    }

    return NextResponse.redirect(new URL(`/${slug}${search}`, request.url), 301);
  }

  return NextResponse.next();
}

export const config = {
  // Only inspect paths that could be legacy URLs; skip assets and API routes.
  matcher: [
    "/((?!api|_next/static|_next/image|brand|uploads|favicon|apple-icon|apple-touch-icon|icon\\.png|icon-192|robots.txt|sitemap.xml|manifest).*)",
  ],
};
