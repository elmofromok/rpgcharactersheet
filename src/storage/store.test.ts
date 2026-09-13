import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, test } from "node:test";

import { openStore, type Store } from "./store.ts";
import type { CharacterDocument } from "../character.ts";

function moggle(over: Partial<CharacterDocument> = {}): CharacterDocument {
  return {
    id: "moggle-fluff-a-kin",
    name: "Moggle Fluff-a-kin",
    system: "dolmenwood",
    kindred: "grimalkin",
    class: "hunter",
    alignment: "Neutral",
    age: "999",
    height: "3'6\"",
    languages: ["Woldish", "Mewl"],
    level: 1,
    xp: 0,
    abilities: { str: 12, int: 9, wis: 10, dex: 10, con: 5, cha: 11 },
    hitDice: [4],
    hp: 2,
    gold: 5,
    arrows: 20,
    wilder: false,
    coins: 0,
    trophies: [],
    journal: "",
    notes: [],
    kit: [
      { n: "Leather armour, cut down to a cat's frame", t: "AC 12 · light" },
      { n: "Shield", t: "+1 AC" },
      { n: "Arrows", t: "", auto: "arrows" },
    ],
    ...over,
  };
}

const temporary: Store[] = [];
function memory(): Store {
  const store = openStore(":memory:");
  temporary.push(store);
  return store;
}

const directory = mkdtempSync(join(tmpdir(), "rpgcharactersheet-"));
after(() => {
  for (const store of temporary) store.close();
  rmSync(directory, { recursive: true, force: true });
});

describe("saving and reading back", () => {
  test("a character survives the round trip unchanged", () => {
    const store = memory();
    const written = moggle();

    const revision = store.save(written);
    const read = store.read("moggle-fluff-a-kin");

    assert.deepEqual(read, written);
    assert.equal(revision.revision, 1);
    assert.equal(store.history("moggle-fluff-a-kin").length, 1);
  });

  test("every save adds exactly one row to the change log", () => {
    const store = memory();
    store.save(moggle());
    store.save(moggle({ hp: 1 }));
    store.save(moggle({ hp: 0 }));

    assert.equal(store.history("moggle-fluff-a-kin").length, 3);
  });

  test("a field the document type does not know is still kept", () => {
    const store = memory();
    const written = { ...moggle(), rememberedRat: "Bartholomew" };

    store.save(written as unknown as CharacterDocument);
    const read = store.read("moggle-fluff-a-kin") as unknown as typeof written;

    assert.equal(read.rememberedRat, "Bartholomew");
  });

  test("reading a character nobody has saved gives null", () => {
    assert.equal(memory().read("nobody"), null);
  });

  test("a document with no id is refused rather than filed under nothing", () => {
    const store = memory();
    assert.throws(() => store.save(moggle({ id: "" })), /needs an id/);
  });
});

describe("history", () => {
  test("reading gives the newest revision", () => {
    const store = memory();
    store.save(moggle({ hp: 2 }));
    store.save(moggle({ hp: 1 }));

    assert.equal(store.read("moggle-fluff-a-kin")?.hp, 1);
  });

  test("any past state can be read back", () => {
    const store = memory();
    const first = store.save(moggle({ hp: 2, gold: 7 }));
    store.save(moggle({ hp: 1, gold: 5 }));

    const then = store.readAt("moggle-fluff-a-kin", first.revision);
    assert.equal(then?.hp, 2);
    assert.equal(then?.gold, 7);
  });

  test("the log runs newest first and carries a timestamp", () => {
    let tick = 0;
    const store = openStore(":memory:", {
      now: () => `2026-09-12T00:0${tick++}:00.000Z`,
    });
    temporary.push(store);

    store.save(moggle());
    store.save(moggle({ hp: 1 }));

    const log = store.history("moggle-fluff-a-kin");
    assert.deepEqual(
      log.map((r) => r.writtenAt),
      ["2026-09-12T00:01:00.000Z", "2026-09-12T00:00:00.000Z"],
    );
    assert.ok(log[0]!.revision > log[1]!.revision);
  });

  test("one character's history is its own", () => {
    const store = memory();
    store.save(moggle());
    store.save(moggle({ id: "someone-else", name: "Someone Else" }));

    assert.equal(store.history("moggle-fluff-a-kin").length, 1);
    assert.equal(store.history("someone-else").length, 1);
  });
});

describe("listing", () => {
  test("every character appears once, at its newest revision", () => {
    const store = memory();
    store.save(moggle());
    store.save(moggle({ hp: 1 }));
    store.save(moggle({ id: "someone-else", name: "Someone Else" }));

    const list = store.list();
    assert.equal(list.length, 2);
    assert.deepEqual(list.map((c) => c.id), ["moggle-fluff-a-kin", "someone-else"]);
    assert.equal(list[0]?.name, "Moggle Fluff-a-kin");
    assert.equal(list[0]?.revision, 2);
  });

  test("an empty database lists nothing", () => {
    assert.deepEqual(memory().list(), []);
  });
});

describe("durability", () => {
  test("a character outlives the process that wrote it", () => {
    const file = join(directory, "characters.db");

    const writing = openStore(file);
    writing.save(moggle({ gold: 5 }));
    writing.save(moggle({ gold: 3 }));
    writing.close();

    const reading = openStore(file);
    assert.equal(reading.read("moggle-fluff-a-kin")?.gold, 3);
    assert.equal(reading.history("moggle-fluff-a-kin").length, 2);
    reading.close();
  });
});
