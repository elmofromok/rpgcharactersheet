import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { hydrate, parseCharacterFile, readCharacterFile, type CharacterFile } from "./seed.ts";

function file(over: Partial<CharacterFile> = {}): CharacterFile {
  return {
    id: "test-cat",
    name: "Test Cat",
    system: "dolmenwood",
    kindred: "grimalkin",
    class: "hunter",
    abilities: { str: 12, int: 9, wis: 10, dex: 10, con: 5, cha: 11 },
    ...over,
  };
}

describe("the fallback chain", () => {
  test("a field nobody sets falls back to the system default", () => {
    const c = hydrate(file());
    assert.equal(c.level, 1);
    assert.equal(c.xp, 0);
    assert.equal(c.gold, 0);
    assert.equal(c.alignment, "Neutral");
    assert.deepEqual(c.trophies, []);
    assert.deepEqual(c.kit, []);
  });

  test("the character file beats the default", () => {
    assert.equal(hydrate(file({ gold: 7 })).gold, 7);
  });

  test("the saved document beats the character file", () => {
    const c = hydrate(file({ gold: 7 }), { gold: 5 });
    assert.equal(c.gold, 5);
  });

  test("a field the save has never heard of comes from the file", () => {
    // The point of the chain: an old save picks up a new field rather than
    // breaking on it.
    const c = hydrate(file({ height: "3'6\"" }), { gold: 5 });
    assert.equal(c.height, "3'6\"");
    assert.equal(c.gold, 5);
  });

  test("a field the save clears stays cleared", () => {
    const c = hydrate(file({ journal: "owes a badger money" }), { journal: "" });
    assert.equal(c.journal, "");
  });
});

describe("hit points", () => {
  test("a new character starts at the maximum the rules give", () => {
    // 4 on the d8, minus 2 for Constitution 5.
    assert.equal(hydrate(file({ hitDice: [4] })).hp, 2);
  });

  test("a character already down stays down rather than being healed", () => {
    const c = hydrate(file({ hitDice: [4] }), { hp: 0 });
    assert.equal(c.hp, 0);
  });

  test("hit points from the file are kept", () => {
    assert.equal(hydrate(file({ hitDice: [4], hp: 1 })).hp, 1);
  });
});

describe("reading a character file", () => {
  test("a missing required field is named", () => {
    const json = JSON.stringify({ id: "test-cat", name: "Test Cat", system: "dolmenwood" });
    assert.throws(() => parseCharacterFile(json, "test-cat.json"), /missing "kindred"/);
  });

  test("abilities cannot be left out and quietly defaulted", () => {
    const { abilities: _drop, ...rest } = file();
    assert.throws(
      () => parseCharacterFile(JSON.stringify(rest), "test-cat.json"),
      /missing "abilities"/,
    );
  });

  test("the id has to match the filename", () => {
    assert.throws(
      () => parseCharacterFile(JSON.stringify(file()), "someone-else.json"),
      /does not match the filename/,
    );
  });
});

describe("the character file in this repo", () => {
  const moggle = hydrate(readCharacterFile("characters/moggle-fluff-a-kin.json"));

  test("hydrates to the character the published sheet shows", () => {
    assert.equal(moggle.name, "Moggle Fluff-a-kin");
    assert.equal(moggle.kindred, "grimalkin");
    assert.equal(moggle.class, "hunter");
    assert.equal(moggle.level, 1);
    assert.equal(moggle.hp, 2);
    assert.equal(moggle.gold, 5);
    assert.equal(moggle.arrows, 20);
    assert.equal(moggle.abilities.con, 5);
    assert.deepEqual(moggle.hitDice, [4]);
    assert.equal(moggle.kit.length, 14);
  });

  test("carries the bedroll picked up in play", () => {
    assert.ok(moggle.kit.some((i) => i.n === "Bedroll"));
  });

  test("has no start block, no state block and no hpMax", () => {
    const raw = readCharacterFile("characters/moggle-fluff-a-kin.json") as Record<string, unknown>;
    assert.equal(raw["start"], undefined);
    assert.equal(raw["state"], undefined);
    assert.equal(raw["hpMax"], undefined);
  });
});
