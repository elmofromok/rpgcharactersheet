# rpgcharactersheet

Character sheets served by a local Node server, with the character in SQLite,
so they can be edited during play and nothing leaves this machine.

## Running the local sheet

`npm run build && npm start` serves it on `127.0.0.1:4000` and opens a browser.
`npm run dev` serves it through Vite instead, with hot reload. `npm run check`
type checks and runs the tests.

The server owns the database. Do not read or write `characters.db` from
anywhere else while it is running.

## Character files

`characters/<id>.json` is one flat document: the character as written by hand.
There is no `start` block and no `state` block any more.

It is a seed. Import it once with `node src/import.ts <id>` and the database at
`characters.db` becomes where the character lives; the file goes stale from
that moment. A second import is refused, because the file would be older than
anything played since. `--force` overrides that and will lose play.

Only recorded values belong in the file: ability scores, the hit die actually
rolled at each level, the kit, the notes, and the play values. Anything the
rules can work out (saving throws, skill targets, attack bonus, maximum hit
points, armour class) is computed by `src/systems/<system>/rules.ts` and must
never be written down, or there will be two answers to the same question.

## Build stamp

Every build carries `Build <commit> · <date>` in the page footer, and
`+ uncommitted changes` when built from a dirty working tree. When the sheet
looks wrong, read that stamp before debugging: an old browser tab looks
identical to a current one and reports the build it was made from.

## Agent skills

### Issue tracker

GitHub Issues on `elmofromok/rpgcharactersheet`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, used unchanged. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
