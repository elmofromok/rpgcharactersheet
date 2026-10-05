// Holds the character the page is showing, and gets every change to the
// database without anyone pressing save.
//
// The ref rather than the state is the source of truth for what to write,
// because a burst of clicks on a stepper must not race the renderer.
//
// Looking back swaps what is drawn, not what is held. The live character stays
// in `latest` throughout, so a save still settling when a past level is chosen
// writes the live document and never the past one, and coming back to now
// needs no second fetch.

import { useCallback, useEffect, useRef, useState } from "preact/hooks";

import type { CharacterDocument } from "../character.ts";
import type { LevelEntry } from "../storage/store.ts";
import {
  fetchCharacter,
  fetchLevels,
  fetchRevision,
  listCharacters,
  saveCharacter,
} from "./api.ts";

export type SaveState = "loading" | "saved" | "unsaved" | "saving" | "failed" | "readonly";

export type Patch = (change: Partial<CharacterDocument>) => void;

/** Long enough to collect a run of clicks, short enough to forget about. */
const SETTLE_MS = 700;

export type Loaded = {
  /** What to draw: the live character, or a past level of it. */
  character: CharacterDocument | null;
  status: SaveState;
  problem: string | null;
  patch: Patch;
  /** Every level the character has been saved at, lowest first. */
  levels: LevelEntry[];
  /** The past level drawn, or null when the sheet is now. */
  lookingAt: LevelEntry | null;
  /** The level of the live character, whatever is drawn. */
  nowLevel: number | null;
};

/** What a past level gets instead of a patch. Nothing is routed to the database. */
const ignore: Patch = () => {};

/** A past revision as fetched. Which level it stands for is the list's to say. */
type Past = { revision: number; document: CharacterDocument };

export function useCharacter(id: string | null, level: number | null): Loaded {
  const [character, setCharacter] = useState<CharacterDocument | null>(null);
  const [status, setStatus] = useState<SaveState>("loading");
  const [problem, setProblem] = useState<string | null>(null);
  // A past level that could not be read. Kept apart from `problem` so that
  // coming back to now, or picking another level, leaves it behind.
  const [pastProblem, setPastProblem] = useState<string | null>(null);
  // Null until the first list arrives, so a level asked for in the URL can wait
  // for it rather than be declared missing.
  const [levels, setLevels] = useState<LevelEntry[] | null>(null);
  const [past, setPast] = useState<Past | null>(null);

  const latest = useRef<CharacterDocument | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const saving = useRef(false);
  const queued = useRef(false);
  // What the database already holds. Every revision is kept forever, so
  // writing one that changes nothing is not harmless: it is a line of history
  // that says an edit happened when none did.
  const written = useRef<string | null>(null);

  // A save can open a new level or move which row stands for the current one,
  // so the list is read again after each. Failing here costs only the list.
  const refreshLevels = useCallback(async (): Promise<void> => {
    const current = latest.current;
    if (!current) return;
    try {
      setLevels(await fetchLevels(current.id));
    } catch {
      // The sheet is saved either way; the list catches up on the next save.
    }
  }, []);

  const flush = useCallback(async (): Promise<void> => {
    const document = latest.current;
    if (!document) return;
    const serialised = JSON.stringify(document);
    if (serialised === written.current) {
      setStatus("saved");
      return;
    }
    if (saving.current) {
      queued.current = true;
      return;
    }
    saving.current = true;
    setStatus("saving");
    try {
      await saveCharacter(document);
      written.current = serialised;
      saving.current = false;
      if (queued.current) {
        queued.current = false;
        await flush();
      } else {
        setStatus("saved");
        void refreshLevels();
      }
    } catch {
      saving.current = false;
      queued.current = false;
      // The change is still in the page and still in `latest`, so the next
      // edit tries again. Nothing is lost by failing here.
      setStatus("failed");
    }
  }, [refreshLevels]);

  const patch = useCallback<Patch>(
    (change) => {
      const current = latest.current;
      if (!current) return;
      const next = { ...current, ...change };
      latest.current = next;
      setCharacter(next);
      setStatus("unsaved");
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void flush(), SETTLE_MS);
    },
    [flush],
  );

  useEffect(() => {
    void (async () => {
      try {
        const wanted = id ?? (await listCharacters())[0]?.id;
        if (!wanted) {
          setProblem("No characters in the database yet. Import one: npm run import");
          return;
        }
        const loaded = await fetchCharacter(wanted);
        latest.current = loaded;
        written.current = JSON.stringify(loaded);
        setCharacter(loaded);
        setStatus("saved");
        // The list only feeds the level menu. If it cannot be read the sheet
        // is still the sheet, and a level asked for in the URL is reported
        // missing rather than waited for.
        setLevels(await fetchLevels(wanted).catch(() => []));
      } catch (err) {
        setProblem(err instanceof Error ? err.message : String(err));
      }
    })();
  }, [id]);

  // The row that stands for the wanted level. Unknown until the list arrives.
  const entry =
    level === null || levels === null ? null : (levels.find((l) => l.level === level) ?? null);
  const missing =
    level !== null && levels !== null && entry === null
      ? `No level ${level} in this character's history.`
      : null;

  // Keyed on the revision number, not the entry: every save replaces the list
  // and with it the entry object, and the same revision need not be fetched
  // twice.
  const revision = entry?.revision ?? null;
  useEffect(() => {
    setPastProblem(null);
    if (revision === null) {
      setPast(null);
      return;
    }
    const current = latest.current;
    if (!current) return;
    let stale = false;
    void (async () => {
      try {
        const document = await fetchRevision(current.id, revision);
        if (!stale) setPast({ revision, document });
      } catch (err) {
        if (!stale) setPastProblem(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      stale = true;
    };
  }, [revision]);

  // Closing the tab or switching away should not cost the last few seconds.
  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden" && latest.current) {
        window.clearTimeout(timer.current);
        void flush();
      }
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, [flush]);

  if (level === null) {
    return {
      character,
      status,
      problem,
      patch,
      levels: levels ?? [],
      lookingAt: null,
      nowLevel: character?.level ?? null,
    };
  }

  // A past level still on its way, or one from a different revision than the
  // URL's level now stands for, is not drawn: the page waits rather than flash
  // the live sheet with its controls live.
  const shown = past && entry && past.revision === entry.revision ? past : null;
  return {
    character: shown?.document ?? null,
    // A live save that failed is not hidden behind "read only": the edit is
    // still only in this page, and the reader should know before closing it.
    status: status === "failed" ? "failed" : "readonly",
    problem: problem ?? pastProblem ?? missing,
    patch: ignore,
    levels: levels ?? [],
    lookingAt: shown ? entry : null,
    nowLevel: character?.level ?? null,
  };
}
