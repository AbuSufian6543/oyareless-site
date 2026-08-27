import type { Metadata } from "next";
import { MonitorSmartphone } from "lucide-react";

import { PageHero } from "@/components/site/page-hero";
import { env } from "@/lib/env";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Remote support",
  description:
    "Download the RustDesk client we use for remote support, then read us the ID and one-time password on your screen.",
  alternates: { canonical: `${env.siteUrl}/remote-support` },
};

const PLATFORMS = [
  { key: "windows" as const, label: "Windows", setting: "rustdeskDownloadWindows" as const },
  { key: "macos" as const, label: "macOS", setting: "rustdeskDownloadMacOS" as const },
  { key: "linux" as const, label: "Linux", setting: "rustdeskDownloadLinux" as const },
  { key: "android" as const, label: "Android", setting: "rustdeskDownloadAndroid" as const },
];

export default async function RemoteSupportPage() {
  const settings = await getSettings();

  if (!settings.remoteSupportEnabled) {
    return (
      <>
        <PageHero
          eyebrow="Support"
          title="Remote support"
          description="Remote support is not being offered through this site at the moment. Call 1-800-705-3189 and we will arrange another way to help."
        />
      </>
    );
  }

  const downloads = PLATFORMS.map((platform) => ({
    ...platform,
    href: settings[platform.setting],
  })).filter((platform) => platform.href);

  return (
    <>
      <PageHero
        eyebrow="Support"
        title="Remote support"
        description="A session only starts when you read us the ID and one-time password shown in the client. You can end it at any time by closing the window."
      />
      <section className="bg-white py-12">
        <div className="container-page max-w-3xl space-y-8">
          <ol className="space-y-4 text-sm leading-relaxed text-slate-700">
            <li>
              <strong className="text-navy-900">1. Download the client</strong> for your
              operating system. Prefer the copy we host: you stay on a domain you
              already trust.
            </li>
            <li>
              <strong className="text-navy-900">2. Run it.</strong>{" "}
              {settings.remoteSupportInstructions}
            </li>
            <li>
              <strong className="text-navy-900">3. Call us</strong> at{" "}
              <a href={`tel:${settings.phone}`} className="font-semibold text-brand-700">
                {settings.phone}
              </a>{" "}
              and read the nine-digit ID and the one-time password.
            </li>
          </ol>

          {downloads.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {downloads.map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  <MonitorSmartphone className="size-4" aria-hidden="true" />
                  Download for {item.label}
                </a>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Download links have not been configured yet. We will send you the
              client when you call.
            </p>
          )}

          {(settings.rustdeskIdServer || settings.rustdeskPublicKey) && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm">
              <h2 className="font-bold text-navy-900">Self-hosted relay</h2>
              <p className="mt-2 text-slate-600">
                If the client asks for a server, use the values below. Only the
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
        </div>
      </section>
    </>
  );
}
