/**
 * Where a note can attach on a Dolmenwood sheet.
 *
 * A rule anchor renders the note beneath the rule it qualifies, so "on 2 hit
 * points you cannot reach the trigger" sits under wilder form where it is
 * useful rather than in a pile at the bottom. A page anchor houses notes that
 * qualify no rule and would otherwise have nowhere to go.
 *
 * The ids are part of the character data: a note records the anchor it is
 * attached to, so renaming one here orphans every note that used it.
 */
export type AnchorId =
  | "page.top"
  | "page.appearance"
  | "abilities"
  | "combat.hitPoints"
  | "combat.armourClass"
  | "saves"
  | "skills"
  | "particulars"
  | "kit"
  | "kindred.what"
  | "kindred.chester"
  | "kindred.wilder"
  | "kindred.glamour"
  | "kindred.oddments"
  | "class.aptitude"
  | "class.companion"
  | "class.missile"
  | "class.trophies"
  | "class.skills";

export const ANCHORS: Array<{ id: AnchorId; label: string }> = [
  { id: "page.top", label: "Top of the sheet" },
  { id: "abilities", label: "Ability scores" },
  { id: "combat.hitPoints", label: "Hit points" },
  { id: "combat.armourClass", label: "Armour class" },
  { id: "saves", label: "Saving throws" },
  { id: "skills", label: "Skills" },
  { id: "particulars", label: "Particulars" },
  { id: "kit", label: "Kit" },
  { id: "kindred.what", label: "Kindred, in general" },
  { id: "kindred.chester", label: "Chester form" },
  { id: "kindred.wilder", label: "Wilder form" },
  { id: "kindred.glamour", label: "Glamour" },
  { id: "kindred.oddments", label: "Cold iron and giant rats" },
  { id: "class.aptitude", label: "Combat aptitude" },
  { id: "class.companion", label: "Animal companion" },
  { id: "class.missile", label: "Missile bonus" },
  { id: "class.trophies", label: "Trophies" },
  { id: "class.skills", label: "Class skills" },
  { id: "page.appearance", label: "Appearance and bearing" },
];

export const ANCHOR_LABELS: Record<string, string> = Object.fromEntries(
  ANCHORS.map((anchor) => [anchor.id, anchor.label]),
);
