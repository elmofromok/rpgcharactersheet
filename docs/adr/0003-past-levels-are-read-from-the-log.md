# Past levels are read from the change log, not stored

A player wants to see their character as they stood at each earlier level,
the whole sheet, read only. The database already holds every revision ever
saved, so a past level is derived: the newest revision whose document is at
that level. Nothing new is written when a level closes, and nothing new is
written when a past level is looked at.

## Considered options

**A snapshot written at level-up.** A row, or a flag on a row, that says "this
is level 1, finished". The obvious shape, and the one the request was phrased
in. Rejected for two reasons. It is a second place for a fact the log already
holds, which ADR-0002 exists to avoid. And it is wrong the first time a past
level is corrected after the fact: Moggle's level 1 hit die was fixed weeks
after she reached level 2, and the corrected row is the one that should show
as her level 1, which a snapshot taken at the time would not know.

**One document per level.** The character as a list of level documents, each
complete. Rejected because almost nothing about a character changes with
level. Name, kindred, abilities, kit and notes would be copied up to fifteen
times, and a change to any of them would have to decide which copies it
applies to.

**A Level up action that writes the die, the level and the XP in one
revision.** Not rejected, but not needed for this. It makes the boundary
between levels a single deliberate row instead of three stepper clicks, and
it can be added later without changing how past levels are found.

## Consequences

"The character at level 1" means "the character as last saved at level 1".
A correction made later becomes that level's state, which is what is wanted.
Stepping the level down by accident and back up moves which row counts as
level 1 to the newer one; nothing is lost, because every row stays, but the
pointer has moved. The Level up action above would make that rarer.

Finding the levels is one query over the existing table, grouping revisions
by the level in their document. No schema change, no migration.

The past-level view draws with the same components as the live sheet, under a
read-only lock. There is no second renderer to keep in step.
