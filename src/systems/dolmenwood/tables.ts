// Dolmenwood's own tables. Everything here is true of every character; nothing
// here is true of one. Transcribed from the Dolmenwood Online Rules Reference
// (Necrotic Gnome), https://www.dolmenwood.necroticgnome.com/rules/, with the
// page id noted above each table.

import type { Ability, Gear, SaveKind, Skill } from "./types.ts";

type Band = { min: number; max: number; value: number };

/** id=ability_scores */
export const ABILITY_MODIFIERS: Band[] = [
  { min: 3, max: 3, value: -3 },
  { min: 4, max: 5, value: -2 },
  { min: 6, max: 8, value: -1 },
  { min: 9, max: 12, value: 0 },
  { min: 13, max: 15, value: 1 },
  { min: 16, max: 17, value: 2 },
  { min: 18, max: 18, value: 3 },
];

/**
 * id=ability_scores#prime_abilities. A fraction, not a percentage: -0.2 is the
 * -20% the book prints. For a class with more than one prime ability the
 * lowest score decides, so this is a lookup on one score rather than a blend.
 */
export const XP_MODIFIERS: Band[] = [
  { min: 3, max: 5, value: -0.2 },
  { min: 6, max: 8, value: -0.1 },
  { min: 9, max: 12, value: 0 },
  { min: 13, max: 15, value: 0.05 },
  { min: 16, max: 18, value: 0.1 },
];

/** Every skill defaults here unless a kindred or class lowers it. */
export const DEFAULT_SKILL_TARGET = 6;

export const SKILLS: Skill[] = [
  "alertness",
  "listen",
  "search",
  "stalking",
  "survival",
  "tracking",
];

export const SAVE_KINDS: SaveKind[] = ["doom", "ray", "hold", "blast", "spell"];

export type ClassLevel = {
  xp: number;
  attack: number;
  saves: Record<SaveKind, number>;
};

export type CharacterClass = {
  name: string;
  primeAbilities: Ability[];
  hitDie: number;
  /** From this level on, hit points are flat and Constitution stops applying. */
  flatHitPointsFrom: number;
  flatHitPointsPerLevel: number;
  missileAttackBonus: number;
  levels: ClassLevel[];
  skills: Array<Partial<Record<Skill, number>>>;
};

function saves(
  doom: number,
  ray: number,
  hold: number,
  blast: number,
  spell: number,
): Record<SaveKind, number> {
  return { doom, ray, hold, blast, spell };
}

/**
 * id=hunter. The class table runs to level 15; a kindred may cap the character
 * below that, and `maxLevel` in rules.ts takes the lower of the two.
 */
export const HUNTER: CharacterClass = {
  name: "Hunter",
  primeAbilities: ["con", "dex"],
  hitDie: 8,
  flatHitPointsFrom: 11,
  flatHitPointsPerLevel: 2,
  missileAttackBonus: 1,
  levels: [
    { xp: 0, attack: 1, saves: saves(12, 13, 14, 15, 16) },
    { xp: 2250, attack: 1, saves: saves(12, 13, 14, 15, 16) },
    { xp: 4500, attack: 2, saves: saves(11, 12, 13, 14, 15) },
    { xp: 9000, attack: 3, saves: saves(10, 11, 12, 13, 14) },
    { xp: 18000, attack: 3, saves: saves(10, 11, 12, 13, 14) },
    { xp: 36000, attack: 4, saves: saves(9, 10, 11, 12, 13) },
    { xp: 72000, attack: 5, saves: saves(8, 9, 10, 11, 12) },
    { xp: 144000, attack: 5, saves: saves(8, 9, 10, 11, 12) },
    { xp: 290000, attack: 6, saves: saves(7, 8, 9, 10, 11) },
    { xp: 420000, attack: 7, saves: saves(6, 7, 8, 9, 10) },
    { xp: 550000, attack: 7, saves: saves(6, 7, 8, 9, 10) },
    { xp: 680000, attack: 8, saves: saves(5, 6, 7, 8, 9) },
    { xp: 810000, attack: 9, saves: saves(4, 5, 6, 7, 8) },
    { xp: 940000, attack: 9, saves: saves(4, 5, 6, 7, 8) },
    { xp: 1070000, attack: 10, saves: saves(3, 4, 5, 6, 7) },
  ],
  skills: [
    { alertness: 6, stalking: 6, survival: 5, tracking: 5 },
    { alertness: 6, stalking: 6, survival: 4, tracking: 5 },
    { alertness: 6, stalking: 6, survival: 4, tracking: 4 },
    { alertness: 6, stalking: 5, survival: 4, tracking: 4 },
    { alertness: 5, stalking: 5, survival: 4, tracking: 4 },
    { alertness: 5, stalking: 5, survival: 3, tracking: 4 },
    { alertness: 5, stalking: 5, survival: 3, tracking: 3 },
    { alertness: 5, stalking: 4, survival: 3, tracking: 3 },
    { alertness: 4, stalking: 4, survival: 3, tracking: 3 },
    { alertness: 4, stalking: 3, survival: 3, tracking: 3 },
    { alertness: 4, stalking: 3, survival: 2, tracking: 3 },
    { alertness: 4, stalking: 3, survival: 2, tracking: 2 },
    { alertness: 3, stalking: 3, survival: 2, tracking: 2 },
    { alertness: 3, stalking: 2, survival: 2, tracking: 2 },
    { alertness: 2, stalking: 2, survival: 2, tracking: 2 },
  ],
};

export const CLASSES: Record<string, CharacterClass> = { hunter: HUNTER };

export type Kindred = {
  name: string;
  maxLevel: number;
  magicResistance: number;
  skills: Partial<Record<Skill, number>>;
  /** Melee only, and only against Large creatures. */
  acVersusLarge: number;
  coldIronExtraDamage: number;
};

/**
 * id=grimalkin. Max level is the one number here the rules reference does not
 * state on the kindred page; 14 is carried over from the sheet this project
 * started from. Worth checking against the book before a second character.
 */
export const GRIMALKIN: Kindred = {
  name: "Grimalkin",
  maxLevel: 14,
  magicResistance: 2,
  skills: { listen: 5 },
  acVersusLarge: 2,
  coldIronExtraDamage: 1,
};

export const KINDREDS: Record<string, Kindred> = { grimalkin: GRIMALKIN };

/** id=armour_and_weapons. Keyed by the words to look for in a kit line. */
export const UNARMOURED_AC = 10;

export const EQUIPMENT: Record<string, Gear> = {
  leather: { kind: "armour", ac: 12 },
  bark: { kind: "armour", ac: 13 },
  chainmail: { kind: "armour", ac: 14 },
  pinecone: { kind: "armour", ac: 15 },
  "plate mail": { kind: "armour", ac: 16 },
  "full plate": { kind: "armour", ac: 17 },

  shield: { kind: "shield", bonus: 1 },

  club: { kind: "weapon", damage: "1d4", hands: 1, small: false },
  dagger: { kind: "weapon", damage: "1d4", hands: 1, small: true },
  staff: { kind: "weapon", damage: "1d4", hands: 2, small: false },
  sling: { kind: "weapon", damage: "1d4", hands: 1, small: false },
  "hand axe": { kind: "weapon", damage: "1d6", hands: 1, small: true },
  mace: { kind: "weapon", damage: "1d6", hands: 1, small: false },
  shortbow: { kind: "weapon", damage: "1d6", hands: 2, small: false },
  shortsword: { kind: "weapon", damage: "1d6", hands: 1, small: false },
  spear: { kind: "weapon", damage: "1d6", hands: 1, small: false },
  "war hammer": { kind: "weapon", damage: "1d6", hands: 1, small: false },
  lance: { kind: "weapon", damage: "1d6", hands: 1, small: false },
  longbow: { kind: "weapon", damage: "1d6", hands: 2, small: false },
  "battle axe": { kind: "weapon", damage: "1d8", hands: 1, small: false },
  crossbow: { kind: "weapon", damage: "1d8", hands: 2, small: false },
  longsword: { kind: "weapon", damage: "1d8", hands: 1, small: false },
  polearm: { kind: "weapon", damage: "1d10", hands: 2, small: false },
  "two-handed sword": { kind: "weapon", damage: "1d10", hands: 2, small: false },
};
