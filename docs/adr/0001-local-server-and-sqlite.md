# Sheets run on a local server, with SQLite

Character sheets were published as Claude artifacts, and a published sheet
saved play state by republishing its own document. That made every rebuild a
chance to overwrite a session, and it put the character's data on Anthropic's
servers. Sheets now run from a local Node server on this machine, and
characters live in a SQLite database at `characters.db`.

## Considered options

**Keep publishing to an artifact, and move play state into the artifact
database.** This fixes the overwrite risk and keeps the sheet reachable from
any device with no setup. Rejected because the data still lives on Anthropic's
servers rather than on this disk.

**A local server writing JSON files.** This keeps characters readable and
diffable in git. Rejected in favour of SQLite for two reasons: transactions, so
a crash mid-save cannot leave a half-written character, and a change log table
that records every edit without anyone remembering to commit.

## Consequences

You run a command before you play. The sheet no longer opens on a phone unless
both devices share a network, and you can no longer show it to anyone by
sending a link.

`build.mjs`, the republish save inside the page, and the read-the-artifact-first
publishing procedure all go away, along with the risk they existed to manage.

Character history stops being something you have to remember to commit. It is a
table.
