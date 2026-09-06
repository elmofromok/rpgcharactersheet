# rpgcharactersheet

Character sheets for tabletop RPGs, built as single self-contained HTML pages
and published as Claude artifacts so they can be edited during play.

Currently one character: Moggle Fluff-a-kin, a grimalkin hunter in Dolmenwood.

## Layout

```
characters/<id>.json    one character: who they are, and where their numbers are now
sheet/<system>.html     the page: markup, styles, and the play tracker script
build.mjs               character + template -> dist/<id>.html
dist/                   build output, not committed
```

## Build

```
node build.mjs                     every character
node build.mjs moggle-fluff-a-kin  one
```

No dependencies. Node 18 or later.

Commit before you build. The page footer carries a build stamp naming the
commit it came from, so a build from a dirty tree is labelled
`+ uncommitted changes` on the published sheet. The stamp uses the commit's
date rather than today's, so rebuilding the same commit gives the same stamp.

The output in `dist/` is the page body, with no `<html>` or `<body>` wrapper,
because that is what the Claude artifact publisher expects. It gets published
to the URL in the character's `artifact` field.

## A character file

Two blocks of numbers, and they mean different things.

`start` is the character as created and does not change. Moggle began with 7 gp
and thirteen items. It is also the fallback the page uses for any field missing
from a saved state, so an older save picks up new fields instead of breaking.

`state` is where the character is now. The play tracker writes this, so it moves
during a session: hit points, experience, gold, arrows, the kit list, trophies,
notes.

## The part that is not solved yet

The published page saves by republishing its own entire document, state block
included. So the same numbers live in two places: this repo, and the live
artifact. They drift the moment anyone plays.

Until that is fixed, publishing follows this order, and skipping the first step
silently reverts whatever happened at the table:

1. Read the live artifact and copy its state block into `characters/<id>.json`
2. Commit
3. `node build.mjs <id>`
4. Publish `dist/<id>.html` to the artifact URL

If a published sheet ever looks wrong, read the build stamp in its footer
first. It names the commit, and an old browser tab reports the build it was
made from even after a session of saving itself.

The fix is to move play state into the artifact's own database, so the page
holds only the interface and publishing cannot touch the numbers. Not done yet.

## Rules

Dolmenwood is published by Necrotic Gnome. Rules on the sheet are cited from the
[online rules reference](https://www.dolmenwood.necroticgnome.com/rules/).
