// Character in, computed values out. Nothing here reads the DOM or the
// database, and nothing here is true of one character only.

import {
  ABILITY_MODIFIERS,
  CLASSES,
  DEFAULT_SKILL_TARGET,
  EQUIPMENT,
  GLAMOURS,
  KINDREDS,
  SKILLS,
  UNARMOURED_AC,
  XP_MODIFIERS,
  type CharacterClass,
  type Glamour,
  type Kindred,
} from "./tables.ts";
import type {
  Ability,
  Gear,
  KitItem,
  RulesInput,
  Saves,
  Skill,
} from "./types.ts";

function band(bands: Array<{ min: number; max: number; value: number }>, score: number): number {
  for (const b of bands) {
    if (score >= b.min && score <= b.max) return b.value;
  }
  // Off the ends of the table, which the book does not cover. Clamp.
  const first = bands[0];
  const last = bands[bands.length - 1];
  if (!first || !last) throw new Error("Empty band table");
  return score < first.min ? first.value : last.value;
}

export function abilityModifier(score: number): number {
  return band(ABILITY_MODIFIERS, score);
}

export function characterClass(input: RulesInput): CharacterClass {
  const c = CLASSES[input.class.toLowerCase()];
  if (!c) throw new Error(`Unknown class: ${input.class}`);
  return c;
}

export function kindred(input: RulesInput): Kindred {
  const k = KINDREDS[input.kindred.toLowerCase()];
  if (!k) throw new Error(`Unknown kindred: ${input.kindred}`);
  return k;
}

export function maxLevel(input: RulesInput): number {
  return Math.min(characterClass(input).levels.length, kindred(input).maxLevel);
}

/** A level outside the character's range is read as the nearest one that exists. */
export function effectiveLevel(input: RulesInput): number {
  return Math.min(Math.max(input.level, 1), maxLevel(input));
}

function levelRow(input: RulesInput) {
  const c = characterClass(input);
  const level = effectiveLevel(input);
  const row = c.levels[level - 1];
  if (!row) throw new Error(`${c.name} has no level ${level}`);
  return row;
}

/**
 * A fraction: -0.2 means every award is banked at 80%. The lowest prime
 * ability decides it, so a class with two primes is only as good as its worse
 * one.
 */
export function xpModifier(input: RulesInput): number {
  const primes = characterClass(input).primeAbilities;
  const lowest = Math.min(...primes.map((a: Ability) => input.abilities[a]));
  return band(XP_MODIFIERS, lowest);
}

/** What an award of `awarded` actually banks. */
export function bankXp(input: RulesInput, awarded: number): number {
  return Math.round(awarded * (1 + xpModifier(input)));
}

/** Banked XP needed to reach `level`, before the modifier. Null above the cap. */
export function xpThreshold(input: RulesInput, level: number): number | null {
  if (level < 1 || level > maxLevel(input)) return null;
  return characterClass(input).levels[level - 1]?.xp ?? null;
}

/**
 * How much a referee must award before the next level lands, which is not the
 * same as the gap in the table once a modifier applies.
 */
export function xpToNextLevel(input: RulesInput): number | null {
  const next = xpThreshold(input, input.level + 1);
  if (next === null) return null;
  return Math.max(0, Math.ceil((next - input.xp) / (1 + xpModifier(input))));
}

export function savingThrows(input: RulesInput): Saves {
  return { ...levelRow(input).saves };
}

export function magicResistance(input: RulesInput): number {
  return abilityModifier(input.abilities.wis) + kindred(input).magicResistance;
}

export type AttackBonus = { melee: number; missile: number };

export function attackBonus(input: RulesInput): AttackBonus {
  const c = characterClass(input);
  const base = levelRow(input).attack;
  return {
    melee: base + abilityModifier(input.abilities.str),
    missile: base + c.missileAttackBonus + abilityModifier(input.abilities.dex),
  };
}

/** The glamour this character rolled, or null if they have none. */
export function glamour(input: RulesInput): Glamour | null {
  return input.glamour ? (GLAMOURS[input.glamour] ?? null) : null;
}

/** How many coins may be glamoured today. Zero without a glamour. */
export function glamourCoinCap(input: RulesInput): number {
  const g = glamour(input);
  return g ? g.coinsPerLevel * effectiveLevel(input) : 0;
}

export type SkillTarget = { target: number; source: "class" | "kindred" | "default" };

/**
 * The lowest target wins. A class that lists a skill keeps the credit even
 * when its target equals the default, because that is what the class table
 * says rather than a coincidence.
 */
export function skillTargets(input: RulesInput): Record<Skill, SkillTarget> {
  const c = characterClass(input);
  const k = kindred(input);
  const classSkills = c.skills[effectiveLevel(input) - 1] ?? {};

  const out = {} as Record<Skill, SkillTarget>;
  for (const skill of SKILLS) {
    let best: SkillTarget = { target: DEFAULT_SKILL_TARGET, source: "default" };
    const fromKindred = k.skills[skill];
    if (fromKindred !== undefined && fromKindred <= best.target) {
      best = { target: fromKindred, source: "kindred" };
    }
    const fromClass = classSkills[skill];
    if (fromClass !== undefined && fromClass <= best.target) {
      best = { target: fromClass, source: "class" };
    }
    out[skill] = best;
  }
  return out;
}

/**
 * Constitution applies per level up to the level the class goes flat, and a
 * level never yields less than 1 hit point however bad the roll and the
 * modifier are together.
 */
export function maxHitPoints(input: RulesInput): number {
  const c = characterClass(input);
  const con = abilityModifier(input.abilities.con);
  const level = effectiveLevel(input);

  let total = 0;
  for (let l = 1; l <= level; l++) {
    if (l >= c.flatHitPointsFrom) {
      total += c.flatHitPointsPerLevel;
      continue;
    }
    const rolled = input.hitDice[l - 1];
    // A blank or a zero is a level whose die has not been rolled yet, not a
    // level worth nothing. It contributes nothing and is reported as owed.
    if (rolled === undefined || rolled <= 0) continue;
    total += Math.max(1, rolled + con);
  }
  return total;
}

/** How many hit dice the character still owes, if levelling outran the rolls. */
export function hitDiceOwed(input: RulesInput): number {
  const c = characterClass(input);
  const rollable = Math.min(effectiveLevel(input), c.flatHitPointsFrom - 1);
  const recorded = input.hitDice.filter((die) => die > 0).length;
  return Math.max(0, rollable - recorded);
}

function normalise(text: string): string {
  return ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
}

/**
 * What a kit line is worth in a fight. An item's own `gear` wins; otherwise the
 * equipment table is matched on whole words, longest key first, so a
 * sledgehammer never reads as a war hammer. No match means unrated, and the
 * caller is expected to say so rather than treat it as zero.
 */
export function rate(item: KitItem): Gear | null {
  if (item.gear) return item.gear.kind === "none" ? null : item.gear;
  const hay = normalise(item.n);
  let best: Gear | null = null;
  let bestLength = 0;
  for (const [key, gear] of Object.entries(EQUIPMENT)) {
    const needle = normalise(key).trim();
    if (needle.length <= bestLength) continue;
    if (hay.includes(` ${needle} `)) {
      best = gear;
      bestLength = needle.length;
    }
  }
  return best;
}

export function unratedItems(input: RulesInput): KitItem[] {
  return input.kit.filter((item) => rate(item) === null);
}

/** The best armour in the kit. Armour is worn; it is not part of a loadout. */
export function wornArmour(input: RulesInput): { item: KitItem; ac: number } | null {
  let best: { item: KitItem; ac: number } | null = null;
  for (const item of input.kit) {
    const gear = rate(item);
    if (gear?.kind !== "armour") continue;
    if (!best || gear.ac > best.ac) best = { item, ac: gear.ac };
  }
  return best;
}

export type Loadout = {
  /** Item names, in the order they are held. */
  held: string[];
  hands: number;
  armourClass: number;
  armourClassVersusLarge: number;
  damage: string | null;
};

/**
 * Every combination of hands the kit actually allows, each with the armour
 * class it gives. A two-handed weapon leaves no hand for a shield, so bow and
 * shield is never generated rather than generated and filtered.
 *
 * A loadout needs a weapon, because the question it answers is what you are
 * holding in a fight. The one exception is a character with no weapon at all,
 * who gets a single empty-handed entry so the armour class still has a home.
 */
export function loadouts(input: RulesInput): Loadout[] {
  const armour = wornArmour(input);
  const baseAc = (armour ? armour.ac : UNARMOURED_AC) + abilityModifier(input.abilities.dex);
  const large = kindred(input).acVersusLarge;

  const weapons: Array<{ item: KitItem; gear: Extract<Gear, { kind: "weapon" }> }> = [];
  let shield: { item: KitItem; bonus: number } | null = null;
  for (const item of input.kit) {
    const gear = rate(item);
    if (gear?.kind === "weapon") weapons.push({ item, gear });
    if (gear?.kind === "shield" && !shield) shield = { item, bonus: gear.bonus };
  }

  const build = (
    held: KitItem[],
    hands: number,
    withShield: boolean,
    damage: string | null,
  ): Loadout => {
    const ac = baseAc + (withShield && shield ? shield.bonus : 0);
    return {
      held: held.map((i) => i.n),
      hands,
      armourClass: ac,
      armourClassVersusLarge: ac + large,
      damage,
    };
  };

  const out: Loadout[] = [];
  for (const w of weapons) {
    out.push(build([w.item], w.gear.hands, false, w.gear.damage));
    if (shield && w.gear.hands === 1) {
      out.push(build([w.item, shield.item], 2, true, w.gear.damage));
    }
  }
  if (out.length === 0) {
    if (shield) out.push(build([shield.item], 1, true, null));
    else out.push(build([], 0, false, null));
  }
  return out;
}

export type Computed = {
  maxLevel: number;
  abilityModifiers: Record<Ability, number>;
  xpModifier: number;
  xpThreshold: number | null;
  xpToNextLevel: number | null;
  saves: Saves;
  skills: Record<Skill, SkillTarget>;
  attack: AttackBonus;
  magicResistance: number;
  maxHitPoints: number;
  hitDiceOwed: number;
  glamour: Glamour | null;
  glamourCoinCap: number;
  loadouts: Loadout[];
  unrated: KitItem[];
};

/** Everything the page needs, in one pass. */
export function computed(input: RulesInput): Computed {
  const abilityModifiers = {} as Record<Ability, number>;
  for (const key of Object.keys(input.abilities) as Ability[]) {
    abilityModifiers[key] = abilityModifier(input.abilities[key]);
  }

  return {
    maxLevel: maxLevel(input),
    abilityModifiers,
    xpModifier: xpModifier(input),
    xpThreshold: xpThreshold(input, input.level),
    xpToNextLevel: xpToNextLevel(input),
    saves: savingThrows(input),
    skills: skillTargets(input),
    attack: attackBonus(input),
    magicResistance: magicResistance(input),
    maxHitPoints: maxHitPoints(input),
    hitDiceOwed: hitDiceOwed(input),
    glamour: glamour(input),
    glamourCoinCap: glamourCoinCap(input),
    loadouts: loadouts(input),
    unrated: unratedItems(input),
  };
}
