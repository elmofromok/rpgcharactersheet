# The change log is the store

The database has one table. A character is its change log, and the character as
it stands now is the newest row of that log. There is no separate table holding
the current version.

## Considered options

**A `characters` table beside a `revisions` table.** The obvious shape, and what
"store the character, and also log the change" reads like. Rejected because the
current document would then exist twice, and two copies of one fact can
disagree. Keeping them in step needs a transaction around every save and a
reader who remembers why. The bug this project is being rebuilt to escape is
exactly that shape: play state lived in the published artifact and in the repo
at once, and they drifted the moment anyone played.

**Field-level diffs in the log.** Smaller rows, and it makes the log read like a
history of what changed rather than a stack of snapshots. Rejected because
restoring a past state would mean replaying every diff from the beginning, and
because a character is about three kilobytes. A thousand saves is three
megabytes, which is not worth a replay engine.

## Consequences

A save is one `INSERT`. Nothing to wrap in a transaction, and no window in
which a crash leaves a half-written character, because there is no second write
to lose.

Reading the current character costs an index lookup for the highest revision of
one id rather than a primary key hit. At this size that difference is not
measurable.

A character cannot exist with no revisions. Creating one and saving one are the
same act, which suits a project where characters arrive by import rather than
through a creation screen.

The log is the only thing to back up, and the only thing to corrupt.
