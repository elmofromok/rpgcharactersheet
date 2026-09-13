import { render } from "preact";
import { useEffect, useState } from "preact/hooks";

import type { CharacterDocument } from "../character.ts";
import { Sheet } from "../systems/dolmenwood/page/sheet.tsx";
import { fetchCharacter, listCharacters } from "./api.ts";
import "./style.css";

/** The path names the character, so a second one needs no new page code. */
function idFromPath(): string | null {
  return window.location.pathname.split("/").filter(Boolean)[0] ?? null;
}

function App() {
  const [character, setCharacter] = useState<CharacterDocument | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const id = idFromPath() ?? (await listCharacters())[0]?.id;
        if (!id) {
          setProblem("No characters in the database yet. Import one: npm run import");
          return;
        }
        setCharacter(await fetchCharacter(id));
      } catch (err) {
        setProblem(err instanceof Error ? err.message : String(err));
      }
    })();
  }, []);

  if (problem) {
    return (
      <div class="problem">
        <p>{problem}</p>
      </div>
    );
  }
  if (!character) {
    return (
      <div class="problem">
        <p>Reading the character…</p>
      </div>
    );
  }

  document.title = character.name;
  return <Sheet character={character} />;
}

const root = document.getElementById("sheet");
if (root) render(<App />, root);
