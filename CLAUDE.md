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
2. Copy its `#state` block into the `state` field of `characters/<id>.json`
3. Commit, so the build stamp names a real commit rather than a dirty tree
4. `node build.mjs <id>`
5. Publish `dist/<id>.html` to that same artifact URL

Step 1 is the one that matters. Skipping it loses the user's play session.

## Character files

`start` is the character as created and does not change. It is also the
fallback the page uses for any field missing from a saved state, so an older
save picks up new fields instead of breaking. Never edit `start` to record
something that happened in play.

`state` is where the character is now: hit points, experience, gold, arrows,
the kit list, trophies, notes. The play tracker writes it.

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
