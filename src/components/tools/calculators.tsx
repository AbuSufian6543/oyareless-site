"use client";

import { useMemo, useState } from "react";

import {
  CABLE_CATEGORIES,
  parseIPv4Cidr,
  recommendPoe,
  expandIPv6,
} from "@/lib/net-calculators";

export function SubnetCalculator() {
  const [input, setInput] = useState("192.168.1.10/24");
  const result = useMemo(() => parseIPv4Cidr(input), [input]);

  return (
    <div>
      <label htmlFor="cidr" className="mb-1.5 block text-sm font-semibold text-navy-800">
        IPv4 address / prefix
      </label>
      <input
        id="cidr"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm"
      />
      {result ? (
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          {Object.entries({
            Network: result.network,
            Mask: result.mask,
            Wildcard: result.wildcard,
            Broadcast: result.broadcast,
            "First host": result.firstHost,
            "Last host": result.lastHost,
            Hosts: String(result.hosts),
            Prefix: `/${result.prefix}`,
          }).map(([key, value]) => (
            <div key={key}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{key}</dt>
              <dd className="font-mono text-navy-900">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Enter an address such as 10.0.0.5/22.</p>
      )}
    </div>
  );
}

export function Ipv6Expander() {
  const [input, setInput] = useState("2001:db8::1");
  const expanded = expandIPv6(input);

  return (
    <div>
      <label htmlFor="ipv6" className="mb-1.5 block text-sm font-semibold text-navy-800">
        IPv6 address
      </label>
      <input
        id="ipv6"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm"
      />
      <p className="mt-3 font-mono text-sm text-navy-900">
        {expanded ?? "That does not look like an IPv6 address."}
      </p>
    </div>
  );
}

export function CableGuide() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2 pr-3">Type</th>
            <th className="py-2 pr-3">Typical length</th>
            <th className="py-2 pr-3">Throughput</th>
            <th className="py-2 pr-3">PoE</th>
            <th className="py-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {CABLE_CATEGORIES.map((row) => (
            <tr key={row.category} className="border-b border-slate-100 align-top">
              <td className="py-2.5 pr-3 font-semibold text-navy-900">{row.category}</td>
              <td className="py-2.5 pr-3">{row.maxLengthM} m</td>
              <td className="py-2.5 pr-3">{row.typicalGbps}</td>
              <td className="py-2.5 pr-3">{row.poe}</td>
              <td className="py-2.5 text-slate-600">{row.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PoeCalculator() {
  const [watts, setWatts] = useState("13");
  const parsed = Number.parseFloat(watts);
  const match = recommendPoe(parsed);

  return (
    <div>
      <label htmlFor="poe-watts" className="mb-1.5 block text-sm font-semibold text-navy-800">
        Device draw at the PD (watts)
      </label>
      <input
        id="poe-watts"
        value={watts}
        onChange={(event) => setWatts(event.target.value)}
        inputMode="decimal"
        className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
      />
      {match ? (
        <p className="mt-3 text-sm text-navy-800">
          Use <strong>{match.name}</strong> ({match.standard}): {match.wattsAtPd} W at the
          device, {match.wattsAtPse} W budgeted at the switch, {match.pairs}-pair.
        </p>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          Enter the camera or access-point wattage from its datasheet.
        </p>
      )}
    </div>
  );
}
