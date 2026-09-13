// Holds the character the page is showing, and gets every change to the
// database without anyone pressing save.
//
// The ref rather than the state is the source of truth for what to write,
// because a burst of clicks on a stepper must not race the renderer.

import { useCallback, useEffect, useRef, useState } from "preact/hooks";

import type { CharacterDocument } from "../character.ts";
import { fetchCharacter, listCharacters, saveCharacter } from "./api.ts";

export type SaveState = "loading" | "saved" | "unsaved" | "saving" | "failed";

export type Patch = (change: Partial<CharacterDocument>) => void;

/** Long enough to collect a run of clicks, short enough to forget about. */
const SETTLE_MS = 700;

export type Loaded = {
  character: CharacterDocument | null;
  status: SaveState;
  problem: string | null;
  patch: Patch;
};

export function useCharacter(id: string | null): Loaded {
  const [character, setCharacter] = useState<CharacterDocument | null>(null);
  const [status, setStatus] = useState<SaveState>("loading");
  const [problem, setProblem] = useState<string | null>(null);

  const latest = useRef<CharacterDocument | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const saving = useRef(false);
  const queued = useRef(false);

  const flush = useCallback(async (): Promise<void> => {
    const document = latest.current;
    if (!document) return;
    if (saving.current) {
      queued.current = true;
      return;
    }
    saving.current = true;
    setStatus("saving");
    try {
      await saveCharacter(document);
      saving.current = false;
      if (queued.current) {
        queued.current = false;
        await flush();
      } else {
        setStatus("saved");
      }
    } catch {
      saving.current = false;
      queued.current = false;
      // The change is still in the page and still in `latest`, so the next
      // edit tries again. Nothing is lost by failing here.
      setStatus("failed");
    }
  }, []);

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
        setCharacter(loaded);
        setStatus("saved");
      } catch (err) {
        setProblem(err instanceof Error ? err.message : String(err));
      }
    })();
  }, [id]);

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

  return { character, status, problem, patch };
}
