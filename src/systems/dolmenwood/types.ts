export type Ability = "str" | "int" | "wis" | "dex" | "con" | "cha";

export type Skill =
  | "alertness"
  | "listen"
  | "search"
  | "stalking"
  | "survival"
  | "tracking";

export type SaveKind = "doom" | "ray" | "hold" | "blast" | "spell";

export type Saves = Record<SaveKind, number>;

/**
 * What a kit item is worth in a fight. An item with no gear of its own and no
 * match in the equipment table is unrated: `rate` returns null for it, and it
 * contributes nothing rather than counting as zero.
 */
export type Bulk = "light" | "medium" | "heavy";

/** Where a kit item sits: to hand, or packed away in a container. */
export type Place = "equipped" | "stowed";

export type Gear =
  | { kind: "armour"; ac: number; bulk: Bulk }
  | { kind: "shield"; bonus: number }
  | { kind: "weapon"; damage: string; hands: 1 | 2; small: boolean; missile?: boolean }
  | { kind: "none" };

export type KitItem = {
  n: string;
  t: string;
  /** Mirrors a play-tracker value into the kit line instead of a free note. */
  auto?: "gold" | "arrows";
  /** Overrides the equipment table, for anything the book does not list. */
  gear?: Gear;
  /** Recorded: the player decides what is to hand. Absent, fighting gear is equipped and the rest is stowed. */
  where?: Place;
  /** Overrides the slot cost the rules would work out, for a line the general rule gets wrong. */
  slots?: number;
};

/**
 * Everything the rules read off a character, and nothing else. The stored
 * document carries more (trophies, notes, the journal); none of it changes a
 * number, so none of it belongs in this type.
 */
export type RulesInput = {
  kindred: string;
  class: string;
  level: number;
  xp: number;
  abilities: Record<Ability, number>;
  /** The hit die actually rolled at each level, oldest first. */
  hitDice: number[];
  /** Which glamour this character rolled, if their kindred has any. */
  glamour?: string;
  kit: KitItem[];
  /** Play values the rules read: coins and arrows take slots in bundles. */
  gold?: number;
  arrows?: number;
};
