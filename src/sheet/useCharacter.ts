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

type Past = { entry: LevelEntry; document: CharacterDocument };

export function useCharacter(id: string | null, level: number | null): Loaded {
  const [character, setCharacter] = useState<CharacterDocument | null>(null);
  const [status, setStatus] = useState<SaveState>("loading");
  const [problem, setProblem] = useState<string | null>(null);
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
        const [loaded, history] = await Promise.all([fetchCharacter(wanted), fetchLevels(wanted)]);
        latest.current = loaded;
        written.current = JSON.stringify(loaded);
        setCharacter(loaded);
        setLevels(history);
        setStatus("saved");
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

  useEffect(() => {
    if (!entry) {
      setPast(null);
      return;
    }
    const current = latest.current;
    if (!current) return;
    let stale = false;
    void (async () => {
      try {
        const document = await fetchRevision(current.id, entry.revision);
        if (!stale) setPast({ entry, document });
      } catch (err) {
        if (!stale) setProblem(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      stale = true;
    };
  }, [entry]);

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

  // A past level still on its way, or one from a different level than the URL
  // now names, is not drawn: the page waits rather than flash the live sheet
  // with its controls live.
  const shown = past && past.entry.level === level ? past : null;
  return {
    character: shown?.document ?? null,
    status: "readonly",
    problem: problem ?? missing,
    patch: ignore,
    levels: levels ?? [],
    lookingAt: shown?.entry ?? null,
    nowLevel: character?.level ?? null,
  };
}
