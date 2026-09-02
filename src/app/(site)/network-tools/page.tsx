import type { Metadata } from "next";
import Link from "next/link";
import { Gauge, ShieldCheck, Wrench } from "lucide-react";

import {
  CableGuide,
  Ipv6Expander,
  PoeCalculator,
  SubnetCalculator,
} from "@/components/tools/calculators";
import { ToolCard, ToolForm } from "@/components/tools/tool-panel";
import { PageHero } from "@/components/site/page-hero";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Network Tools",
  description:
    "DNS lookups, TCP latency, port checks, WHOIS, subnet and cable calculators — run on WirelessCom.Ca Inc. servers with no third-party APIs.",
  path: "/network-tools",
});

export default function NetworkToolsPage() {
  return (
    <>
      <PageHero
        eyebrow={
          <>
            <Wrench className="size-3.5" aria-hidden="true" />
            Self-hosted tools
          </>
        }
        title="Network Tools"
        description="Lookups run from our own server in Sault Ste. Marie. Private, loopback and cloud-metadata targets are refused. Latency figures are TCP connect times, not ICMP ping."
      >
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link
            href="/speed-test"
            className="inline-flex items-center gap-1.5 font-semibold text-accent-300 underline-offset-4 hover:underline"
          >
            <Gauge className="size-4" aria-hidden="true" />
            Speed test
          </Link>
          <Link
            href="/cybersecurity-tools"
            className="inline-flex items-center gap-1.5 font-semibold text-accent-300 underline-offset-4 hover:underline"
          >
            <ShieldCheck className="size-4" aria-hidden="true" />
            Security tools
          </Link>
        </div>
      </PageHero>

      <section className="bg-slate-50 py-12 lg:py-16">
        <div className="container-page grid gap-5 lg:grid-cols-2">
          <ToolCard
            title="Public IP"
            description="The address this website sees for your connection."
          >
            <ToolForm tool="ip" label="Public IP" placeholder="" hint="No target needed." />
          </ToolCard>
          <ToolCard
            title="DNS lookup"
            description="A, AAAA, MX, TXT, NS, CNAME and PTR records via the server resolver."
          >
            <ToolForm tool="dns" label="Hostname" placeholder="wirelesscom.ca" />
          </ToolCard>
          <ToolCard
            title="TCP connect latency"
            description="Time to complete a TCP handshake. This is not ICMP ping."
          >
            <ToolForm
              tool="tcp"
              label="Host"
              placeholder="wirelesscom.ca"
              extra="port"
              hint="Default port 443."
            />
          </ToolCard>
          <ToolCard
            title="Port check"
            description="Whether a TCP port accepts a connection from our server."
          >
            <ToolForm tool="port" label="Host" placeholder="wirelesscom.ca" extra="port" />
          </ToolCard>
          <ToolCard
            title="WHOIS"
            description="TCP port 43 against IANA, then one referral. Not a privacy-stripping proxy."
          >
            <ToolForm tool="whois" label="Domain or IP" placeholder="wirelesscom.ca" />
          </ToolCard>
          <ToolCard
            title="MAC OUI"
            description="Vendor prefix from a bundled IEEE OUI subset. Unknown prefixes stay blank."
          >
            <ToolForm
              tool="oui"
              label="MAC address"
              placeholder="F4:F5:7A:12:34:56"
              hint="First three octets are enough."
            />
          </ToolCard>
          <ToolCard title="IPv4 subnet / CIDR" description="Calculated in your browser.">
            <SubnetCalculator />
          </ToolCard>
          <ToolCard title="IPv6 expander" description="Expands compressed IPv6 addresses locally.">
            <Ipv6Expander />
          </ToolCard>
          <ToolCard title="PoE class helper" description="Pick a PoE type from the device wattage.">
            <PoeCalculator />
          </ToolCard>
          <ToolCard
            title="Cable & fiber guide"
            description="Typical lengths and rates we spec. Not a substitute for a site survey."
            className="lg:col-span-2"
          >
            <CableGuide />
          </ToolCard>
        </div>
      </section>
    </>
  );
}
