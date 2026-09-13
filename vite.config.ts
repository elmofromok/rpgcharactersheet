import { defineConfig } from "vite";

import { buildStamp } from "./src/stamp.ts";

// The page is served by the local server, not by Vite's own dev server: Vite
// runs as middleware inside it, so the API and the sheet share one origin and
// there is no proxy to keep in step.
export default defineConfig({
  root: "src/sheet",

  // Stamped in at build time, so the footer names the commit the page was
  // made from rather than whatever the repo is on when it is read.
  define: {
    __BUILD_STAMP__: JSON.stringify(buildStamp()),
  },

  build: {
    outDir: "../../dist/sheet",
    emptyOutDir: true,
  },
  // Preact's JSX through Vite 8's Oxc transform, with no plugin. An edit
  // still reloads the page immediately; what this gives up is preserving
  // component state across that reload, which costs nothing when the state
  // lives in the database.
  oxc: {
    jsx: {
      runtime: "automatic",
      importSource: "preact",
    },
  },
});
