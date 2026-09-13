import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  abilityModifier,
  attackBonus,
  bankXp,
  computed,
  hitDiceOwed,
  loadouts,
  magicResistance,
  maxHitPoints,
  maxLevel,
  rate,
  savingThrows,
  skillTargets,
  unratedItems,
  wornArmour,
  xpModifier,
  xpToNextLevel,
} from "./rules.ts";
import type { KitItem, RulesInput } from "./types.ts";

/** Reads the first entry and fails the test rather than the type check. */
function only<T>(list: T[]): T {
  const item = list[0];
  assert.ok(item, "expected at least one entry");
  return item;
}

// Moggle Fluff-a-kin as created, which is also every number the published
// sheet shows. If a change here breaks these, the sheet was wrong or is now.
function moggle(over: Partial<RulesInput> = {}): RulesInput {
  return {
    kindred: "grimalkin",
    class: "hunter",
    level: 1,
    xp: 0,
    abilities: { str: 12, int: 9, wis: 10, dex: 10, con: 5, cha: 11 },
    hitDice: [4],
    kit: [
      { n: "Leather armour, cut down to a cat's frame", t: "AC 12 · light" },
      { n: "Shield", t: "+1 AC" },
      { n: "Shortbow", t: "1d6 · two-handed" },
      { n: "Arrows", t: "", auto: "arrows" },
      { n: "Dagger", t: "1d4 · small" },
      { n: "Common clothes, under jet black wools", t: "" },
      { n: "Backpack: 2 preserved rations, waterskin, tinder box", t: "" },
      { n: "Belt pouch", t: "", auto: "gold" },
      { n: "A whistle only dogs cannot hear", t: "" },
      { n: "Chisel", t: "no. 3" },
      { n: "Sledgehammer", t: "no. 16" },
      { n: "Ink, quill, 5 sheets of paper", t: "no. 8" },
      { n: "Shovel", t: "no. 15" },
    ],
    ...over,
  };
}

describe("ability modifiers", () => {
  test("the bands from the book", () => {
    assert.equal(abilityModifier(3), -3);
    assert.equal(abilityModifier(4), -2);
    assert.equal(abilityModifier(5), -2);
    assert.equal(abilityModifier(6), -1);
    assert.equal(abilityModifier(8), -1);
    assert.equal(abilityModifier(9), 0);
    assert.equal(abilityModifier(12), 0);
    assert.equal(abilityModifier(13), 1);
    assert.equal(abilityModifier(15), 1);
    assert.equal(abilityModifier(16), 2);
    assert.equal(abilityModifier(17), 2);
    assert.equal(abilityModifier(18), 3);
  });

  test("scores off the ends of the table clamp", () => {
    assert.equal(abilityModifier(2), -3);
    assert.equal(abilityModifier(19), 3);
  });
});

describe("saving throws", () => {
  test("a level 1 hunter saves on 12, 13, 14, 15 and 16", () => {
    assert.deepEqual(savingThrows(moggle()), {
      doom: 12,
      ray: 13,
      hold: 14,
      blast: 15,
      spell: 16,
    });
  });

  test("they improve with level rather than staying frozen", () => {
    assert.equal(savingThrows(moggle({ level: 2 })).doom, 12);
    assert.equal(savingThrows(moggle({ level: 3 })).doom, 11);
    assert.equal(savingThrows(moggle({ level: 13 })).spell, 8);
  });
});

describe("experience", () => {
  test("Constitution 5 costs 20% of every award", () => {
    assert.equal(xpModifier(moggle()), -0.2);
    assert.equal(bankXp(moggle(), 100), 80);
  });

  test("the lowest prime ability decides, not the best one", () => {
    const input = moggle({
      abilities: { str: 12, int: 9, wis: 10, dex: 8, con: 16, cha: 11 },
    });
    assert.equal(xpModifier(input), -0.1);
  });

  test("a prime in the middle band costs nothing", () => {
    const input = moggle({
      abilities: { str: 12, int: 9, wis: 10, dex: 10, con: 12, cha: 11 },
    });
    assert.equal(xpModifier(input), 0);
  });

  test("level 2 needs 2,813 awarded, not the 2,250 in the table", () => {
    assert.equal(xpToNextLevel(moggle()), 2813);
  });

  test("nothing is owed once the cap is reached", () => {
    assert.equal(xpToNextLevel(moggle({ level: 14 })), null);
  });
});

describe("hit points", () => {
  test("Constitution 5 takes 2 off every level, so a 4 gives 2", () => {
    assert.equal(maxHitPoints(moggle()), 2);
    assert.equal(maxHitPoints(moggle({ level: 2, hitDice: [4, 4] })), 4);
  });

  test("a level never yields less than 1 however bad the roll", () => {
    assert.equal(maxHitPoints(moggle({ hitDice: [1] })), 1);
    assert.equal(maxHitPoints(moggle({ level: 2, hitDice: [1, 2] })), 2);
  });

  test("from level 11 the gain is flat and Constitution stops applying", () => {
    const rolls = [4, 4, 4, 4, 4, 4, 4, 4, 4, 4];
    const ten = maxHitPoints(moggle({ level: 10, hitDice: rolls }));
    assert.equal(ten, 20);
    assert.equal(maxHitPoints(moggle({ level: 11, hitDice: rolls })), 22);
  });

  test("levelling ahead of the dice is reported rather than guessed", () => {
    assert.equal(hitDiceOwed(moggle()), 0);
    assert.equal(hitDiceOwed(moggle({ level: 3, hitDice: [4] })), 2);
  });
});

describe("skills", () => {
  test("targets reflect both the kindred and the class", () => {
    const s = skillTargets(moggle());
    assert.deepEqual(s.listen, { target: 5, source: "kindred" });
    assert.deepEqual(s.survival, { target: 5, source: "class" });
    assert.deepEqual(s.tracking, { target: 5, source: "class" });
    assert.deepEqual(s.alertness, { target: 6, source: "class" });
    assert.deepEqual(s.stalking, { target: 6, source: "class" });
    assert.deepEqual(s.search, { target: 6, source: "default" });
  });

  test("Tracking improves to 4 at level 3 on its own", () => {
    assert.equal(skillTargets(moggle({ level: 2 })).tracking.target, 5);
    assert.equal(skillTargets(moggle({ level: 3 })).tracking.target, 4);
  });

  test("Stalking improves to 5 at level 4", () => {
    assert.equal(skillTargets(moggle({ level: 3 })).stalking.target, 6);
    assert.equal(skillTargets(moggle({ level: 4 })).stalking.target, 5);
  });
});

describe("attack and magic resistance", () => {
  test("the missile bonus stacks with the class attack bonus", () => {
    assert.deepEqual(attackBonus(moggle()), { melee: 1, missile: 2 });
  });

  test("Strength moves melee and Dexterity moves missile", () => {
    const input = moggle({
      abilities: { str: 16, int: 9, wis: 10, dex: 13, con: 5, cha: 11 },
    });
    assert.deepEqual(attackBonus(input), { melee: 3, missile: 3 });
  });

  test("magic resistance is Wisdom plus the kindred's own", () => {
    assert.equal(magicResistance(moggle()), 2);
    const wise = moggle({
      abilities: { str: 12, int: 9, wis: 16, dex: 10, con: 5, cha: 11 },
    });
    assert.equal(magicResistance(wise), 4);
  });
});

describe("armour class and loadouts", () => {
  test("leather and the shortbow gives 12, leather and a shield gives 13", () => {
    const list = loadouts(moggle());
    const bow = list.find((l) => l.held.join(" and ") === "Shortbow");
    const guard = list.find((l) => l.held.length === 2);
    assert.equal(bow?.armourClass, 12);
    assert.deepEqual(guard?.held, ["Dagger", "Shield"]);
    assert.equal(guard?.armourClass, 13);
  });

  test("a two-handed bow with a shield is never offered", () => {
    for (const l of loadouts(moggle())) {
      const hasBow = l.held.includes("Shortbow");
      const hasShield = l.held.includes("Shield");
      assert.ok(!(hasBow && hasShield), `illegal loadout: ${l.held.join(" + ")}`);
      assert.ok(l.hands <= 2, `${l.held.join(" + ")} needs ${l.hands} hands`);
    }
  });

  test("the kindred's bonus against Large creatures rides along", () => {
    const bow = only(loadouts(moggle()));
    assert.equal(bow.armourClass, 12);
    assert.equal(bow.armourClassVersusLarge, 14);
  });

  test("Dexterity moves armour class", () => {
    const nimble = moggle({
      abilities: { str: 12, int: 9, wis: 10, dex: 16, con: 5, cha: 11 },
    });
    assert.equal(only(loadouts(nimble)).armourClass, 14);
  });

  test("a character with no weapon still gets an armour class", () => {
    const bare = moggle({ kit: [{ n: "Leather armour", t: "" }] });
    const list = loadouts(bare);
    assert.equal(list.length, 1);
    assert.deepEqual(only(list).held, []);
    assert.equal(only(list).armourClass, 12);
  });

  test("no armour at all is 10", () => {
    const naked = moggle({ kit: [{ n: "Dagger", t: "" }] });
    assert.equal(only(loadouts(naked)).armourClass, 10);
  });
});

describe("rating kit", () => {
  test("the table is matched on whole words", () => {
    assert.equal(rate({ n: "Leather armour, cut down to a cat's frame", t: "" })?.kind, "armour");
    assert.equal(rate({ n: "Shortbow", t: "" })?.kind, "weapon");
  });

  test("a sledgehammer is not a war hammer", () => {
    assert.equal(rate({ n: "Sledgehammer", t: "no. 16" }), null);
  });

  test("an unrated item does not quietly change armour class", () => {
    const input = moggle({
      kit: [
        { n: "Leather armour", t: "" },
        { n: "Buckler", t: "the one I made myself" },
        { n: "Dagger", t: "" },
      ],
    });
    assert.deepEqual(unratedItems(input).map((i: KitItem) => i.n), ["Buckler"]);
    assert.equal(loadouts(input).length, 1);
    assert.equal(only(loadouts(input)).armourClass, 12);
  });

  test("an item may carry its own rating for something the book omits", () => {
    const input = moggle({
      kit: [
        { n: "Leather armour", t: "" },
        { n: "Buckler", t: "", gear: { kind: "shield", bonus: 1 } },
        { n: "Dagger", t: "" },
      ],
    });
    assert.equal(unratedItems(input).length, 0);
    const guard = loadouts(input).find((l) => l.held.length === 2);
    assert.equal(guard?.armourClass, 13);
  });

  test("a false match can be silenced", () => {
    const item: KitItem = { n: "Leather bookmark", t: "", gear: { kind: "none" } };
    assert.equal(rate(item), null);
    assert.equal(wornArmour(moggle({ kit: [item] })), null);
  });

  test("Moggle carries nine things that do nothing in a fight", () => {
    assert.equal(unratedItems(moggle()).length, 9);
  });
});

describe("the level cap", () => {
  test("the kindred caps the character below the class table", () => {
    assert.equal(maxLevel(moggle()), 14);
  });

  test("a level past the cap is read as the cap rather than crashing", () => {
    assert.deepEqual(savingThrows(moggle({ level: 99 })), savingThrows(moggle({ level: 14 })));
  });
});

describe("computed", () => {
  test("one pass gives the page every number the sheet shows", () => {
    const c = computed(moggle());
    assert.equal(c.maxHitPoints, 2);
    assert.equal(c.abilityModifiers.con, -2);
    assert.equal(c.xpModifier, -0.2);
    assert.equal(c.xpToNextLevel, 2813);
    assert.equal(c.saves.doom, 12);
    assert.equal(c.skills.listen.target, 5);
    assert.equal(c.attack.missile, 2);
    assert.equal(c.magicResistance, 2);
    assert.equal(c.maxLevel, 14);
    assert.equal(c.loadouts.length, 3);
  });
});
