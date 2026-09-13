# rpgcharactersheet

Character sheets for tabletop RPGs, editable during play.

The sheet is moving from a published Claude artifact to a local server with
the character in SQLite, so nothing about a character leaves this machine. See
[ADR-0001](docs/adr/0001-local-server-and-sqlite.md). Both exist at the moment:
the artifact is still the one you play from, and the local sheet is being
written.

Currently one character: Moggle Fluff-a-kin, a grimalkin hunter in Dolmenwood.

## Layout

```
characters/<id>.json    one character, written by hand: the seed the database is imported from
sheet/<system>.html     the page: markup, styles, and the play tracker script
src/systems/<system>/   the system rules: the tables, and what is computed from them
src/storage/            the database: every character, and every revision of one
src/characters/         reading a character file, and the fallback chain
src/import.ts           character file -> characters.db, once
src/server.ts           the local server: owns the database, serves the sheet
src/server/             the API, and serving the built page
src/sheet/              the page itself, in TypeScript and Preact
build.mjs               character + template -> dist/<id>.html, for the artifact
dist/                   build output, not committed
```

## Running it

```
npm run build   build the sheet
npm start       serve it, and open a browser
npm run dev     serve it through Vite instead, with hot reload
```

The server listens on `127.0.0.1:4000` and nowhere else. `PORT=4001 npm start`
moves it. Stop it with ctrl-c.

In dev, Vite runs as middleware inside the same server rather than on a port of
its own, so the page and the API share one origin. There is no proxy to
configure, and an edit to `src/sheet/` shows in the browser without a rebuild.

Node 23.6 or later, which is what strips the types out of `src/` without a
build step. TypeScript and Vite are dev dependencies; Preact is the only thing
that ships.

## The system rules

`src/systems/dolmenwood/` holds Dolmenwood's own tables and the values that
follow from them: saving throws, skill targets, attack bonus, magic resistance,
experience thresholds and the experience modifier, hit points per level, armour
class, and the list of loadouts the kit allows. Character in, computed values
out. Nothing in there reads the page or the character file.

Values are recorded or computed, never both. Ability scores and the hit die you
actually rolled at each level are recorded. Everything above is computed from
them, so changing your level moves all of it at once.

The tables are transcribed from the [online rules
reference](https://www.dolmenwood.necroticgnome.com/rules/), with the page id
noted above each one. One number is not: the grimalkin maximum level of 14 is
carried over from the sheet this project started from, because the kindred page
does not state it.

```
npm run check   type check, then the tests
npm test        the tests alone
```

Only the rules and the store are tested, and deliberately. A broken layout is
visible the moment the page opens; a saving throw one too high is not, and a
save that quietly drops a field is not either. The rules tests pin every number
the published sheet currently shows, so a bad transcription fails here rather
than at the table.

## The database

`characters.db`, a SQLite file on this machine, through Node's built-in SQLite
module. One table. A save inserts a row and never updates or deletes one, so a
character is its own change log and any past state can be read back by revision
number. See [ADR-0002](docs/adr/0002-the-change-log-is-the-store.md) for why
there is no separate table holding the current version.

The file is not committed. It is play state, and ADR-0001 chose a change log
over git history exactly so that nobody has to remember to commit it.

## A character file

One flat document. No `start` block, no `state` block, and nothing in it that
the rules can work out for themselves.

It is a seed, not a copy of the character. Write one by hand, import it once,
and the database takes over:

```
node src/import.ts moggle-fluff-a-kin   one character
node src/import.ts                      every character file
```

A second import of a character already in the database is refused, because the
file is older than anything played since. `--force` overrides it and will lose
play.

Only `id`, `name`, `system`, `kindred`, `class` and `abilities` are required.
Everything else falls back: a field missing from a saved character comes from
its file, and a field missing from the file comes from the system defaults.
That chain is what lets a character saved before a field existed pick the field
up instead of breaking, and it is why the old `start` block is gone.

## The part that is not solved yet

The published page saves by republishing its own entire document, state block
included. So the same numbers live in two places: this repo, and the live
artifact. They drift the moment anyone plays.

Until the local sheet replaces it, the artifact is still the one you play
from, and it is built by `build.mjs` rather than by Vite:

```
node build.mjs                     every character
node build.mjs moggle-fluff-a-kin  one
```

Commit before you build. The page footer carries a build stamp naming the
commit it came from, so a build from a dirty tree is labelled
`+ uncommitted changes` on the published sheet. The stamp uses the commit's
date rather than today's, so rebuilding the same commit gives the same stamp.

The output in `dist/` is the page body, with no `<html>` or `<body>` wrapper,
because that is what the Claude artifact publisher expects. `build.mjs` is
transitional: characters are flat documents whose numbers are computed, but
the published page still wants the old play-state block, so the build projects
one onto the other. It goes when the artifact does.

Publishing follows this order, and skipping the first step silently reverts
whatever happened at the table:

1. Read the live artifact and copy its state block onto the matching top-level
   fields of `characters/<id>.json`. Same names, except that the block's
   `notes` is the file's `journal`, and its `hpMax` is dropped because maximum
   hit points are computed now
2. Commit
3. `node build.mjs <id>`
4. Publish `dist/<id>.html` to the artifact URL

If a published sheet ever looks wrong, read the build stamp in its footer
first. It names the commit, and an old browser tab reports the build it was
made from even after a session of saving itself.

The rules, the database, the import and the server all exist now. What is left
is the page: the sheet itself still has to be written against them, which is
the rest of issue #1. Until it is, the procedure above is the real one.

## Rules

Dolmenwood is published by Necrotic Gnome. Rules on the sheet are cited from the
[online rules reference](https://www.dolmenwood.necroticgnome.com/rules/).
