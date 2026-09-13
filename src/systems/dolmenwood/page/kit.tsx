// The kit, and every legal way to hold it. Always live: loot reaches the
// sheet the moment you pick it up, with no toggle in the way.
//
// A line shows what the rules make of it. An item with no badge contributes
// nothing to armour class, which is how a shield typed in a hurry is caught:
// it sits there unrated instead of quietly adding its +1.

import { useState } from "preact/hooks";

import { rate } from "../rules.ts";
import type { Gear, KitItem } from "../types.ts";
import { sign, type SheetProps } from "./shared.ts";

function badge(gear: Gear | null): string | null {
  if (!gear) return null;
  switch (gear.kind) {
    case "armour":
      return `armour ${gear.ac}`;
    case "shield":
      return `shield ${sign(gear.bonus)}`;
    case "weapon":
      return `${gear.damage}${gear.hands === 2 ? " · two-handed" : ""}${
        gear.small ? " · small" : ""
      }`;
    case "none":
      return null;
  }
}

function mirrored(item: KitItem, gold: number, arrows: number): string | null {
  if (item.auto === "gold") return `${gold} gp`;
  if (item.auto === "arrows") return `${arrows} in the quiver`;
  return null;
}

export function Kit({ character, computed, patch }: SheetProps) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  const replace = (index: number, change: Partial<KitItem>) => {
    patch({
      kit: character.kit.map((item, i) => (i === index ? { ...item, ...change } : item)),
    });
  };

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    patch({ kit: [...character.kit, { n: trimmed, t: note.trim() }] });
    setName("");
    setNote("");
  };

  return (
    <section class="card">
      <h2>Kit</h2>

      <ul class="kit">
        {character.kit.map((item, index) => {
          const tracked = mirrored(item, character.gold, character.arrows);
          const rating = badge(rate(item));
          return (
            <li key={`${item.n}-${index}`}>
              <input
                class="kit-n"
                type="text"
                value={item.n}
                aria-label={`name of ${item.n}`}
                onInput={(e) => replace(index, { n: e.currentTarget.value })}
              />
              <span class="kit-r">
                {tracked ? (
                  <span class="num auto" title="kept in the play tracker">
                    {tracked}
                  </span>
                ) : (
                  <input
                    class="num"
                    type="text"
                    value={item.t}
                    placeholder="—"
                    aria-label={`note on ${item.n}`}
                    onInput={(e) => replace(index, { t: e.currentTarget.value })}
                  />
                )}
                {rating ? <span class="rating">{rating}</span> : null}
                <button
                  type="button"
                  class="drop"
                  aria-label={`remove ${item.n}`}
                  onClick={() => patch({ kit: character.kit.filter((_, i) => i !== index) })}
                >
                  &times;
                </button>
              </span>
            </li>
          );
        })}
      </ul>

      <div class="inline">
        <input
          type="text"
          placeholder="item"
          value={name}
          onInput={(e) => setName(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <input
          type="text"
          placeholder="note, optional"
          value={note}
          onInput={(e) => setNote(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button class="act" type="button" onClick={add}>
          Add
        </button>
      </div>

      <p class="note">
        Click a line to rewrite it and the cross to drop it. Arrows and coin are kept in the play
        tracker, so those two lines follow it. A line with no rating after it counts for nothing
        in a fight.
      </p>

      <h3 style="margin-top:22px">What you can hold</h3>
      <ul class="loadouts">
        {computed.loadouts.map((loadout) => (
          <li key={loadout.held.join("+")}>
            <span>{loadout.held.join(" and ") || "Empty-handed"}</span>
            <span class="ac">
              AC <b>{loadout.armourClass}</b>
              {loadout.damage ? ` · ${loadout.damage}` : ""}
            </span>
          </li>
        ))}
      </ul>
      <p class="note">
        Every combination your hands allow, and no others: a two-handed weapon leaves no arm for
        a shield, so that pairing is never listed. Decide which you are holding at the start of a
        fight rather than mid-round.
      </p>
      {computed.unrated.length > 0 ? (
        <p class="note">
          {computed.unrated.length} {computed.unrated.length === 1 ? "item is" : "items are"}{" "}
          unrated. That is right for rope and rations; if something there is armour or a weapon,
          the sheet is not counting it.
        </p>
      ) : null}
    </section>
  );
}
