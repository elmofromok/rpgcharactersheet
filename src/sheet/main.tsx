import { render } from "preact";

import { Sheet } from "../systems/dolmenwood/page/sheet.tsx";
import { useCharacter } from "./useCharacter.ts";
import "./style.css";

/** The path names the character, so a second one needs no new page code. */
function idFromPath(): string | null {
  return window.location.pathname.split("/").filter(Boolean)[0] ?? null;
}

function App() {
  const { character, status, problem, patch } = useCharacter(idFromPath());

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
  return <Sheet character={character} patch={patch} status={status} />;
}

const root = document.getElementById("sheet");
if (root) render(<App />, root);
