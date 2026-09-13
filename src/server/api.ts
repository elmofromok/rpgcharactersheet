// The API the sheet talks to. Deliberately a plain function of method, path
// and body so it can be tested without binding a port.
//
// The server sends documents, not computed values. The rules run in the
// browser from the same module the tests use, so there is one answer to
// "what is my armour class" rather than one on each side of the wire.

import type { CharacterDocument } from "../character.ts";
import { isCharacterId, loadCharacter } from "../characters/load.ts";
import type { Store } from "../storage/store.ts";

export type ApiResponse = {
  status: number;
  body: unknown;
};

export type Api = (method: string, pathname: string, body?: unknown) => ApiResponse;

function json(status: number, body: unknown): ApiResponse {
  return { status, body };
}

function error(status: number, message: string): ApiResponse {
  return json(status, { error: message });
}

export function createApi(store: Store): Api {
  return (method, pathname, body) => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments[0] !== "api" || segments[1] !== "characters") {
      return error(404, "No such endpoint");
    }

    const id = segments[2];

    if (id === undefined) {
      if (method !== "GET") return error(405, `${method} not allowed here`);
      return json(200, store.list());
    }

    if (!isCharacterId(id)) return error(400, `"${id}" is not a character id`);

    const tail = segments.slice(3);

    if (tail.length === 0) {
      if (method === "GET") {
        const character = loadCharacter(store, id);
        return character ? json(200, character) : error(404, `No character "${id}"`);
      }
      if (method === "PUT") {
        return save(store, id, body);
      }
      return error(405, `${method} not allowed here`);
    }

    if (tail[0] === "revisions" && method === "GET") {
      if (tail.length === 1) return json(200, store.history(id));
      if (tail.length === 2) {
        const revision = Number(tail[1]);
        if (!Number.isInteger(revision)) return error(400, "Revision must be a whole number");
        const past = store.readAt(id, revision);
        return past ? json(200, past) : error(404, `No revision ${revision} of "${id}"`);
      }
    }

    return error(404, "No such endpoint");
  };
}

function save(store: Store, id: string, body: unknown): ApiResponse {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return error(400, "Expected a character document");
  }
  const document = body as CharacterDocument;
  if (document.id !== id) {
    return error(400, `Document id "${document.id}" does not match the path`);
  }
  // Saving a character that has never been saved is how one is created, so
  // there is nothing to check for existence here.
  return json(200, store.save(document));
}
