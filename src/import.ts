#!/usr/bin/env node
// Import a hand-written character file into the database, once.
//
//   node src/import.ts                       every character file
//   node src/import.ts moggle-fluff-a-kin    one
//   node src/import.ts moggle-fluff-a-kin --force
//
// After the import the file goes stale and stops mattering, which is why a
// second import of a character that is already in the database is refused:
// the file would be older than the play it overwrote.

import { readdirSync } from "node:fs";
import { join } from "node:path";

import { hydrate, readCharacterFile } from "./characters/seed.ts";
import { openStore } from "./storage/store.ts";

const DATABASE = "characters.db";
const DIRECTORY = "characters";

const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.find((a) => !a.startsWith("--"));

const files = readdirSync(DIRECTORY)
  .filter((f) => f.endsWith(".json"))
  .filter((f) => !only || f === `${only}.json`);

if (files.length === 0) {
  throw new Error(only ? `No character file named "${only}"` : "No character files found");
}

const store = openStore(DATABASE);
try {
  for (const filename of files) {
    const file = readCharacterFile(join(DIRECTORY, filename));
    const existing = store.read(file.id);

    if (existing && !force) {
      const log = store.history(file.id);
      console.error(
        `${file.id} is already in ${DATABASE}, at revision ${log[0]?.revision} ` +
          `written ${log[0]?.writtenAt}.\n` +
          `Importing again would replace it with the character file, which is ` +
          `older than anything played since.\nPass --force if that is what you want.`,
      );
      process.exitCode = 1;
      continue;
    }

    // The file wins outright. Topping a played character up from its file is
    // a different operation, and it belongs to the server rather than here.
    const revision = store.save(hydrate(file));
    console.log(
      `${file.id}  ->  ${DATABASE} revision ${revision.revision}` +
        (existing ? "  (forced over an existing character)" : ""),
    );
  }
} finally {
  store.close();
}
