# rpgcharactersheet

Character sheets for tabletop RPGs, editable during play.

A local server on this machine serves the sheet, with the character in SQLite,
so nothing about a character leaves the laptop. It began life as a published
Claude artifact; [ADR-0001](docs/adr/0001-local-server-and-sqlite.md) records
why it moved.

Currently one character: Moggle Fluff-a-kin, a grimalkin hunter in Dolmenwood.

## Layout

```
characters/<id>.json    one character, written by hand: the seed the database is imported from
src/systems/<system>/   the system rules: the tables, and what is computed from them
src/systems/<system>/page/  the system page: the components that draw a sheet
src/storage/            the database: every character, and every revision of one
src/characters/         reading a character file, and the fallback chain
src/import.ts           character file -> characters.db, once
src/server.ts           the local server: owns the database, serves the sheet
src/server/             the API, and serving the built page
src/sheet/              the page shell, the stylesheet, and the vendored fonts
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

The page makes no request outside this machine. The three fonts are vendored
into `src/sheet/fonts/` rather than loaded from Google, which is the same
promise ADR-0001 makes about the character data. See
[the licences](src/sheet/fonts/LICENSES.md).

## The system page

A system page plus a character makes a sheet. `src/systems/dolmenwood/page/`
holds the components that draw one, and they hold no character of their own:
every component takes the character and what the rules make of it.

Prose divides the same way. Text true of every grimalkin or every hunter is a
component. Text about one character is a note on that character, which is why
`kindred.tsx` describes wilder form but says nothing about which glamour this
particular cat rolled.

Sentences that are only sometimes true are computed rather than written down.
The warning that wilder form cannot be reached appears when maximum hit points
are below 3 and disappears when they are not, instead of sitting on the page
after it stops being true.

## Notes

Prose about one character is a note, and it lives on the character rather than
in the page. A note is an id, an anchor, a tone and a Markdown body.

The anchor decides where it renders. A rule anchor puts it beneath the rule it
qualifies, so a remark about wilder form sits under wilder form where it is
useful. A page anchor houses notes that qualify no rule. The anchors a
Dolmenwood sheet offers are listed in
`src/systems/dolmenwood/page/anchors.ts`, and a note whose anchor no longer
exists is collected at the bottom of the sheet rather than silently vanishing.

The tone is `plain`, `aside` or `warning`, and it is a field rather than
styling inside the sentence. Colouring a warning never means editing the prose,
which matters because these paragraphs are the ones most likely to be rewritten
later, by hand or by an agent.

Every note carries a stable, readable id, so revising one means replacing the
note with that id instead of adding a second copy of nearly the same paragraph.

Markdown is rendered by [snarkdown](https://github.com/developit/snarkdown), a
kilobyte of it. Inline code maps onto the dice-roll style the rest of the sheet
uses, so a backticked `2d6` needs no markup of its own. It does not sanitise
and does not need to: a note is the owner's prose, on the owner's machine, in
the owner's browser.

## Editing

Every change is written to the database about a second after you stop making
it. There is no save button, and the play tracker says whether the last change
is in yet.

Editing splits by how often you do it. The play tracker and the kit are always
live, because a toggle in front of your hit points is a toggle you would leave
on. Ability scores, the hit dice you rolled, and the name, alignment, age and
height sit behind **Edit details**, which is off when the page opens so that
scrolling on a phone cannot change a Constitution.

Kindred and class are fixed at creation and are never editable. Changing
either makes a different character, and the sheet would have no content to
draw for the new one.

## Looking back

Every save is a revision, so a character's past is already in the database.
The sheet can show the character as they last stood at each earlier level: the
whole sheet, read only. Click the level in the top line and pick one, or open
`/<id>?level=1`. While looking back the page is tinted, the play tracker reads
"read only", and **Back to now** sits where **Edit details** usually does.

A past level is the newest revision saved at that level, found by one query
over the change log. Nothing is stored for it, and a correction made later to
an earlier level becomes that level's state. See
[ADR-0003](docs/adr/0003-past-levels-are-read-from-the-log.md).

## The system rules

`src/systems/dolmenwood/` holds Dolmenwood's own tables and the values that
follow from them: saving throws, skill targets, attack bonus, magic resistance,
experience thresholds and the experience modifier, hit points per level, armour
class, the list of loadouts the kit allows, and Speed from slot encumbrance. Character in, computed values
out. Nothing in there reads the page or the character file.

Values are recorded or computed, never both. Ability scores and the hit die you
actually rolled at each level are recorded. Everything above is computed from
them, so changing your level moves all of it at once.

The tables are transcribed from the [online rules
reference](https://www.dolmenwood.necroticgnome.com/rules/), with the page id
noted above each one. A character's maximum level is the last row of the class
table; Dolmenwood kindreds carry no level limit of their own.

```
npm run check   type check, then the tests
npm test        the tests alone
```

Only the rules and the store are tested, and deliberately. A broken layout is
visible the moment the page opens; a saving throw one too high is not, and a
save that quietly drops a field is not either. The rules tests pin every number
Moggle's sheet showed when she was created, so a bad transcription fails here
rather than at the table.

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

## Build stamp

The page footer carries `Build <commit> · <date>`, and `+ uncommitted changes`
when the tree was dirty. The stamp uses the commit's date rather than today's,
so rebuilding the same commit gives the same stamp, and it ignores
`characters/`, because a character changing is play rather than an edit to the
sheet.

If the sheet ever looks wrong, read the stamp first. An old browser tab looks
identical to a fresh one and reports the build it was made from.

## Rules

Dolmenwood is published by Necrotic Gnome. Rules on the sheet are cited from the
[online rules reference](https://www.dolmenwood.necroticgnome.com/rules/).
