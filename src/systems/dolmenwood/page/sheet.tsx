// A system page plus a character makes a sheet. This is the Dolmenwood one:
// it holds no character of its own, and every number it shows is computed.

import { characterClass, computed as compute, kindred } from "../rules.ts";
import type { CharacterDocument } from "../../../character.ts";
import { CLASS_PAGES } from "./class.tsx";
import { Kit } from "./kit.tsx";
import { KINDRED_PAGES } from "./kindred.tsx";
import { Abilities, Combat, Particulars, SavingThrows, Skills } from "./rail.tsx";
import { count, percent, type SheetProps } from "./shared.ts";
import { Tracker } from "./tracker.tsx";

function Divider({ flip }: { flip?: boolean }) {
  return (
    <svg class="divider ink" viewBox="0 0 400 26" aria-hidden="true" focusable="false">
      <path
        class="fine"
        d={
          flip
            ? "M6 13 C46 23 76 3 116 13 S176 23 200 13 S254 3 294 13 S354 23 394 13"
            : "M6 13 C46 3 76 23 116 13 S176 3 200 13 S254 23 294 13 S354 3 394 13"
        }
      />
      <path class="solid" d="M200 5 L206 13 L200 21 L194 13 Z" />
    </svg>
  );
}

function Masthead({ character, computed }: SheetProps) {
  const kin = kindred(character);
  const klass = characterClass(character);

  const facts: Array<[string, string]> = [
    ["Kindred", kin.name],
    ["Class", klass.name],
    ["Combat aptitude", klass.aptitude],
    ["Alignment", character.alignment],
    ["XP modifier", percent(computed.xpModifier)],
    ["Age", character.age],
    ["Height", character.height],
    ["Max level", String(computed.maxLevel)],
  ];

  return (
    <header class="masthead">
      <p class="eyebrow">
        Dolmenwood &middot; Level {character.level} &middot; {count(character.xp)} XP
      </p>
      <h1>{character.name}</h1>
      <div class="dramatis">
        {facts
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <span key={label}>
              {label} <b>{value}</b>
            </span>
          ))}
      </div>
    </header>
  );
}

function Unsupported({ what, name }: { what: string; name: string }) {
  return (
    <section class="card">
      <h2>{what}</h2>
      <p>
        This sheet has no page for the {what.toLowerCase()} <b>{name}</b>. Add one under{" "}
        <code>src/systems/dolmenwood/page/</code> before playing one.
      </p>
    </section>
  );
}

export function Sheet({ character }: { character: CharacterDocument }) {
  const computed = compute(character);
  const props: SheetProps = { character, computed };

  const KindredPage = KINDRED_PAGES[character.kindred.toLowerCase()];
  const ClassPage = CLASS_PAGES[character.class.toLowerCase()];

  return (
    <div class="sheet">
      <Masthead {...props} />
      <Divider />

      <div class="layout">
        <div class="left">
          <Tracker {...props} />
        </div>

        <div class="right">
          <div class="columns">
            <div class="rail">
              <Abilities {...props} />
              <Combat {...props} />
              <SavingThrows {...props} />
              <Skills {...props} />
              <Particulars {...props} />
            </div>

            <div class="main">
              <Kit {...props} />
              {KindredPage ? (
                <KindredPage {...props} />
              ) : (
                <Unsupported what="Kindred" name={character.kindred} />
              )}
              {ClassPage ? (
                <ClassPage {...props} />
              ) : (
                <Unsupported what="Class" name={character.class} />
              )}
            </div>
          </div>
        </div>
      </div>

      <Divider flip />

      <p class="colophon">
        Built from the{" "}
        <a href="https://www.dolmenwood.necroticgnome.com/rules/">
          Dolmenwood Online Rules Reference
        </a>{" "}
        (Necrotic Gnome). Every number on this sheet is worked out from {character.name}'s
        ability scores, hit dice and kit; nothing above is stored.
        <span class="build">{__BUILD_STAMP__}</span>
      </p>
    </div>
  );
}
