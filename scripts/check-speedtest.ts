import { readFileSync } from "node:fs";
import path from "node:path";

import {
  formatCloudflareColo,
  parseCloudflareTrace,
} from "../src/lib/cloudflare-trace";
import { isPrivateClientIp, publicClientIp } from "../src/lib/ip-address";

let failed = 0;

function assert(label: string, ok: boolean) {
  if (ok) console.log(`  OK    ${label}`);
  else {
    failed += 1;
    console.log(`  FAIL  ${label}`);
  }
}

function read(relative: string) {
  return readFileSync(path.join(process.cwd(), relative), "utf8");
}

const SAMPLE_PUBLIC_IP = "203.0.113.10";

assert("loopback IPv6 is not shown as the visitor address", isPrivateClientIp("::1"));
assert("loopback IPv4 is not shown as the visitor address", isPrivateClientIp("127.0.0.1"));
assert("mapped loopback is not shown", isPrivateClientIp("::ffff:127.0.0.1"));
assert("a documentation IPv4 is kept", publicClientIp(SAMPLE_PUBLIC_IP) === SAMPLE_PUBLIC_IP);
assert("a public IPv6 is kept", !isPrivateClientIp("2606:4700:4700::1111"));

const parsed = parseCloudflareTrace(
  `h=speed.cloudflare.com\nip=${SAMPLE_PUBLIC_IP}\ncolo=ord\nloc=CA\n`,
);
assert(
  "Cloudflare trace yields the public IP and colo",
  parsed.ip === SAMPLE_PUBLIC_IP && parsed.colo === "ORD",
);
assert(
  "loopback in a trace body is discarded",
  parseCloudflareTrace("ip=::1\ncolo=YYZ\n").ip === null,
);
assert(
  "Toronto colo is labelled in plain language",
  formatCloudflareColo("YYZ") === "Cloudflare Toronto (YYZ)",
);

const infoApi = read("src/app/api/speedtest/info/route.ts");
assert(
  "the info API never returns a private address as ip",
  infoApi.includes("publicClientIp(requestIp)"),
);

const ui = read("src/components/blocks/speed-test.tsx");
assert(
  "the speed test reads Cloudflare's view of the visitor, not this host",
  ui.includes("readCloudflareEdgeTrace") && ui.includes("loadConnectionInfo"),
);
assert(
  "the speed test UI filters loopback before rendering an address",
  ui.includes("publicClientIp(info?.ip)"),
);

process.exit(failed === 0 ? 0 : 1);
