import { execFileSync } from "node:child_process";

/**
 * Names the commit a build came from. An old browser tab looks identical to a
 * fresh one and reports the build it was made from, so when a sheet looks
 * wrong this is the first thing to read.
 *
 * The dirty check ignores `characters/`. A character changing is play, not an
 * uncommitted change to the sheet, and without the exclusion every build made
 * after a session would claim a dirty tree.
 */
export function buildStamp(): string {
  const git = (...args: string[]) => execFileSync("git", args, { encoding: "utf8" }).trim();
  try {
    const hash = git("rev-parse", "--short", "HEAD");
    const date = new Date(git("show", "-s", "--format=%cI", "HEAD")).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const changed = git("status", "--porcelain", "--", ".", ":(exclude)characters");
    return `Build ${hash} · ${date}${changed ? " + uncommitted changes" : ""}`;
  } catch {
    return "Unversioned build";
  }
}
