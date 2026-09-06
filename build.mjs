#!/usr/bin/env node
// Build a publishable character sheet from a character file and a system template.
//
//   node build.mjs                       build every character
//   node build.mjs moggle-fluff-a-kin    build one
//
// Output goes to dist/<id>.html and is what gets published to the artifact.

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { basename } from "node:path";

const REQUIRED = ["id", "name", "template", "start", "state"];

function build(file) {
  const character = JSON.parse(readFileSync(file, "utf8"));

  for (const key of REQUIRED) {
    if (!character[key]) throw new Error(`${basename(file)}: missing "${key}"`);
  }
  if (character.id !== basename(file, ".json")) {
    throw new Error(`${basename(file)}: id "${character.id}" does not match the filename`);
  }

  const template = readFileSync(`sheet/${character.template}`, "utf8");
  for (const token of ["{{STATE}}", "{{START}}"]) {
    if (!template.includes(token)) throw new Error(`${character.template}: no ${token}`);
  }

  const html = template
    .replace("{{STATE}}", () => JSON.stringify(character.state))
    .replace("{{START}}", () => JSON.stringify(character.start));

  if (html.includes("{{")) throw new Error(`${character.id}: unreplaced token left in output`);

  mkdirSync("dist", { recursive: true });
  const out = `dist/${character.id}.html`;
  writeFileSync(out, html);
  console.log(`${out}  ${html.length} bytes  ->  ${character.artifact ?? "not published yet"}`);
}

const only = process.argv[2];
const files = readdirSync("characters")
  .filter((f) => f.endsWith(".json"))
  .filter((f) => !only || f === `${only}.json`);

if (files.length === 0) throw new Error(only ? `no character named "${only}"` : "no characters found");
for (const f of files) build(`characters/${f}`);
