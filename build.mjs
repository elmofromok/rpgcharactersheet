#!/usr/bin/env node
// Build a publishable character sheet from a character file and a system template.
//
//   node build.mjs                       build every character
//   node build.mjs moggle-fluff-a-kin    build one
//
// Output goes to dist/<id>.html and is what gets published to the artifact.
//
// Transitional. Characters are flat documents now and their numbers are
// computed, but the published page still wants the old play-state block, so
// this projects one onto the other. The whole file goes when the local sheet
// replaces the artifact.

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { basename, join } from "node:path";
import { execFileSync } from "node:child_process";

import { hydrate, readCharacterFile } from "./src/characters/seed.ts";
import { maxHitPoints } from "./src/systems/dolmenwood/rules.ts";

// Names the commit this build came from, so a stale browser tab can be
// identified on sight. Build the same commit twice and you get the same
// stamp, because the date is the commit's rather than today's.
function buildStamp() {
  const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
  try {
    const hash = git("rev-parse", "--short", "HEAD");
    const date = new Date(git("show", "-s", "--format=%cI", "HEAD")).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
    const dirty = git("status", "--porcelain") !== "" ? " + uncommitted changes" : "";
    return `Build ${hash} · ${date}${dirty}`;
  } catch {
    return "Unversioned build";
  }
}

// The play-state block the published page reads. Hit points per level are
// computed now, so hpMax comes from the rules rather than from the file, and
// the page's free-text box is the journal.
function playState(character) {
  return {
    hp: character.hp,
    hpMax: maxHitPoints(character),
    xp: character.xp,
    level: character.level,
    gold: character.gold,
    arrows: character.arrows,
    wilder: character.wilder,
    coins: character.coins,
    trophies: character.trophies,
    notes: character.journal,
    kit: character.kit,
  };
}

function build(file) {
  const character = hydrate(readCharacterFile(file));
  const templateName = `${character.system}.html`;
  const template = readFileSync(join("sheet", templateName), "utf8");

  for (const token of ["{{STATE}}", "{{START}}", "{{BUILD}}"]) {
    if (!template.includes(token)) throw new Error(`${templateName}: no ${token}`);
  }

  // Both tokens get the same object. START is only the page's fallback for a
  // field STATE is missing, and STATE is never missing one.
  const state = JSON.stringify(playState(character));
  const html = template
    .replace("{{STATE}}", () => state)
    .replace("{{START}}", () => state)
    .replace("{{BUILD}}", () => stamp);

  if (html.includes("{{")) throw new Error(`${character.id}: unreplaced token left in output`);

  mkdirSync("dist", { recursive: true });
  const out = `dist/${character.id}.html`;
  writeFileSync(out, html);
  console.log(`${out}  ${html.length} bytes  ->  ${character.artifact ?? "not published yet"}`);
}

const stamp = buildStamp();
const only = process.argv[2];
const files = readdirSync("characters")
  .filter((f) => f.endsWith(".json"))
  .filter((f) => !only || f === `${only}.json`);

if (files.length === 0) throw new Error(only ? `no character named "${only}"` : "no characters found");
for (const f of files) build(join("characters", f));
