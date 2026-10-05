import type { CharacterDocument } from "../../../character.ts";
import type { Patch, SaveState } from "../../../sheet/useCharacter.ts";
import type { LevelEntry } from "../../../storage/store.ts";
import type { Computed } from "../rules.ts";
import type { Ability, SaveKind, Skill } from "../types.ts";

/**
 * A system page holds no character of its own, so every component takes the
 * character, what the rules make of it, and a way to change it.
 *
 * `editing` gates the parts that are read far more often than they are
 * changed. The play tracker and the kit ignore it: those are always live,
 * because a toggle in front of your hit points is a toggle you would leave on.
 *
 * `readOnly` is the lock a past level is drawn under. It freezes everything,
 * the tracker and the kit included, and `editing` is never on beside it.
 */
export type SheetProps = {
  character: CharacterDocument;
  computed: Computed;
  patch: Patch;
  editing: boolean;
  readOnly: boolean;
  status: SaveState;
};

/** The past levels on offer, which one is drawn, and how to move between them. */
export type LookingBack = {
  /** Every level the character has been saved at, lowest first. */
  levels: LevelEntry[];
  /** The past level drawn, or null when the sheet is now. */
  at: LevelEntry | null;
  /** The level of the live character, which the list calls now. */
  nowLevel: number;
  /** Draw a past level, or null for now. */
  go: (level: number | null) => void;
};

/** Reads a number out of an input without letting a half-typed value through. */
export function toNumber(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export const ABILITY_NAMES: Record<Ability, string> = {
  str: "Strength",
  int: "Intelligence",
  wis: "Wisdom",
  dex: "Dexterity",
  con: "Constitution",
  cha: "Charisma",
};

export const ABILITY_ORDER: Ability[] = ["str", "int", "wis", "dex", "con", "cha"];

export const SAVE_NAMES: Record<SaveKind, string> = {
  doom: "Doom",
  ray: "Ray",
  hold: "Hold",
  blast: "Blast",
  spell: "Spell",
};

export const SKILL_NAMES: Record<Skill, string> = {
  alertness: "Alertness",
  listen: "Listen",
  search: "Search",
  stalking: "Stalking",
  survival: "Survival",
  tracking: "Tracking",
};

const MINUS = "−";

/** A modifier as the book prints it, with a real minus sign. */
export function sign(value: number): string {
  if (value === 0) return "—";
  return value > 0 ? `+${value}` : `${MINUS}${Math.abs(value)}`;
}

export function percent(value: number): string {
  const rounded = Math.round(Math.abs(value) * 100);
  if (value === 0) return "none";
  return `${value > 0 ? "+" : MINUS}${rounded}%`;
}

export function count(value: number): string {
  return value.toLocaleString("en-GB");
}

/** A timestamp as the day it fell on, in the reader's own time zone. */
export function dayOf(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * A skill roll is d6 meet-or-beat, so a target of 5 succeeds on 5 and 6. A
 * natural 1 always fails and a natural 6 always succeeds, which is why no
 * target is ever worth more than 5 in 6.
 */
export function skillChance(target: number): number {
  const successes = Math.min(Math.max(7 - target, 1), 5);
  return Math.round((successes / 6) * 100);
}
