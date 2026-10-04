// Dolmenwood's own tables. Everything here is true of every character; nothing
// here is true of one. Transcribed from the Dolmenwood Online Rules Reference
// (Necrotic Gnome), https://www.dolmenwood.necroticgnome.com/rules/, with the
// page id noted above each table.

import type {
  Bulk, Ability, Gear, SaveKind, Skill } from "./types.ts";

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
  /** The book's bracket: martial, arcane, holy. Decides what you may carry. */
  aptitude: string;
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
 * id=hunter. The class table runs to level 15, and that is the character's
 * maximum: Dolmenwood kindreds carry no level limit of their own.
 */
export const HUNTER: CharacterClass = {
  name: "Hunter",
  aptitude: "Martial",
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
  magicResistance: number;
  skills: Partial<Record<Skill, number>>;
  /** Melee only, and only against Large creatures. */
  acVersusLarge: number;
  coldIronExtraDamage: number;
};

/** id=grimalkin */
export const GRIMALKIN: Kindred = {
  name: "Grimalkin",
  magicResistance: 2,
  skills: { listen: 5 },
  acVersusLarge: 2,
  coldIronExtraDamage: 1,
};

export const KINDREDS: Record<string, Kindred> = { grimalkin: GRIMALKIN };

export type Glamour = {
  name: string;
  /** Coins that may be glamoured each day, per level. */
  coinsPerLevel: number;
  duration: string;
  /** True of the glamour, not of whoever rolled it. */
  description: string;
};

/**
 * id=grimalkin, the fairy magic table. Which glamour a character has is a roll
 * they made once and is recorded on them; what the glamour does belongs here.
 */
export const GLAMOURS: Record<string, Glamour> = {
  "fools-gold": {
    name: "Fool's Gold",
    coinsPerLevel: 20,
    duration: "1d6 minutes",
    description:
      "Touch copper coins and they look like gold to mortals. Range is whatever you touch. " +
      "Any mortal who looks at the coins may Save Versus Spell to see the trick for what it " +
      "is, and other fairies are not fooled at all.",
  },
};

/** id=armour_and_weapons. Keyed by the words to look for in a kit line. */
export const UNARMOURED_AC = 10;

export const EQUIPMENT: Record<string, Gear> = {
  leather: { kind: "armour", ac: 12, bulk: "light" },
  bark: { kind: "armour", ac: 13, bulk: "light" },
  chainmail: { kind: "armour", ac: 14, bulk: "medium" },
  pinecone: { kind: "armour", ac: 15, bulk: "medium" },
  "plate mail": { kind: "armour", ac: 16, bulk: "heavy" },
  "full plate": { kind: "armour", ac: 17, bulk: "heavy" },

  shield: { kind: "shield", bonus: 1 },

  club: { kind: "weapon", damage: "1d4", hands: 1, small: false },
  dagger: { kind: "weapon", damage: "1d4", hands: 1, small: true },
  staff: { kind: "weapon", damage: "1d4", hands: 2, small: false },
  sling: { kind: "weapon", damage: "1d4", hands: 1, small: false, missile: true },
  "hand axe": { kind: "weapon", damage: "1d6", hands: 1, small: true },
  mace: { kind: "weapon", damage: "1d6", hands: 1, small: false },
  shortbow: { kind: "weapon", damage: "1d6", hands: 2, small: false, missile: true },
  shortsword: { kind: "weapon", damage: "1d6", hands: 1, small: false },
  spear: { kind: "weapon", damage: "1d6", hands: 1, small: false },
  "war hammer": { kind: "weapon", damage: "1d6", hands: 1, small: false },
  lance: { kind: "weapon", damage: "1d6", hands: 1, small: false },
  longbow: { kind: "weapon", damage: "1d6", hands: 2, small: false, missile: true },
  "battle axe": { kind: "weapon", damage: "1d8", hands: 1, small: false },
  crossbow: { kind: "weapon", damage: "1d8", hands: 2, small: false, missile: true },
  longsword: { kind: "weapon", damage: "1d8", hands: 1, small: false },
  polearm: { kind: "weapon", damage: "1d10", hands: 2, small: false },
  "two-handed sword": { kind: "weapon", damage: "1d10", hands: 2, small: false },
};

/**
 * id=encumbrance, the slot system. A character has 10 slots for what is
 * equipped (worn, held, or ready at short notice) and 16 for what is stowed
 * in containers. Each column gives a Speed, and the slower one applies.
 */
export const EQUIPPED_SLOTS = 10;
export const STOWED_SLOTS = 16;

export const SPEED_BY_EQUIPPED_SLOTS: Band[] = [
  { min: 0, max: 3, value: 40 },
  { min: 4, max: 5, value: 30 },
  { min: 6, max: 7, value: 20 },
  { min: 8, max: 10, value: 10 },
];

export const SPEED_BY_STOWED_SLOTS: Band[] = [
  { min: 0, max: 10, value: 40 },
  { min: 11, max: 12, value: 30 },
  { min: 13, max: 14, value: 20 },
  { min: 15, max: 16, value: 10 },
];

/** Every object is 1 slot unless the book says otherwise. These are the otherwise. */
export const ARMOUR_SLOTS: Record<Bulk, number> = { light: 1, medium: 2, heavy: 3 };
export const TWO_HANDED_MELEE_SLOTS = 2;
/** Up to this many make one slot. */
export const SLOT_BUNDLES = { coins: 100, ammunition: 20 };
/** Occupy a slot only in large numbers, which the referee judges. Matched on whole words. */
export const TINY_ITEMS = ["whistle", "quill", "paper", "parchment", "bell", "holy symbol", "herbs", "pipeleaf"];
/** Count as an item only when not in use, and a container on a character is in use. */
export const CONTAINERS = ["backpack", "sack", "pouch"];
