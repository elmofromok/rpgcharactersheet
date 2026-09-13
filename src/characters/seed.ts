// Character files: the hand-written seed a character arrives as, and the
// fallback chain that turns one into a whole document.
//
// A field is looked for in the saved document, then in the character file,
// then in the system defaults. That is what lets a save written before a field
// existed pick the field up instead of breaking, and it is the whole reason
// the old start block is gone.

import { readFileSync } from "node:fs";
import { basename } from "node:path";

import type { CharacterDocument, Note } from "../character.ts";
import { maxHitPoints } from "../systems/dolmenwood/rules.ts";
import type { KitItem } from "../systems/dolmenwood/types.ts";

/**
 * A character as written by hand. Identity and the things nothing can work out
 * are required; everything else falls back.
 */
export type CharacterFile = Partial<CharacterDocument> &
  Pick<CharacterDocument, "id" | "name" | "system" | "kindred" | "class" | "abilities">;

const REQUIRED = ["id", "name", "system", "kindred", "class", "abilities"];

/** Hit points are absent on purpose: they default to the computed maximum. */
const DEFAULTS = {
  alignment: "Neutral",
  age: "",
  height: "",
  languages: [] as string[],
  level: 1,
  xp: 0,
  hitDice: [] as number[],
  gold: 0,
  arrows: 0,
  wilder: false,
  coins: 0,
  trophies: [] as string[],
  journal: "",
  notes: [] as Note[],
  kit: [] as KitItem[],
};

function overlay(
  base: Record<string, unknown>,
  over: object | null | undefined,
): Record<string, unknown> {
  if (!over) return base;
  const out = { ...base };
  for (const [key, value] of Object.entries(over)) {
    // An absent field falls through to the layer below. A field set to null
    // does not: that is someone deliberately clearing it.
    if (value !== undefined) out[key] = value;
  }
  return out;
}

/**
 * The whole document, from the saved version if there is one, the character
 * file where there is not, and the system defaults where neither says.
 */
export function hydrate(
  file: CharacterFile,
  stored?: Partial<CharacterDocument> | null,
): CharacterDocument {
  const merged = overlay(overlay({ ...DEFAULTS }, file), stored) as unknown as CharacterDocument;
  // Zero is a real hit point total, so this asks whether the field is there
  // rather than whether it is truthy.
  if (typeof merged.hp !== "number") merged.hp = maxHitPoints(merged);
  return merged;
}

export function parseCharacterFile(json: string, filename: string): CharacterFile {
  const file = JSON.parse(json) as CharacterFile;

  for (const key of REQUIRED) {
    if (file[key as keyof CharacterFile] === undefined) {
      throw new Error(`${filename}: missing "${key}"`);
    }
  }
  const expected = basename(filename, ".json");
  if (file.id !== expected) {
    throw new Error(`${filename}: id "${file.id}" does not match the filename`);
  }
  return file;
}

export function readCharacterFile(path: string): CharacterFile {
  return parseCharacterFile(readFileSync(path, "utf8"), path);
}
