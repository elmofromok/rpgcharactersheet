import type { RulesInput } from "./systems/dolmenwood/types.ts";

/**
 * Prose about one character, attached to the rule it qualifies. Provisional:
 * the anchor vocabulary and the tones are settled in the notes slice of #1.
 * Storage does not read this, so widening it later costs nothing.
 */
export type Note = {
  id: string;
  anchor: string;
  tone: "plain" | "aside" | "warning";
  body: string;
};

/**
 * One character, one flat document. No start block and no state block: git
 * dates the seed file, and a field the document is missing falls back to the
 * seed and then to the system defaults.
 *
 * Recorded here, never computed: ability scores, the hit die rolled at each
 * level, the kit, the notes, and the values that move during play. Everything
 * that follows from the rules is computed by `src/systems/<system>/rules.ts`
 * and is deliberately absent.
 */
export type CharacterDocument = RulesInput & {
  id: string;
  name: string;
  system: string;
  /**
   * Where this character is currently published. Transitional: it exists so
   * `build.mjs` can keep rebuilding the artifact while the local sheet is
   * being written, and it goes when the artifact does.
   */
  artifact?: string;
  alignment: string;
  age: string;
  height: string;
  languages: string[];

  /** Play values. Current hit points; the maximum is computed from hitDice. */
  hp: number;
  gold: number;
  arrows: number;
  wilder: boolean;
  coins: number;
  trophies: string[];
  journal: string;

  notes: Note[];
};
