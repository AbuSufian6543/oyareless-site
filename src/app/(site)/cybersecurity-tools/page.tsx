import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Wrench } from "lucide-react";

import { PasswordTools } from "@/components/tools/password-tools";
import { ToolCard, ToolForm } from "@/components/tools/tool-panel";
import { TechBackdrop } from "@/components/visuals/tech-backdrop";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Cybersecurity tools",
  description:
    "TLS certificate inspection, security-header checks, SPF/DKIM/DMARC lookups, and DNSBL reputation — all self-hosted.",
  alternates: { canonical: `${env.siteUrl}/cybersecurity-tools` },
};

export default function CybersecurityToolsPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden">
        <TechBackdrop density={0.6} />
        <div className="container-page py-14 lg:py-18">
          <p className="inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-accent-300">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Self-hosted tools
          </p>
          <h1 className="mt-5 max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Cybersecurity tools
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-navy-200">
            Certificate and header checks run from our server. Password tools
            never leave your browser. IP reputation is DNSBL-based and labeled
            as such — it is not a commercial threat feed.
          </p>
          <Link
            href="/network-tools"
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-accent-300 underline-offset-4 hover:underline"
          >
            <Wrench className="size-4" aria-hidden="true" />
            Network tools
          </Link>
        </div>
      </section>

      <section className="bg-slate-50 py-12 lg:py-16">
        <div className="container-page grid gap-5 lg:grid-cols-2">
          <ToolCard
            title="TLS certificate"
            description="Peer certificate from a TLS handshake. We do not impersonate the site."
          >
            <ToolForm
              tool="tls"
              label="Hostname"
              placeholder="wirelesscom.ca"
              extra="port"
            />
          </ToolCard>
          <ToolCard
            title="Security headers"
            description="Whether the common browser-hardening headers are present on the response."
          >
            <ToolForm tool="headers" label="URL" placeholder="https://wirelesscom.ca" />
          </ToolCard>
          <ToolCard
            title="SPF, DKIM and DMARC"
            description="DNS records that protect your domain from email spoofing. DNSSEC is not claimed."
          >
            <ToolForm tool="domain-security" label="Domain" placeholder="wirelesscom.ca" />
          </ToolCard>
          <ToolCard
            title="IP reputation (DNSBL)"
            description="Queries public DNS blacklists. A listing is a signal, not a verdict."
          >
            <ToolForm
              tool="dnsbl"
              label="IPv4 address"
              placeholder="1.2.3.4"
              hint="IPv4 only. Private addresses are refused."
            />
          </ToolCard>
          <ToolCard
            title="Password strength, generator and hash"
            description="Runs entirely in this browser. We never see what you type."
            className="lg:col-span-2"
          >
            <PasswordTools />
          </ToolCard>
        </div>
      </section>
    </>
  );
}
