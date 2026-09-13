import { existsSync } from "node:fs";
import { join } from "node:path";

import type { CharacterDocument } from "../character.ts";
import type { Store } from "../storage/store.ts";
import { hydrate, readCharacterFile } from "./seed.ts";

export const CHARACTER_DIRECTORY = "characters";

/** Ids reach the filesystem, so they are checked rather than trusted. */
export function isCharacterId(id: string): boolean {
  return /^[a-z0-9][a-z0-9-]*$/i.test(id);
}

export function characterFilePath(id: string): string {
  return join(CHARACTER_DIRECTORY, `${id}.json`);
}

/**
 * The character as the page should see it: the saved document, topped up from
 * the character file and then the system defaults for anything it predates.
 * A character with no file left is already whole and is returned as it stands.
 */
export function loadCharacter(store: Store, id: string): CharacterDocument | null {
  if (!isCharacterId(id)) return null;

  const stored = store.read(id);
  const path = characterFilePath(id);
  if (!existsSync(path)) return stored;

  return hydrate(readCharacterFile(path), stored);
}
