// The database: every character, and every version of every character.
//
// There is one table. A character is its change log, and the character as it
// stands now is simply its newest row. Keeping a separate "current" table
// alongside the log would put the same fact in two places and let them
// disagree, which is the failure this whole rewrite exists to remove. See
// docs/adr/0002-the-change-log-is-the-store.md.

import { DatabaseSync } from "node:sqlite";

import type { CharacterDocument } from "../character.ts";

export type Revision = {
  revision: number;
  writtenAt: string;
};

export type CharacterSummary = Revision & {
  id: string;
  name: string;
};

export type Store = {
  /** Writes a new revision and returns it. The previous one is never touched. */
  save(document: CharacterDocument): Revision;
  /** The character as it stands now, or null if it has never been saved. */
  read(id: string): CharacterDocument | null;
  /** The character as it stood at one revision. */
  readAt(id: string, revision: number): CharacterDocument | null;
  /** Every revision of one character, newest first. */
  history(id: string): Revision[];
  /** Every character, by its newest revision. */
  list(): CharacterSummary[];
  close(): void;
};

export type StoreOptions = {
  /** Injectable so a test can pin the clock. */
  now?: () => string;
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS revisions (
  revision     INTEGER PRIMARY KEY AUTOINCREMENT,
  character_id TEXT NOT NULL,
  document     TEXT NOT NULL,
  written_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS revisions_by_character
  ON revisions (character_id, revision DESC);
`;

type RevisionRow = {
  revision: number;
  character_id: string;
  document: string;
  written_at: string;
};

function parse(json: string): CharacterDocument {
  return JSON.parse(json) as CharacterDocument;
}

export function openStore(path: string, options: StoreOptions = {}): Store {
  const now = options.now ?? (() => new Date().toISOString());
  const db = new DatabaseSync(path);

  // WAL survives a power cut mid-write and lets the page read while the
  // server writes. A memory database ignores it and says so; that is fine.
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA synchronous = NORMAL");
  db.exec("PRAGMA busy_timeout = 5000");
  db.exec(SCHEMA);

  const insert = db.prepare(
    "INSERT INTO revisions (character_id, document, written_at) VALUES (?, ?, ?)",
  );
  const newest = db.prepare(
    "SELECT * FROM revisions WHERE character_id = ? ORDER BY revision DESC LIMIT 1",
  );
  const one = db.prepare(
    "SELECT * FROM revisions WHERE character_id = ? AND revision = ?",
  );
  const log = db.prepare(
    "SELECT revision, written_at FROM revisions WHERE character_id = ? ORDER BY revision DESC",
  );
  const newestOfEach = db.prepare(`
    SELECT r.* FROM revisions r
    JOIN (
      SELECT character_id, MAX(revision) AS revision
      FROM revisions GROUP BY character_id
    ) latest
      ON latest.character_id = r.character_id AND latest.revision = r.revision
    ORDER BY r.character_id
  `);

  return {
    save(document) {
      if (!document.id) throw new Error("A character needs an id to be saved");
      const writtenAt = now();
      // One statement, so there is no half-written state to crash into.
      const result = insert.run(document.id, JSON.stringify(document), writtenAt);
      return { revision: Number(result.lastInsertRowid), writtenAt };
    },

    read(id) {
      const row = newest.get(id) as RevisionRow | undefined;
      return row ? parse(row.document) : null;
    },

    readAt(id, revision) {
      const row = one.get(id, revision) as RevisionRow | undefined;
      return row ? parse(row.document) : null;
    },

    history(id) {
      const rows = log.all(id) as Array<{ revision: number; written_at: string }>;
      return rows.map((r) => ({ revision: r.revision, writtenAt: r.written_at }));
    },

    list() {
      const rows = newestOfEach.all() as RevisionRow[];
      return rows.map((r) => ({
        id: r.character_id,
        name: parse(r.document).name,
        revision: r.revision,
        writtenAt: r.written_at,
      }));
    },

    close() {
      db.close();
    },
  };
}
