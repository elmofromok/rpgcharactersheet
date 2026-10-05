// A system page plus a character makes a sheet. This is the Dolmenwood one:
// it holds no character of its own, and every number it shows is computed.

import { useEffect, useRef, useState } from "preact/hooks";

import { characterClass, computed as compute, kindred } from "../rules.ts";
import type { CharacterDocument } from "../../../character.ts";
import type { Patch, SaveState } from "../../../sheet/useCharacter.ts";
import { CLASS_PAGES } from "./class.tsx";
import { Kit } from "./kit.tsx";
import { KINDRED_PAGES } from "./kindred.tsx";
import { ANCHORS } from "./anchors.ts";
import { NoteCard, Notes, NotesProvider, OrphanedNotes } from "./notes.tsx";
import { Abilities, Combat, Particulars, SavingThrows, Skills } from "./rail.tsx";
import { count, dayOf, percent, type LookingBack, type SheetProps } from "./shared.ts";
import { Tracker } from "./tracker.tsx";

const KNOWN_ANCHORS: readonly string[] = ANCHORS.map((anchor) => anchor.id);

function Divider({ flip }: { flip?: boolean }) {
  return (
    <svg class="divider ink" viewBox="0 0 400 26" aria-hidden="true" focusable="false">
      <path
        class="fine"
        d={
          flip
            ? "M6 13 C46 23 76 3 116 13 S176 23 200 13 S254 3 294 13 S354 23 394 13"
            : "M6 13 C46 3 76 23 116 13 S176 3 200 13 S254 23 294 13 S354 3 394 13"
        }
      />
      <path class="solid" d="M200 5 L206 13 L200 21 L194 13 Z" />
    </svg>
  );
}

/** Kindred and class are absent on purpose: changing either is a different
 * character, so they are fixed at creation and never offered here. */
const EDITABLE_FACTS: Array<[string, "alignment" | "age" | "height"]> = [
  ["Alignment", "alignment"],
  ["Age", "age"],
  ["Height", "height"],
];

/**
 * The level in the eyebrow. Once there is more than one level to choose from
 * it drops a list, one line per level with the day it closed; a fresh level 1
 * character sees plain text, exactly as before.
 */
function LevelControl({
  character,
  lookingBack,
}: {
  character: CharacterDocument;
  lookingBack: LookingBack;
}) {
  const { levels, at, nowLevel, go } = lookingBack;
  const menu = useRef<HTMLDetailsElement>(null);

  // A <details> does not close itself; a click anywhere else should close it.
  useEffect(() => {
    const away = (e: MouseEvent) => {
      const open = menu.current;
      if (open?.open && !open.contains(e.target as Node)) open.open = false;
    };
    document.addEventListener("click", away);
    return () => document.removeEventListener("click", away);
  }, []);

  if (levels.length < 2 && !at) return <>Level {character.level}</>;

  const highest = Math.max(nowLevel, ...levels.map((l) => l.level));
  const past = levels.filter((l) => l.level !== nowLevel).sort((a, b) => b.level - a.level);
  const choose = (level: number | null) => {
    if (menu.current) menu.current.open = false;
    go(level);
  };

  return (
    <details class="levels" ref={menu}>
      <summary title="Choose a level to look back at">
        Level {character.level}
        {at ? ` of ${highest}` : ""} <span aria-hidden="true">▾</span>
      </summary>
      <ul>
        <li>
          <button
            type="button"
            aria-current={at === null ? "true" : undefined}
            onClick={() => choose(null)}
          >
            <span>Now</span>
            <small>level {nowLevel}</small>
          </button>
        </li>
        {past.map((entry) => (
          <li key={entry.level}>
            <button
              type="button"
              aria-current={at?.level === entry.level ? "true" : undefined}
              onClick={() => choose(entry.level)}
            >
              <span>Level {entry.level}</span>
              <small>{dayOf(entry.writtenAt)}</small>
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}

function Masthead({
  character,
  computed,
  patch,
  editing,
  readOnly,
  lookingBack,
  onToggleEditing,
}: SheetProps & { lookingBack: LookingBack; onToggleEditing: () => void }) {
  const kin = kindred(character);
  const klass = characterClass(character);

  const fixed: Array<[string, string]> = [
    ["Kindred", kin.name],
    ["Class", klass.name],
    ["Combat aptitude", klass.aptitude],
    ["XP modifier", percent(computed.xpModifier)],
    ["Level", String(character.level)],
  ];

  return (
    <header class="masthead">
      <div class="masthead-top">
        <div class="eyebrow">
          Dolmenwood &middot; <LevelControl character={character} lookingBack={lookingBack} />{" "}
          &middot; {count(character.xp)} XP
          {lookingBack.at ? <> &middot; as of {dayOf(lookingBack.at.writtenAt)}</> : null}
        </div>
        {readOnly ? (
          // The way out sits where the way in was.
          <button type="button" class="act" onClick={() => lookingBack.go(null)}>
            Back to now
          </button>
        ) : (
          <button
            type="button"
            class="act"
            aria-pressed={editing}
            onClick={onToggleEditing}
          >
            {editing ? "Done editing" : "Edit details"}
          </button>
        )}
      </div>

      {editing ? (
        <input
          class="name"
          type="text"
          value={character.name}
          aria-label="Name"
          onInput={(e) => patch({ name: e.currentTarget.value })}
        />
      ) : (
        <h1>{character.name}</h1>
      )}

      <div class="dramatis">
        {fixed
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <span key={label}>
              {label} <b>{value}</b>
            </span>
          ))}
        {EDITABLE_FACTS.map(([label, field]) =>
          editing ? (
            <span key={label}>
              {label}{" "}
              <input
                type="text"
                class="fact"
                value={character[field]}
                aria-label={label}
                onInput={(e) => patch({ [field]: e.currentTarget.value })}
              />
            </span>
          ) : character[field] ? (
            <span key={label}>
              {label} <b>{character[field]}</b>
            </span>
          ) : null,
        )}
      </div>

      {editing ? (
        <p class="note">
          Kindred and class are fixed at creation: changing either makes a different character.
          Everything else on the sheet follows from the scores, the hit dice and the kit.
        </p>
      ) : null}
    </header>
  );
}

function Unsupported({ what, name }: { what: string; name: string }) {
  return (
    <section class="card">
      <h2>{what}</h2>
      <p>
        This sheet has no page for the {what.toLowerCase()} <b>{name}</b>. Add one under{" "}
        <code>src/systems/dolmenwood/page/</code> before playing one.
      </p>
    </section>
  );
}

export function Sheet({
  character,
  patch,
  status,
  lookingBack,
}: {
  character: CharacterDocument;
  patch: Patch;
  status: SaveState;
  lookingBack: LookingBack;
}) {
  // Off by default, so scrolling on a phone cannot change a Constitution.
  const [editingOn, setEditing] = useState(false);
  // A past level is drawn under a lock, and editing is never on beside it.
  const readOnly = lookingBack.at !== null;
  const editing = editingOn && !readOnly;
  const computed = compute(character);
  const props: SheetProps = { character, computed, patch, editing, readOnly, status };

  const KindredPage = KINDRED_PAGES[character.kindred.toLowerCase()];
  const ClassPage = CLASS_PAGES[character.class.toLowerCase()];

  return (
    <NotesProvider value={{ notes: character.notes, editing, patch }}>
      <div class={readOnly ? "sheet looking-back" : "sheet"}>
        <Masthead
          {...props}
          lookingBack={lookingBack}
          onToggleEditing={() => setEditing((on) => !on)}
        />
        <Notes at="page.top" />
        <Divider />

        {/* A past level is drawn under a lock: one disabled fieldset around
            everything below the masthead, so every control in it, present or
            future, is dead without being told. The masthead stays live for
            the way back. */}
        <fieldset class="layout" disabled={readOnly}>
          <div class="left">
            <Tracker {...props} />
          </div>

          <div class="right">
            <div class="columns">
              <div class="rail">
                <Abilities {...props} />
                <Combat {...props} />
                <SavingThrows {...props} />
                <Skills {...props} />
                <Particulars {...props} />
              </div>

              <div class="main">
                <Kit {...props} />
                {KindredPage ? (
                  <KindredPage {...props} />
                ) : (
                  <Unsupported what="Kindred" name={character.kindred} />
                )}
                {ClassPage ? (
                  <ClassPage {...props} />
                ) : (
                  <Unsupported what="Class" name={character.class} />
                )}

                <NoteCard at="page.appearance" title="Appearance and bearing" />

                <OrphanedNotes known={KNOWN_ANCHORS} />
              </div>
            </div>
          </div>
        </fieldset>

        <Divider flip />

        <p class="colophon">
          Built from the{" "}
          <a href="https://www.dolmenwood.necroticgnome.com/rules/">
            Dolmenwood Online Rules Reference
          </a>{" "}
          (Necrotic Gnome). Every number on this sheet is worked out from {character.name}'s
          ability scores, hit dice and kit; nothing above is stored.
          <span class="build">{__BUILD_STAMP__}</span>
        </p>
      </div>
    </NotesProvider>
  );
}
