# Context

The words this project uses, and what each one means. Terms only. No
decisions, no implementation notes.

## The artefacts

**Sheet**
: The page a player reads and edits at the table. One sheet shows one
  character.

**Database**
: `characters.db`, a SQLite file on this machine. Where every character
  lives. The sheet reads it when it opens and writes it back as you play.

**Character file**
: `characters/<id>.json`. A character written by hand, imported into the
  database once. It is a starting point, not a copy of the character. Once
  imported it goes stale and stops mattering.

**Change log**
: The table in the database that keeps every edit with the time it happened.
  Nothing overwrites it, so any past state of a character can be read back.

**Revision**
: One saved version of one character, numbered in the order it was written and
  never altered afterwards. A character's newest revision is that character as
  it stands now, so the change log and the character are the same thing.

**System page**
: The components that draw a sheet for one game system, holding no character
  of their own. A system page plus a character makes a sheet.

**System rules**
: Dolmenwood's own tables and traits, the parts that are true for every
  character rather than for one. Experience thresholds, saving throw
  progressions, default skill targets, what a grimalkin can do.

**Server**
: The local program that serves the sheet and reads and writes character
  files. It runs on this machine only. Nothing about this project leaves the
  laptop.

**Build stamp**
: The commit and date printed in the sheet footer. Identifies which build a
  browser tab is showing, so a tab left open overnight can be told from a
  fresh one.

## Values

**Recorded value**
: A value stored in the character file because it cannot be worked out. A
  rolled hit die, an ability score.

**Computed value**
: A value the sheet works out from other values. A saving throw from class and
  level. Armour class from the kit.

Every number on the sheet is one or the other. Nothing is both.

## Play

**Play tracker**
: The panel in the left column, holding the values that move most during a
  session. Not the only editable part of the sheet, just the busiest.

**Kit**
: What the character carries. A list of items, each with a name and a free
  note. Editable on the sheet, unlike the rest of the character.

**Loadout**
: One allowed combination of items held at the same time. The shortbow needs
  two hands and the shield needs an arm, so bow-and-shield is not a loadout.
  Each loadout has its own armour class.

**Trophy**
: Something taken from a kill. Grants combat bonuses later.

**Note**
: A piece of prose written about one character, stored in the character file.
  Written in Markdown. Carries a tone, which decides whether it reads as a
  warning or a quiet aside. Prose that is true of every grimalkin or every
  hunter is not a note; that belongs to the system rules.

**Anchor**
: The named place on the sheet where a note attaches. A rule anchor puts the
  note directly beneath the rule it qualifies. A page anchor holds notes that
  qualify no rule.

## Dolmenwood terms

**Kindred**
: What the character is. Moggle is a grimalkin.

**Class**
: What the character does. Moggle is a hunter.

**Fixed at creation**
: A field that cannot change once the character exists. Kindred and class. To
  change one is to make a different character, not to edit this one.

**Prime ability**
: An ability that sets the character's experience modifier. Constitution is
  one of the hunter's.
