/**
 * Sanity check: every registered block type must construct successfully from
 * schema defaults and survive a parse round-trip, and every page of seed
 * content must validate. Runs without a database.
 */
import { buildBlocks, SEED_PAGES } from "../prisma/seed-content";
import { BLOCK_DEFINITIONS, createBlock } from "../src/lib/block-registry";
import { blocksSchema, parseBlocks } from "../src/lib/blocks";
import { DOWNTOWN_NORTH_PTZ_EMBED } from "../src/lib/downtown-north-ptz-embed";
import { DOWNTOWN_SOUTH_PTZ_EMBED } from "../src/lib/downtown-south-ptz-embed";
import {
  looksLikeMistEmbed,
  parseMistEmbed,
  rewriteInsecureMistPlayer,
  uniquifyEmbedIds,
} from "../src/lib/html-stream-embed";

let failures = 0;

const built = BLOCK_DEFINITIONS.map((definition) => {
  try {
    const block = createBlock(definition.type);
    return block;
  } catch (error) {
    failures += 1;
    console.error(`FAIL construct ${definition.type}:`, (error as Error).message);
    return null;
  }
}).filter((block) => block !== null);

const roundTripped = parseBlocks(JSON.parse(JSON.stringify(built)));

if (roundTripped.length !== built.length) {
  failures += 1;
  console.error(
    `FAIL round-trip: built ${built.length} blocks but only ${roundTripped.length} survived parsing.`,
  );
  const survived = new Set(roundTripped.map((block) => block.type));
  for (const block of built) {
    if (!survived.has(block.type)) console.error(`  dropped: ${block.type}`);
  }
}

const validated = blocksSchema.safeParse(built);
if (!validated.success) {
  failures += 1;
  console.error("FAIL schema validation:", validated.error.issues.slice(0, 5));
}

let seedBlockCount = 0;
for (const page of SEED_PAGES) {
  try {
    seedBlockCount += buildBlocks(page.blocks, page.slug).length;
  } catch (error) {
    failures += 1;
    console.error(`FAIL seed content:`, (error as Error).message);
  }
}

const slugs = SEED_PAGES.map((page) => page.slug);
const duplicates = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
if (duplicates.length > 0) {
  failures += 1;
  console.error(`FAIL duplicate seed slugs: ${duplicates.join(", ")}`);
}

if (failures === 0) {
  console.log(
    `OK  ${BLOCK_DEFINITIONS.length} block types construct, validate, and round-trip cleanly.`,
  );
  console.log(
    `OK  ${SEED_PAGES.length} seed pages with ${seedBlockCount} blocks validate cleanly.`,
  );
} else {
  process.exit(1);
}

const parsedMist = parseMistEmbed(DOWNTOWN_NORTH_PTZ_EMBED);
if (
  !parsedMist ||
  parsedMist.streamName !== "downtown-north-ptz" ||
  !parsedMist.loop ||
  parsedMist.muted ||
  !parsedMist.poster?.includes("416823.jpg") ||
  !looksLikeMistEmbed(DOWNTOWN_NORTH_PTZ_EMBED)
) {
  console.error("FAIL Mist embed parse");
  process.exit(1);
}

const unique = uniquifyEmbedIds(DOWNTOWN_NORTH_PTZ_EMBED, "abc");
if (
  !unique.includes("downtown-north-ptz_XOj7i42joT3I-abc") ||
  !unique.includes('mistPlay("downtown-north-ptz"')
) {
  console.error("FAIL Mist embed id uniquify must not rewrite mistPlay stream names");
  process.exit(1);
}

const parsedSouth = parseMistEmbed(DOWNTOWN_SOUTH_PTZ_EMBED);
if (
  !parsedSouth ||
  parsedSouth.streamName !== "downtown-south-ptz" ||
  !parsedSouth.loop ||
  !parsedSouth.muted ||
  !parsedSouth.poster?.includes("416823.jpg") ||
  !looksLikeMistEmbed(DOWNTOWN_SOUTH_PTZ_EMBED)
) {
  console.error("FAIL downtown-south Mist embed parse");
  process.exit(1);
}

const uniqueSouth = uniquifyEmbedIds(DOWNTOWN_SOUTH_PTZ_EMBED, "abc");
if (
  !uniqueSouth.includes("downtown-south-ptz_cOcXMwrFexSI-abc") ||
  !uniqueSouth.includes('mistPlay("downtown-south-ptz"')
) {
  console.error("FAIL downtown-south uniquify must not rewrite mistPlay stream names");
  process.exit(1);
}

if (
  rewriteInsecureMistPlayer("http://videostreamcanada.ca/player.js") !==
  "https://videostreamcanada.ca/player.js"
) {
  console.error("FAIL Mist player.js must be rewritten to HTTPS");
  process.exit(1);
}

console.log("OK  Mist / VideoStreamCanada embed parse and id handling.");

