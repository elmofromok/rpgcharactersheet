// The left rail: the numbers you look up rather than change. Every one of
// them is computed, so levelling moves all of them at once.

import { characterClass, kindred } from "../rules.ts";
import {
  ABILITY_NAMES,
  ABILITY_ORDER,
  SAVE_NAMES,
  SKILL_NAMES,
  sign,
  skillChance,
  type SheetProps,
} from "./shared.ts";
import type { SaveKind, Skill } from "../types.ts";

export function Abilities({ character, computed }: SheetProps) {
  const primes = characterClass(character).primeAbilities;

  return (
    <section class="card">
      <h2>Ability scores</h2>
      <table>
        <thead>
          <tr>
            <th>Ability</th>
            <th>Score</th>
            <th>Mod</th>
          </tr>
        </thead>
        <tbody>
          {ABILITY_ORDER.map((ability) => {
            const modifier = computed.abilityModifiers[ability];
            const classes = [
              primes.includes(ability) ? "prime" : "",
              modifier < 0 ? "flag" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <tr key={ability} class={classes || undefined}>
                <td>{ABILITY_NAMES[ability]}</td>
                <td>{character.abilities[ability]}</td>
                <td class={modifier === 0 ? "same" : undefined}>{sign(modifier)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p class="note">
        Ability checks are d6 plus that ability's modifier against a fixed target of 4.
      </p>
    </section>
  );
}

export function Combat({ character, computed }: SheetProps) {
  const armourClasses = computed.loadouts.map((l) => l.armourClass);
  const low = Math.min(...armourClasses);
  const high = Math.max(...armourClasses);
  const kin = kindred(character);
  const con = computed.abilityModifiers.con;
  const pips = Math.min(Math.max(character.hp, 0), 12);

  return (
    <section class="card">
      <h2>Combat</h2>
      <dl>
        <div class="stat">
          <dt>Hit points</dt>
          <dd class="big">
            {character.hp} / {computed.maxHitPoints}
            <span class="pips">
              {Array.from({ length: pips }, (_, i) => (
                <i class="pip" key={i} />
              ))}
            </span>
            <small>
              {character.hitDice.length > 0
                ? `rolled ${character.hitDice.join(", ")} on d${characterClass(character).hitDie}`
                : "no hit dice recorded"}
              {con !== 0 ? `, ${sign(con)} per level for Constitution` : ""}
              {computed.hitDiceOwed > 0
                ? `. ${computed.hitDiceOwed} hit ${computed.hitDiceOwed === 1 ? "die" : "dice"} still to roll`
                : ""}
            </small>
          </dd>
        </div>

        <div class="stat">
          <dt>Armour class</dt>
          <dd class="big">
            {low === high ? low : `${low}–${high}`}
            <small>
              depends what is in your hands; see the kit
              <br />
              add {sign(kin.acVersusLarge)} in melee against Large creatures
            </small>
          </dd>
        </div>

        <div class="stat">
          <dt>Attack bonus</dt>
          <dd class="big">
            {sign(computed.attack.melee)}
            <small>{sign(computed.attack.missile)} with missile weapons</small>
          </dd>
        </div>

        <div class="stat">
          <dt>Magic resistance</dt>
          <dd class="big">
            {sign(computed.magicResistance)}
            <small>applies to saving throws against magic</small>
          </dd>
        </div>
      </dl>
    </section>
  );
}

export function SavingThrows({ computed }: SheetProps) {
  return (
    <section class="card">
      <h2>Saving throws</h2>
      <dl>
        {(Object.keys(SAVE_NAMES) as SaveKind[]).map((kind) => (
          <div class="stat" key={kind}>
            <dt>{SAVE_NAMES[kind]}</dt>
            <dd>{computed.saves[kind]}</dd>
          </div>
        ))}
      </dl>
      <p class="note">Roll d20, meet or beat the target.</p>
    </section>
  );
}

export function Skills({ computed }: SheetProps) {
  const skills = (Object.keys(SKILL_NAMES) as Skill[])
    .map((skill) => ({ skill, ...computed.skills[skill] }))
    .sort((a, b) => a.target - b.target || SKILL_NAMES[a.skill].localeCompare(SKILL_NAMES[b.skill]));

  return (
    <section class="card">
      <h2>Skills</h2>
      <dl>
        {skills.map(({ skill, target, source }) => (
          <div class="stat" key={skill}>
            <dt>{SKILL_NAMES[skill]}</dt>
            <dd>
              {target}
              <small>
                {source} &middot; {skillChance(target)}%
              </small>
            </dd>
          </div>
        ))}
      </dl>
      <p class="note">
        Roll d6 plus any situational modifier and meet or beat the target. Ability modifiers do
        not apply. A natural 1 always fails and a natural 6 always succeeds whatever the
        modifiers, so no skill is ever better than 5-in-6 or worse than 1-in-6.
      </p>
      <p class="note">
        Everything defaults to a target of 6 unless your kindred or class lowers it, and the
        targets above say which did.
      </p>
    </section>
  );
}

export function Particulars({ character }: SheetProps) {
  return (
    <section class="card">
      <h2>Particulars</h2>
      <dl>
        <div class="stat">
          <dt>Height</dt>
          <dd>{character.height || "—"}</dd>
        </div>
        <div class="stat">
          <dt>Age</dt>
          <dd>{character.age || "—"}</dd>
        </div>
        <div class="stat">
          <dt>Languages</dt>
          <dd>
            {character.languages.length > 0 ? character.languages.join(", ") : "—"}
            <small>plus the tongue of your alignment</small>
          </dd>
        </div>
      </dl>
    </section>
  );
}
