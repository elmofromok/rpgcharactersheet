// The play tracker: the values that move most during a session. Read-only for
// now; editing is the next slice of #1.

import { count, type SheetProps } from "./shared.ts";

function Gauge({
  label,
  value,
  hint,
  critical,
}: {
  label: string;
  value: string | number;
  hint?: string;
  critical?: boolean;
}) {
  return (
    <div class={critical ? "gauge crit" : "gauge"}>
      <label>{label}</label>
      <span class="value">{value}</span>
      {hint ? <small>{hint}</small> : null}
    </div>
  );
}

export function Tracker({ character, computed }: SheetProps) {
  const hp = character.hp;
  const max = computed.maxHitPoints;

  return (
    <section class="tracker">
      <div class="tracker-head">
        <h2>Play tracker</h2>
        <span style="font-family:var(--data);font-size:11px;color:var(--soft)">read only</span>
      </div>

      <div class="gauges">
        <Gauge
          label="Hit points"
          value={`${hp} / ${max}`}
          critical={hp <= 1}
          hint={hp <= 0 ? "You are down." : hp <= 1 ? "One hit from gone." : `of ${max} max`}
        />
        <Gauge label="Arrows" value={character.arrows} hint="shortbow, 1d6, 50/100/150 ft" />
        <Gauge label="Gold" value={character.gold} hint="in the belt pouch" />
        <Gauge
          label="Level"
          value={character.level}
          hint={computed.maxLevel === character.level ? "maximum" : `of ${computed.maxLevel} max`}
        />
        <Gauge
          label="Experience"
          value={count(character.xp)}
          hint={
            computed.xpToNextLevel === null
              ? "maximum level"
              : `${count(computed.xpToNextLevel)} more awarded to reach level ${character.level + 1}`
          }
        />
      </div>

      <div class="tracker-rows">
        <div>
          <p class="rowhead">Once per day</p>
          <div class="flagline">Wilder form {character.wilder ? "used" : "still available"}</div>
          <div class="flagline">
            {character.coins} coins glamoured
            <small style="color:var(--soft)">the daily cap comes with your glamour</small>
          </div>
        </div>

        <div>
          <p class="rowhead">Trophies</p>
          {character.trophies.length > 0 ? (
            <ul class="trophies">
              {character.trophies.map((trophy, index) => (
                <li key={`${trophy}-${index}`}>{trophy}</li>
              ))}
            </ul>
          ) : (
            <p class="empty">Nothing taken yet.</p>
          )}
        </div>

        <div>
          <p class="rowhead">Journal</p>
          {character.journal ? (
            <p class="journal">{character.journal}</p>
          ) : (
            <p class="empty">Rubbings taken, debts owed, things that know your name.</p>
          )}
        </div>
      </div>
    </section>
  );
}
