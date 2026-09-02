import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Wrench } from "lucide-react";

import { PageHero } from "@/components/site/page-hero";
import { PasswordTools } from "@/components/tools/password-tools";
import { ToolCard, ToolForm } from "@/components/tools/tool-panel";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Cybersecurity Tools",
  description:
    "TLS certificate inspection, security-header checks, SPF/DKIM/DMARC lookups, and DNSBL reputation — hosted by WirelessCom.Ca Inc.",
  path: "/cybersecurity-tools",
});

export default function CybersecurityToolsPage() {
  return (
    <>
      <PageHero
        eyebrow={
          <>
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Self-hosted tools
          </>
        }
        title="Cybersecurity Tools"
        description="Certificate and header checks run from our server. Password tools never leave your browser. IP reputation is DNSBL-based and labeled as such — it is not a commercial threat feed."
      >
        <Link
          href="/network-tools"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-300 underline-offset-4 hover:underline"
        >
          <Wrench className="size-4" aria-hidden="true" />
          Network tools
        </Link>
      </PageHero>

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
