// Prose about one character, attached to the rule it qualifies.
//
// The tone is a field rather than styling inside the sentence, so colouring a
// warning red never means editing the prose. That matters because these are
// the paragraphs most likely to be rewritten later, by hand or by an agent,
// and a rewrite should not have to preserve markup it did not intend.

import { createContext } from "preact";
import { useContext } from "preact/hooks";

import type { Note } from "../../../character.ts";
import { markdown } from "../../../sheet/markdown.ts";
import type { Patch } from "../../../sheet/useCharacter.ts";
import { ANCHOR_LABELS, type AnchorId } from "./anchors.ts";

type NotesApi = {
  notes: Note[];
  editing: boolean;
  patch: Patch;
};

const NotesContext = createContext<NotesApi | null>(null);

export function NotesProvider({
  value,
  children,
}: {
  value: NotesApi;
  children: preact.ComponentChildren;
}) {
  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

const TONES: Array<Note["tone"]> = ["plain", "aside", "warning"];

/**
 * Stable, and readable enough to name in a conversation. An agent asked to
 * revise a note replaces the one with this id instead of adding a second copy
 * of nearly the same paragraph.
 */
function newId(anchor: string): string {
  const stem = anchor.replace(/[^a-z0-9]+/gi, "-");
  const random = Math.random().toString(36).slice(2, 6);
  return `${stem}-${random}`;
}

function Body({ note }: { note: Note }) {
  return (
    <div
      class={`note-card tone-${note.tone}`}
      // The note is the owner's own prose. See src/sheet/markdown.ts.
      dangerouslySetInnerHTML={{ __html: markdown(note.body) }}
    />
  );
}

function Editor({ note, api }: { note: Note; api: NotesApi }) {
  const change = (fields: Partial<Note>) => {
    api.patch({
      notes: api.notes.map((n) => (n.id === note.id ? { ...n, ...fields } : n)),
    });
  };

  return (
    <div class={`note-card note-editing tone-${note.tone}`}>
      <textarea
        value={note.body}
        placeholder="Markdown. Backticks make a dice roll."
        aria-label={`note on ${ANCHOR_LABELS[note.anchor] ?? note.anchor}`}
        onInput={(e) => change({ body: e.currentTarget.value })}
      />
      <div class="note-controls">
        <span class="note-id">{note.id}</span>
        {TONES.map((tone) => (
          <button
            key={tone}
            type="button"
            class="act"
            aria-pressed={note.tone === tone}
            onClick={() => change({ tone })}
          >
            {tone}
          </button>
        ))}
        <button
          type="button"
          class="act drop-note"
          onClick={() => api.patch({ notes: api.notes.filter((n) => n.id !== note.id) })}
        >
          remove
        </button>
      </div>
    </div>
  );
}

/** Every note attached here, plus a way to add one while editing. */
export function Notes({ at }: { at: AnchorId }) {
  const api = useContext(NotesContext);
  if (!api) return null;

  const mine = api.notes.filter((note) => note.anchor === at);
  if (!api.editing && mine.length === 0) return null;

  const add = () => {
    api.patch({
      notes: [...api.notes, { id: newId(at), anchor: at, tone: "plain", body: "" }],
    });
  };

  return (
    <div class="notes">
      {mine.map((note) =>
        api.editing ? <Editor key={note.id} note={note} api={api} /> : <Body key={note.id} note={note} />,
      )}
      {api.editing ? (
        <button type="button" class="act add-note" onClick={add}>
          + note on {ANCHOR_LABELS[at] ?? at}
        </button>
      ) : null}
    </div>
  );
}

/** A card that exists only to house notes, and is absent when it has none. */
export function NoteCard({ at, title }: { at: AnchorId; title: string }) {
  const api = useContext(NotesContext);
  if (!api) return null;
  if (!api.editing && !api.notes.some((note) => note.anchor === at)) return null;

  return (
    <section class="card">
      <h2>{title}</h2>
      <Notes at={at} />
    </section>
  );
}

/**
 * Notes whose anchor no longer exists on the page. Without this they would
 * simply stop rendering, and prose would disappear with no sign of why.
 */
export function OrphanedNotes({ known }: { known: readonly string[] }) {
  const api = useContext(NotesContext);
  if (!api) return null;

  const orphans = api.notes.filter((note) => !known.includes(note.anchor));
  if (orphans.length === 0) return null;

  return (
    <section class="card">
      <h2>Notes with nowhere to go</h2>
      <p class="note">
        These are attached to anchors this sheet no longer has. Nothing is lost; they need
        re-attaching, which for now means editing the character.
      </p>
      {orphans.map((note) => (
        <div key={note.id}>
          <p class="note-id">
            {note.id} &middot; {note.anchor}
          </p>
          <Body note={note} />
        </div>
      ))}
    </section>
  );
}
