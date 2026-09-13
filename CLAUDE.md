# rpgcharactersheet

Character sheets built as self-contained HTML pages and published as Claude
artifacts, so they can be edited during play.

## Publishing a sheet

The published page saves itself by republishing its entire document, state
block included. The live artifact therefore holds play state that this repo
does not, and publishing without reading the artifact first silently reverts
whatever happened at the table. This has nearly gone wrong several times.

Always, in this order:

1. Read the live artifact: the `Artifact` tool with `action: "read"` and the
   `artifact` URL from `characters/<id>.json`
2. Copy its `#state` values onto the matching top-level fields of
   `characters/<id>.json`. They are the same names, with two exceptions: the
   block's `notes` is the file's `journal`, and its `hpMax` is dropped, because
   maximum hit points are now computed from `hitDice` and Constitution
3. Commit, so the build stamp names a real commit rather than a dirty tree
4. `node build.mjs <id>`
5. Publish `dist/<id>.html` to that same artifact URL

Step 1 is the one that matters. Skipping it loses the user's play session.

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
`+ uncommitted changes` when built from a dirty working tree. When a published
sheet looks wrong, read that stamp before debugging: an old browser tab looks
identical to a current one and reports the build it was made from.

## Agent skills

### Issue tracker

GitHub Issues on `elmofromok/rpgcharactersheet`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, used unchanged. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
