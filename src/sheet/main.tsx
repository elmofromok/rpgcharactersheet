// Provisional. This renders enough of a character to prove the whole path
// works: the server hands over a document, the browser runs the same rules
// module the tests run, and every number below is computed rather than
// stored. The real sheet replaces it in the next slice of #1.

import { render } from "preact";
import { useEffect, useState } from "preact/hooks";

import type { CharacterDocument } from "../character.ts";
import { computed } from "../systems/dolmenwood/rules.ts";
import { fetchCharacter, listCharacters } from "./api.ts";

function idFromPath(): string | null {
  const first = window.location.pathname.split("/").filter(Boolean)[0];
  return first ?? null;
}

function Sheet({ character }: { character: CharacterDocument }) {
  const c = computed(character);

  return (
    <main>
      <h1>{character.name}</h1>
      <p>
        {character.kindred} {character.class}, level {character.level}
      </p>

      <dl>
        <dt>Hit points</dt>
        <dd>
          {character.hp} / {c.maxHitPoints}
        </dd>

        <dt>Armour class</dt>
        <dd>
          {c.loadouts
            .map((l) => `${l.held.join(" and ") || "empty-handed"} ${l.armourClass}`)
            .join(", ")}
        </dd>

        <dt>Attack</dt>
        <dd>
          melee +{c.attack.melee}, missile +{c.attack.missile}
        </dd>

        <dt>Saving throws</dt>
        <dd>
          {Object.entries(c.saves)
            .map(([kind, target]) => `${kind} ${target}`)
            .join(", ")}
        </dd>

        <dt>Skills</dt>
        <dd>
          {Object.entries(c.skills)
            .map(([skill, { target }]) => `${skill} ${target}`)
            .join(", ")}
        </dd>

        <dt>Experience</dt>
        <dd>
          {character.xp} banked
          {c.xpToNextLevel === null
            ? ", at maximum level"
            : `, ${c.xpToNextLevel} more awarded for level ${character.level + 1}`}
        </dd>
      </dl>

      <p>
        <small>
          Every number here is computed from {character.kit.length} kit items, the hit dice
          actually rolled, and the ability scores. Nothing above is stored.
        </small>
      </p>
    </main>
  );
}

function App() {
  const [character, setCharacter] = useState<CharacterDocument | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const wanted = idFromPath();
        const id = wanted ?? (await listCharacters())[0]?.id;
        if (!id) {
          setProblem("No characters yet. Import one with: npm run import");
          return;
        }
        setCharacter(await fetchCharacter(id));
      } catch (err) {
        setProblem(err instanceof Error ? err.message : String(err));
      }
    })();
  }, []);

  if (problem) return <p>{problem}</p>;
  if (!character) return <p>Reading the character…</p>;
  return <Sheet character={character} />;
}

const root = document.getElementById("sheet");
if (root) render(<App />, root);
