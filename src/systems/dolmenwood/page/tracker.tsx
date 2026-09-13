// The play tracker: the values that move most during a session, always live.
// No edit toggle guards any of this, because a toggle in front of your hit
// points is a toggle you would leave on.

import { useState } from "preact/hooks";

import { bankXp } from "../rules.ts";
import { count, toNumber, type SheetProps } from "./shared.ts";
import type { SaveState } from "../../../sheet/useCharacter.ts";

const SAVE_WORDS: Record<SaveState, string> = {
  loading: "loading",
  saved: "saved",
  unsaved: "unsaved",
  saving: "saving",
  failed: "not saved",
};

function Stepper({
  label,
  value,
  hint,
  critical,
  min = 0,
  max,
  onChange,
}: {
  label: string;
  value: number;
  hint?: string;
  critical?: boolean;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
}) {
  const clamp = (n: number) => Math.min(Math.max(n, min), max ?? Number.MAX_SAFE_INTEGER);

  return (
    <div class={critical ? "gauge crit" : "gauge"}>
      <label for={`f-${label}`}>{label}</label>
      <div class="stepper">
        <button type="button" aria-label={`decrease ${label}`} onClick={() => onChange(clamp(value - 1))}>
          &minus;
        </button>
        <input
          id={`f-${label}`}
          type="number"
          inputMode="numeric"
          value={value}
          aria-label={label}
          onInput={(e) => onChange(clamp(toNumber(e.currentTarget.value, value)))}
        />
        <button type="button" aria-label={`increase ${label}`} onClick={() => onChange(clamp(value + 1))}>
          +
        </button>
      </div>
      {hint ? <small>{hint}</small> : null}
    </div>
  );
}

export function Tracker({ character, computed, patch, status }: SheetProps) {
  const [award, setAward] = useState("");
  const [trophy, setTrophy] = useState("");

  const hp = character.hp;
  const max = computed.maxHitPoints;
  const glamour = computed.glamour;
  const capped = computed.glamourCoinCap;

  const addTrophy = () => {
    const taken = trophy.trim();
    if (!taken) return;
    patch({ trophies: [...character.trophies, taken] });
    setTrophy("");
  };

  const bank = () => {
    const awarded = toNumber(award, 0);
    if (!awarded) return;
    patch({ xp: Math.max(0, character.xp + bankXp(character, awarded)) });
    setAward("");
  };

  return (
    <section class="tracker">
      <div class="tracker-head">
        <h2>Play tracker</h2>
        <span id="savestate" data-s={status}>
          {SAVE_WORDS[status]}
        </span>
      </div>

      <div class="gauges">
        <Stepper
          label="Hit points"
          value={hp}
          critical={hp <= 1}
          hint={hp <= 0 ? "You are down." : hp <= 1 ? "One hit from gone." : `of ${max} max`}
          onChange={(next) => patch({ hp: next })}
        />
        <Stepper
          label="Arrows"
          value={character.arrows}
          hint="shortbow, 1d6, 50/100/150 ft"
          onChange={(next) => patch({ arrows: next })}
        />
        <Stepper
          label="Gold"
          value={character.gold}
          hint="in the belt pouch"
          onChange={(next) => patch({ gold: next })}
        />
        <Stepper
          label="Level"
          value={character.level}
          min={1}
          max={computed.maxLevel}
          hint={
            computed.hitDiceOwed > 0
              ? `${computed.hitDiceOwed} hit ${computed.hitDiceOwed === 1 ? "die" : "dice"} still to roll`
              : `of ${computed.maxLevel} max`
          }
          onChange={(next) => patch({ level: next })}
        />
        <Stepper
          label="Experience"
          value={character.xp}
          hint={
            computed.xpToNextLevel === null
              ? "maximum level"
              : `${count(computed.xpToNextLevel)} more awarded for level ${character.level + 1}`
          }
          onChange={(next) => patch({ xp: next })}
        />
      </div>

      <div class="tracker-rows">
        <div>
          <p class="rowhead">Once per day</p>
          <label class="flagline">
            <input
              type="checkbox"
              checked={character.wilder}
              onChange={(e) => patch({ wilder: e.currentTarget.checked })}
            />
            Wilder form used
            {max < 3 ? (
              <span style="color:var(--warn)">(out of reach at {max} max hp)</span>
            ) : null}
          </label>

          {glamour ? (
            <>
              <div class="flagline">
                {glamour.name}: {character.coins} of {capped} coins glamoured
              </div>
              <div class="inline">
                <button
                  class="act"
                  type="button"
                  onClick={() =>
                    patch({ coins: Math.min(capped, character.coins + glamour.coinsPerLevel) })
                  }
                >
                  +{glamour.coinsPerLevel} coins
                </button>
                <button
                  class="act"
                  type="button"
                  onClick={() =>
                    patch({ coins: Math.max(0, character.coins - glamour.coinsPerLevel) })
                  }
                >
                  &minus;{glamour.coinsPerLevel}
                </button>
                <button
                  class="act"
                  type="button"
                  onClick={() => patch({ wilder: false, coins: 0 })}
                >
                  New day
                </button>
              </div>
            </>
          ) : (
            <div class="inline">
              <button class="act" type="button" onClick={() => patch({ wilder: false, coins: 0 })}>
                New day
              </button>
            </div>
          )}

          <div class="inline">
            <input
              type="number"
              inputMode="numeric"
              placeholder="xp awarded"
              value={award}
              onInput={(e) => setAward(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  bank();
                }
              }}
            />
            <button class="act" type="button" onClick={bank}>
              Bank at {computed.xpModifier === 0 ? "par" : `${Math.round(computed.xpModifier * 100)}%`}
            </button>
          </div>
        </div>

        <div>
          <p class="rowhead">Trophies</p>
          {character.trophies.length > 0 ? (
            <ul class="trophies">
              {character.trophies.map((taken, index) => (
                <li key={`${taken}-${index}`}>
                  <span>{taken}</span>
                  <button
                    type="button"
                    aria-label={`remove ${taken}`}
                    onClick={() =>
                      patch({ trophies: character.trophies.filter((_, i) => i !== index) })
                    }
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p class="empty">Nothing taken yet.</p>
          )}
          <div class="inline">
            <input
              type="text"
              placeholder="what you took, and from what"
              value={trophy}
              onInput={(e) => setTrophy(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTrophy();
                }
              }}
            />
            <button class="act" type="button" onClick={addTrophy}>
              Add
            </button>
          </div>
        </div>

        <div>
          <p class="rowhead">Journal</p>
          <textarea
            placeholder="Rubbings taken, debts owed, things that know your name."
            value={character.journal}
            onInput={(e) => patch({ journal: e.currentTarget.value })}
          />
        </div>
      </div>
    </section>
  );
}
