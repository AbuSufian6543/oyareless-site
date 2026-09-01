import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Laptop, Monitor, Package } from "lucide-react";

import { PageHero } from "@/components/site/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { env } from "@/lib/env";
import {
  OFFICIAL_AGENT_DOWNLOADS,
  RUSTDESK_RELEASES_PAGE,
  remoteAgentHref,
} from "@/lib/remote-support-downloads";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Remote Support",
  description:
    "Download RustDesk or AnyDesk for Windows, macOS, or Debian, then read us the ID on your screen so we can help.",
  alternates: { canonical: `${env.siteUrl}/remote-support` },
};

export default async function RemoteSupportPage() {
  const settings = await getSettings();

  if (!settings.remoteSupportEnabled) {
    return (
      <>
        <PageHero
          eyebrow="Support"
          title="Remote Support"
          description="Remote support is not being offered through this site at the moment. Call 1-800-705-3189 and we will arrange another way to help."
        />
      </>
    );
  }

  const rustdeskAndroid = settings.rustdeskDownloadAndroid.trim();

  return (
    <>
      <PageHero
        eyebrow="Support"
        title="Remote Support"
        description="Download the agent we ask you to use, then read us the ID on the screen. A session only starts with your permission, and you can end it by closing the window."
      />
      <section className="bg-white py-12">
        <div className="container-page max-w-5xl space-y-8">
          <ol className="max-w-3xl space-y-4 text-sm leading-relaxed text-slate-700">
            <li>
              <strong className="text-navy-900">1. Download the agent</strong>{" "}
              for your computer — Windows, macOS, or Debian. Use the one we
              asked you to install on the call.
            </li>
            <li>
              <strong className="text-navy-900">2. Open it.</strong>{" "}
              {settings.remoteSupportInstructions}
            </li>
            <li>
              <strong className="text-navy-900">3. Call us</strong> at{" "}
              <a href={`tel:${settings.phone}`} className="font-semibold text-brand-700">
                {settings.phone}
              </a>{" "}
              and read the RustDesk ID or the AnyDesk address on the screen,
              plus the password if one is shown.
            </li>
          </ol>

          <div className="grid gap-5 lg:grid-cols-2">
            <AgentCard
              name="RustDesk"
              summary="Open the app, then read us the ID and the one-time password. You do not need an account."
              whatToRead="ID and one-time password"
              downloads={[
                {
                  label: "Windows",
                  file: ".exe",
                  href: remoteAgentHref(
                    settings.rustdeskDownloadWindows,
                    OFFICIAL_AGENT_DOWNLOADS.rustdesk.windows,
                  ),
                  Icon: Monitor,
                },
                {
                  label: "macOS",
                  file: ".dmg",
                  href: remoteAgentHref(
                    settings.rustdeskDownloadMacOS,
                    OFFICIAL_AGENT_DOWNLOADS.rustdesk.macos,
                  ),
                  Icon: Laptop,
                },
                {
                  label: "Debian",
                  file: ".deb",
                  href: remoteAgentHref(
                    settings.rustdeskDownloadLinux,
                    OFFICIAL_AGENT_DOWNLOADS.rustdesk.debian,
                  ),
                  Icon: Package,
                },
              ]}
              footer={
                <>
                  <p className="text-xs leading-relaxed text-slate-500">
                    macOS download is for Apple silicon. Using an Intel Mac?{" "}
                    <a
                      href={OFFICIAL_AGENT_DOWNLOADS.rustdesk.macosIntel}
                      className="font-medium text-brand-700 hover:underline"
                    >
                      Intel build
                    </a>. Other versions:{" "}
                    <a
                      href={RUSTDESK_RELEASES_PAGE}
                      className="font-medium text-brand-700 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      all RustDesk releases
                    </a>.
                  </p>
                  {rustdeskAndroid ? (
                    <p className="mt-2">
                      <ButtonLink
                        href={rustdeskAndroid}
                        variant="ghost"
                        size="sm"
                        className="px-0"
                      >
                        Android
                      </ButtonLink>
                    </p>
                  ) : null}
                </>
              }
            />

            <AgentCard
              name="AnyDesk"
              summary="Open the app, then read us the AnyDesk address on the home screen. You do not need an account."
              whatToRead="AnyDesk address"
              downloads={[
                {
                  label: "Windows",
                  file: ".exe",
                  href: remoteAgentHref(
                    settings.anydeskDownloadWindows,
                    OFFICIAL_AGENT_DOWNLOADS.anydesk.windows,
                  ),
                  Icon: Monitor,
                },
                {
                  label: "macOS",
                  file: ".dmg",
                  href: remoteAgentHref(
                    settings.anydeskDownloadMacOS,
                    OFFICIAL_AGENT_DOWNLOADS.anydesk.macos,
                  ),
                  Icon: Laptop,
                },
                {
                  label: "Debian",
                  file: ".deb",
                  href: remoteAgentHref(
                    settings.anydeskDownloadDebian,
                    OFFICIAL_AGENT_DOWNLOADS.anydesk.debian,
                  ),
                  Icon: Package,
                },
              ]}
            />
          </div>

          {(settings.rustdeskIdServer || settings.rustdeskPublicKey) && (
            <div className="surface-card max-w-3xl bg-slate-50 p-5 text-sm">
              <h2 className="font-bold text-navy-900">Self-hosted RustDesk relay</h2>
              <p className="mt-2 text-slate-600">
                If RustDesk asks for a server, use the values below. Only the
                public key is shown here.
              </p>
              <dl className="mt-3 space-y-1 font-mono text-xs text-navy-900">
                {settings.rustdeskIdServer && (
                  <div>ID server: {settings.rustdeskIdServer}</div>
                )}
                {settings.rustdeskRelayServer && (
                  <div>Relay: {settings.rustdeskRelayServer}</div>
                )}
                {settings.rustdeskApiServer && (
                  <div>API: {settings.rustdeskApiServer}</div>
                )}
                {settings.rustdeskPublicKey && (
                  <div className="break-all">Public key: {settings.rustdeskPublicKey}</div>
                )}
              </dl>
            </div>
          )}

          <p className="max-w-3xl text-xs leading-relaxed text-slate-500">
            RustDesk and AnyDesk are remote-access applications we use to help.
            Listing them here does not imply a partnership or endorsement.
          </p>
        </div>
      </section>
    </>
  );
}

function AgentCard({
  name,
  summary,
  whatToRead,
  downloads,
  footer,
}: {
  name: string;
  summary: string;
  whatToRead: string;
  downloads: {
    label: string;
    file: string;
    href: string;
    Icon: typeof Monitor;
    openInNewTab?: boolean;
  }[];
  footer?: ReactNode;
}) {
  return (
    <article className="surface-card flex h-full flex-col p-6 sm:p-7">
      <h2 className="text-xl font-bold tracking-tight text-navy-900">{name}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{summary}</p>
      <p className="mt-3 text-sm text-slate-700">
        <span className="font-semibold text-navy-900">Read us: </span>
        {whatToRead}
      </p>
      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {downloads.map((item) => (
          <ButtonLink
            key={item.label}
            href={item.href}
            variant="outline"
            size="sm"
            className="h-auto min-h-11 w-full flex-col gap-0.5 py-2.5 whitespace-normal"
            openInNewTab={item.openInNewTab}
          >
            <span className="inline-flex items-center gap-1.5">
              <item.Icon className="size-3.5 shrink-0" aria-hidden="true" />
              {item.label}
            </span>
            <span className="text-[11px] font-medium text-slate-500">{item.file}</span>
          </ButtonLink>
        ))}
      </div>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </article>
  );
}
