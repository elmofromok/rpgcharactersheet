#!/usr/bin/env node
// Build a publishable character sheet from a character file and a system template.
//
//   node build.mjs                       build every character
//   node build.mjs moggle-fluff-a-kin    build one
//
// Output goes to dist/<id>.html and is what gets published to the artifact.

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { basename } from "node:path";
import { execFileSync } from "node:child_process";

const REQUIRED = ["id", "name", "template", "start", "state"];

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
    return `Build ${hash} \u00b7 ${date}${dirty}`;
  } catch {
    return "Unversioned build";
  }
}

function build(file) {
  const character = JSON.parse(readFileSync(file, "utf8"));

  for (const key of REQUIRED) {
    if (!character[key]) throw new Error(`${basename(file)}: missing "${key}"`);
  }
  if (character.id !== basename(file, ".json")) {
    throw new Error(`${basename(file)}: id "${character.id}" does not match the filename`);
  }

  const template = readFileSync(`sheet/${character.template}`, "utf8");
  for (const token of ["{{STATE}}", "{{START}}", "{{BUILD}}"]) {
    if (!template.includes(token)) throw new Error(`${character.template}: no ${token}`);
  }

  const html = template
    .replace("{{STATE}}", () => JSON.stringify(character.state))
    .replace("{{START}}", () => JSON.stringify(character.start))
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
for (const f of files) build(`characters/${f}`);
