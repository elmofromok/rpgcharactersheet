import assert from "node:assert/strict";
import { after, describe, test } from "node:test";

import type { CharacterDocument } from "../character.ts";
import { openStore, type Store } from "../storage/store.ts";
import { createApi, type Api } from "./api.ts";

function cat(over: Partial<CharacterDocument> = {}): CharacterDocument {
  return {
    id: "test-cat",
    name: "Test Cat",
    system: "dolmenwood",
    kindred: "grimalkin",
    class: "hunter",
    alignment: "Neutral",
    age: "999",
    height: "3'6\"",
    languages: [],
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
    kit: [],
    ...over,
  };
}

const opened: Store[] = [];
function api(): Api {
  const store = openStore(":memory:");
  opened.push(store);
  return createApi(store);
}

after(() => {
  for (const store of opened) store.close();
});

describe("reading", () => {
  test("an empty database lists nothing", () => {
    const response = api()("GET", "/api/characters");
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, []);
  });

  test("a saved character comes back whole", () => {
    const call = api();
    call("PUT", "/api/characters/test-cat", cat());

    const response = call("GET", "/api/characters/test-cat");
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, cat());
  });

  test("a character nobody has saved is a 404", () => {
    assert.equal(api()("GET", "/api/characters/nobody").status, 404);
  });

  test("an id that is not an id is refused before it reaches the disk", () => {
    const call = api();
    assert.equal(call("GET", "/api/characters/..%2F..%2Fetc").status, 400);
    assert.equal(call("GET", "/api/characters/.").status, 400);
  });

  test("the character file tops up a document that predates a field", () => {
    // Moggle is saved here without her height, which her character file has.
    const call = api();
    const { height: _drop, ...older } = cat({ id: "moggle-fluff-a-kin" });
    call("PUT", "/api/characters/moggle-fluff-a-kin", older);

    const body = call("GET", "/api/characters/moggle-fluff-a-kin").body as CharacterDocument;
    assert.equal(body.height, "3′6″");
    assert.equal(body.gold, 5);
  });
});

describe("saving", () => {
  test("a save returns the revision it wrote", () => {
    const response = api()("PUT", "/api/characters/test-cat", cat());
    assert.equal(response.status, 200);
    assert.equal((response.body as { revision: number }).revision, 1);
  });

  test("a document filed under the wrong id is refused", () => {
    const response = api()("PUT", "/api/characters/test-cat", cat({ id: "someone-else" }));
    assert.equal(response.status, 400);
  });

  test("a body that is not a document is refused", () => {
    const call = api();
    assert.equal(call("PUT", "/api/characters/test-cat", "hello").status, 400);
    assert.equal(call("PUT", "/api/characters/test-cat", [1, 2]).status, 400);
    assert.equal(call("PUT", "/api/characters/test-cat", undefined).status, 400);
  });
});

describe("revisions", () => {
  test("every save is listed, newest first", () => {
    const call = api();
    call("PUT", "/api/characters/test-cat", cat({ hp: 2 }));
    call("PUT", "/api/characters/test-cat", cat({ hp: 1 }));

    const log = call("GET", "/api/characters/test-cat/revisions").body as Array<{
      revision: number;
    }>;
    assert.equal(log.length, 2);
    assert.equal(log[0]?.revision, 2);
  });

  test("a past revision reads back as it stood", () => {
    const call = api();
    call("PUT", "/api/characters/test-cat", cat({ gold: 7 }));
    call("PUT", "/api/characters/test-cat", cat({ gold: 5 }));

    const then = call("GET", "/api/characters/test-cat/revisions/1").body as CharacterDocument;
    assert.equal(then.gold, 7);
    assert.equal(call("GET", "/api/characters/test-cat/revisions/99").status, 404);
    assert.equal(call("GET", "/api/characters/test-cat/revisions/nope").status, 400);
  });
});

describe("everything else", () => {
  test("a method the endpoint does not have is a 405", () => {
    const call = api();
    assert.equal(call("DELETE", "/api/characters/test-cat").status, 405);
    assert.equal(call("PUT", "/api/characters").status, 405);
  });

  test("an endpoint that does not exist is a 404", () => {
    const call = api();
    assert.equal(call("GET", "/api/nonsense").status, 404);
    assert.equal(call("GET", "/api/characters/test-cat/portrait").status, 404);
  });
});
