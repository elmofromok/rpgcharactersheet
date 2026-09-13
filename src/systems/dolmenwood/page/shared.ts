import type { CharacterDocument } from "../../../character.ts";
import type { Computed } from "../rules.ts";
import type { Ability, SaveKind, Skill } from "../types.ts";

/**
 * A system page holds no character of its own, so every component takes the
 * character and what the rules make of it, and nothing else.
 */
export type SheetProps = {
  character: CharacterDocument;
  computed: Computed;
};

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

/**
 * A skill roll is d6 meet-or-beat, so a target of 5 succeeds on 5 and 6. A
 * natural 1 always fails and a natural 6 always succeeds, which is why no
 * target is ever worth more than 5 in 6.
 */
export function skillChance(target: number): number {
  const successes = Math.min(Math.max(7 - target, 1), 5);
  return Math.round((successes / 6) * 100);
}
