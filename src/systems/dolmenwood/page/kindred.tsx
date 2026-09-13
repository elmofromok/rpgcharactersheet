// What a grimalkin is. True of every grimalkin, which is why it lives here as
// a component rather than in the character.
//
// Which glamour a cat rolled is recorded on the character; what that glamour
// does is system content, so it comes out of the table below rather than
// being written into this file.

import { sign, type SheetProps } from "./shared.ts";
import { kindred } from "../rules.ts";
import type { JSX } from "preact";

function Grimalkin({ character, computed }: SheetProps): JSX.Element {
  const kin = kindred(character);
  // "Below half" of a small maximum rounds down to nothing. The sentence only
  // belongs on the page while that is true, so it is computed rather than
  // written down and left to go stale.
  const wilderOutOfReach = computed.maxHitPoints < 3;

  return (
    <section class="card">
      <h2>What a grimalkin is</h2>

      <p class="dropcap" style="margin-bottom:18px">
        A fairy cat wearing a small humanoid shape. You stand about three feet tall, you are
        immortal in the sense that nothing natural will kill you, and no ordinary disease can
        touch you. You are also small enough that most of the woods is Large, which is why your
        armour class improves by {sign(kin.acVersusLarge)} against big things in melee.
      </p>

      <div class="entry">
        <span class="tag">Chester form</span>
        <h3>Turn into a fat house cat</h3>
        <p>
          No limit on how often. In this shape you have AC 12 and attacks that do 1 point of
          damage each. You cannot use weapons, glamours, or class skills while you are a cat, and
          you can only shift back when nothing sentient is watching. It is a scouting and hiding
          tool, not a combat one.
        </p>
      </div>

      <div class="entry">
        <span class="tag">Wilder form</span>
        <h3>Once a day, when you are nearly dead</h3>
        <p>
          Available only when you drop below half your hit points. You heal{" "}
          <span class="roll">2d6</span> immediately, get AC 13, a +2 attack bonus and 1d4 damage,
          and it lasts <span class="roll">2d4</span> rounds. The catch is that you cannot tell
          friend from enemy. Warn the party before you use it.
        </p>
        {wilderOutOfReach ? (
          <p class="note" style="color:var(--warn)">
            On {computed.maxHitPoints} maximum hit points you cannot reach the trigger. Half of{" "}
            {computed.maxHitPoints} is {computed.maxHitPoints / 2}, so below half means 0, and 0
            is dead. Ask your referee whether they will read the trigger as 1 hit point or fewer.
          </p>
        ) : null}
      </div>

      <div class="entry">
        <span class="tag">Magic resistance</span>
        <h3>Fairies shrug off spells</h3>
        <p>
          {sign(kin.magicResistance)} as a being of Fairy, before your Wisdom is counted. Yours
          comes to {sign(computed.magicResistance)} on any saving throw against a magical effect.
        </p>
      </div>

      {computed.glamour ? (
        <div class="entry">
          <span class="tag">Glamour</span>
          <h3>{computed.glamour.name}</h3>
          <p>{computed.glamour.description}</p>
          <p style="margin-top:8px">
            It lasts <span class="roll">{computed.glamour.duration}</span>. You may glamour{" "}
            <b>
              {computed.glamour.coinsPerLevel} coins per day per level, so{" "}
              {computed.glamourCoinCap} a day at level {character.level}
            </b>
            .
          </p>
          <p style="margin-top:8px">
            Like every glamour it needs no words or gestures, cannot be disrupted, and costs
            your action for the round.
          </p>
        </div>
      ) : null}

      <div class="entry">
        <span class="tag">Odds and ends</span>
        <h3>Cold iron, and giant rats</h3>
        <p>
          Cold iron weapons do {kin.coldIronExtraDamage} extra damage to you, which on a
          grimalkin's hit points is a genuine threat rather than a footnote. On the other side of
          the ledger: eat a giant rodent over the course of a turn and you get a hit point back.
          It is not dignified. Take it anyway.
        </p>
      </div>
    </section>
  );
}

/**
 * One component per kindred. A kindred with no page here has no content to
 * draw, which is why kindred is fixed at creation rather than chosen from a
 * list that could offer an empty card.
 */
export const KINDRED_PAGES: Record<string, (props: SheetProps) => JSX.Element> = {
  grimalkin: Grimalkin,
};
