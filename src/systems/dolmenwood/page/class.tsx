// What a hunter does. True of every hunter; anything true only of this one
// belongs to the character as a note.

import type { JSX } from "preact";

import { characterClass, xpThreshold } from "../rules.ts";
import { count, percent, sign, type SheetProps } from "./shared.ts";

function Hunter({ character, computed }: SheetProps): JSX.Element {
  const hunter = characterClass(character);
  const nextLevel = character.level + 1;
  const nextThreshold = xpThreshold(character, nextLevel);

  return (
    <section class="card">
      <h2>What a hunter does</h2>

      <div class="entry">
        <span class="tag">Combat aptitude: {hunter.aptitude.toLowerCase()}</span>
        <h3>You fight. You do not cast.</h3>
        <p>
          The book files the hunter under {hunter.aptitude.toLowerCase()}, the same bracket as the
          fighter and the knight. That is why you start on a +1 attack bonus while a thief or a
          magician starts on +0, and why you may carry any weapon that is not Large. Nothing in
          your class advancement is spellcasting; any magic you have comes from your kindred.
        </p>
        {nextThreshold !== null && computed.xpToNextLevel !== null ? (
          <p style="margin-top:8px">
            Level {nextLevel} costs {count(nextThreshold)} XP. At {percent(computed.xpModifier)}{" "}
            that means {count(computed.xpToNextLevel)} awarded before it lands.
          </p>
        ) : (
          <p style="margin-top:8px">You are at the maximum level a grimalkin reaches.</p>
        )}
      </div>

      <div class="entry">
        <span class="tag">Animal companion</span>
        <h3>Bond with a beast</h3>
        <p>
          Make a Charisma check to win an animal over: roll d6, add your Charisma modifier, and
          you need 4 or more. Yours is {sign(computed.abilityModifiers.cha)}. One companion at a
          time, and it is loyal.
        </p>
      </div>

      <div class="entry">
        <span class="tag">Missile bonus</span>
        <h3>{sign(hunter.missileAttackBonus)} to hit with anything you throw or shoot</h3>
        <p>
          Stacked with your class attack bonus that is {sign(computed.attack.missile)} at range
          against {sign(computed.attack.melee)} in melee. The hunter's equipment entry settles the
          question of longbows for a Small character: a shortbow goes in its place.
        </p>
      </div>

      <div class="entry">
        <span class="tag">Trophies</span>
        <h3>Take something from what you kill</h3>
        <p>
          Harvested trophies grant combat bonuses later. Keep the list in the play tracker from
          your first session.
        </p>
      </div>

      <div class="entry">
        <span class="tag">Skills</span>
        <h3>The reason the party brings you</h3>
        <p>
          Alertness, Stalking, Survival and Tracking are the hunter's, and they improve on their
          own as you level. These are the rolls that turn a trackless wood into somewhere you can
          navigate, so make them constantly rather than saving them for emergencies.
        </p>
      </div>
    </section>
  );
}

export const CLASS_PAGES: Record<string, (props: SheetProps) => JSX.Element> = {
  hunter: Hunter,
};
