import { render } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";

import { Sheet } from "../systems/dolmenwood/page/sheet.tsx";
import type { LookingBack } from "../systems/dolmenwood/page/shared.ts";
import { useCharacter } from "./useCharacter.ts";
import "./style.css";

/** The path names the character, so a second one needs no new page code. */
function idFromPath(): string | null {
  return window.location.pathname.split("/").filter(Boolean)[0] ?? null;
}

/** `?level=1` names a past level to look back at. Anything else is now. */
function levelFromSearch(): number | null {
  const raw = new URLSearchParams(window.location.search).get("level");
  if (raw === null) return null;
  const level = Number(raw);
  return Number.isInteger(level) && level >= 1 ? level : null;
}

/**
 * The level in the URL, kept in step with the browser's own history, so the
 * back button leaves the past the way it was entered and a past level can be
 * bookmarked or sent.
 */
function useLevelParam(): [number | null, (level: number | null, replace?: boolean) => void] {
  const [level, setLevel] = useState(levelFromSearch);

  useEffect(() => {
    const onPop = () => setLevel(levelFromSearch());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // `replace` rewrites the current entry instead of adding one, for a URL
  // the page corrects rather than one the reader chose.
  const go = useCallback((next: number | null, replace = false) => {
    const url = new URL(window.location.href);
    if (next === null) url.searchParams.delete("level");
    else url.searchParams.set("level", String(next));
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
    setLevel(next);
  }, []);

  return [level, go];
}

function App() {
  const [level, go] = useLevelParam();
  const { character, status, problem, patch, levels, lookingAt, nowLevel } = useCharacter(
    idFromPath(),
    level,
  );
  const lookingBack = level !== null;

  // The live level is not a past one. A URL that names it, typed by hand or
  // kept from before, would draw the same sheet frozen, with nothing in the
  // level menu to call current. It is read as now instead.
  useEffect(() => {
    if (level !== null && nowLevel !== null && level === nowLevel) go(null, true);
  }, [level, nowLevel, go]);

  // On the root element, so the tint reaches the page background and not
  // only the sheet. See the looking-back palette in style.css.
  useEffect(() => {
    if (lookingBack) document.documentElement.dataset.lookingBack = "";
    else delete document.documentElement.dataset.lookingBack;
  }, [lookingBack]);

  if (problem) {
    return (
      <div class="problem">
        <p>{problem}</p>
        {lookingBack ? (
          <p>
            <a href={window.location.pathname}>Back to now</a>
          </p>
        ) : null}
      </div>
    );
  }
  // The live level arrives with the live character, before any past level
  // can be drawn, so both are missing only while loading.
  if (!character || nowLevel === null) {
    return (
      <div class="problem">
        <p>Reading the character…</p>
      </div>
    );
  }

  document.title = lookingAt ? `${character.name} · Level ${lookingAt.level}` : character.name;
  const history: LookingBack = {
    levels,
    at: lookingAt,
    nowLevel,
    go,
  };
  return <Sheet character={character} patch={patch} status={status} lookingBack={history} />;
}

const root = document.getElementById("sheet");
if (root) render(<App />, root);
