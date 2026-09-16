/**
 * The historic Weebly stream-poster URL must keep working. Other sites fetch
 * that exact JPG; the bytes live in public/brand because the Docker uploads
 * volume would hide anything committed under public/uploads.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

import { DOWNTOWN_NORTH_PTZ_EMBED } from "../src/lib/downtown-north-ptz-embed";
import { DOWNTOWN_SOUTH_PTZ_EMBED } from "../src/lib/downtown-south-ptz-embed";
import {
  LEGACY_WEEBLY_LOGO_FILE,
  LEGACY_WEEBLY_LOGO_PATH,
  LEGACY_WEEBLY_LOGO_PUBLIC_URL,
} from "../src/lib/legacy-weebly-logo";

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

assert(
  "partners keep the historic www Weebly URL",
  LEGACY_WEEBLY_LOGO_PUBLIC_URL ===
    "https://www.wirelesscom.org/uploads/4/6/3/6/46366157/416823.jpg" &&
    LEGACY_WEEBLY_LOGO_PATH === "/uploads/4/6/3/6/46366157/416823.jpg" &&
    LEGACY_WEEBLY_LOGO_FILE === "/brand/legacy-stream-logo.jpg",
);

const jpegPath = path.join(
  process.cwd(),
  "public",
  LEGACY_WEEBLY_LOGO_FILE.replace(/^\//, ""),
);
assert("the stream poster JPEG is committed under public/brand", existsSync(jpegPath));

if (existsSync(jpegPath)) {
  const bytes = readFileSync(jpegPath);
  assert(
    "the stream poster is a JPEG",
    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  );
  assert("the stream poster is a usable size", bytes.byteLength > 20_000);
}

const nextConfig = read("next.config.ts");
assert(
  "Next rewrites the Weebly path onto the brand JPEG before public files",
  nextConfig.includes("beforeFiles:") &&
    nextConfig.includes(LEGACY_WEEBLY_LOGO_PATH) &&
    nextConfig.includes('destination: "/brand/legacy-stream-logo.jpg"'),
);
assert(
  "the Weebly path is allowed to be fetched from other sites",
  nextConfig.includes(`source: "${LEGACY_WEEBLY_LOGO_PATH}"`) &&
    nextConfig.includes('key: "Access-Control-Allow-Origin"') &&
    nextConfig.includes('value: "*"'),
);

const nginx = read("docker/nginx/wirelesscom.conf.template");
assert(
  "nginx adds CORS on the exact historic poster URL",
  nginx.includes(`location = ${LEGACY_WEEBLY_LOGO_PATH}`) &&
    nginx.includes('Access-Control-Allow-Origin "*"'),
);

const dockerfile = read("Dockerfile");
assert(
  "the app image copies the poster into the uploads volume at start",
  dockerfile.includes("app-entrypoint.sh") &&
    dockerfile.includes('ENTRYPOINT ["/usr/local/bin/app-entrypoint.sh"]'),
);

const entrypoint = read("docker/app-entrypoint.sh");
assert(
  "the entrypoint installs 416823.jpg and still starts the app if copy fails",
  entrypoint.includes("legacy-stream-logo.jpg") &&
    entrypoint.includes("416823.jpg") &&
    entrypoint.includes("exec \"$@\"") &&
    !entrypoint.includes("set -e"),
);

const gitignore = read(".gitignore");
assert(
  "the poster is not stored only under the gitignored uploads volume",
  gitignore.includes("/public/uploads/*") &&
    !jpegPath.replace(/\\/g, "/").includes("/public/uploads/"),
);

assert(
  "downtown PTZ posters still use the historic URL",
  DOWNTOWN_NORTH_PTZ_EMBED.includes(LEGACY_WEEBLY_LOGO_PUBLIC_URL) &&
    DOWNTOWN_SOUTH_PTZ_EMBED.includes(LEGACY_WEEBLY_LOGO_PUBLIC_URL),
);

const seed = read("prisma/seed.ts");
assert(
  "seed poster URLs use the shared historic constant",
  seed.includes("LEGACY_WEEBLY_LOGO_PUBLIC_URL") &&
    !seed.includes('"https://www.wirelesscom.org/uploads/4/6/3/6/46366157/416823.jpg"'),
);

const api = read("src/app/api/legacy/weebly-logo/route.ts");
assert(
  "the alias route serves JPEG bytes with a public cache",
  api.includes("image/jpeg") &&
    api.includes("416823.jpg") &&
    api.includes("Access-Control-Allow-Origin"),
);

process.exit(failed === 0 ? 0 : 1);
