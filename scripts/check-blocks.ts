/**
 * Sanity check: every registered block type must construct successfully from
 * schema defaults and survive a parse round-trip, and every page of seed
 * content must validate. Runs without a database.
 */
import { buildBlocks, SEED_PAGES } from "../prisma/seed-content";
import { BLOCK_DEFINITIONS, createBlock } from "../src/lib/block-registry";
import { blocksSchema, parseBlocks } from "../src/lib/blocks";

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
