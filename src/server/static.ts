// Serves the built sheet. Only used when the server runs for play; in dev
// Vite serves the page itself so that a change shows without a rebuild.

import { createReadStream, existsSync, statSync } from "node:fs";
import type { ServerResponse } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

export function serveStatic(root: string, pathname: string, res: ServerResponse): void {
  const base = resolve(root);
  if (!existsSync(base)) {
    res.writeHead(503, { "content-type": "text/plain; charset=utf-8" });
    res.end("The sheet has not been built yet. Run: npm run build\n");
    return;
  }

  const wanted = resolve(join(base, normalize(pathname)));
  // Everything the page asks for that is not a file is the page itself, so a
  // reload on any path still opens the sheet.
  const target =
    wanted.startsWith(base + sep) && existsSync(wanted) && statSync(wanted).isFile()
      ? wanted
      : join(base, "index.html");

  if (!existsSync(target)) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found\n");
    return;
  }

  res.writeHead(200, {
    "content-type": TYPES[extname(target)] ?? "application/octet-stream",
    // The page is rebuilt under a new hashed name, so files may be held; the
    // entry document must not be.
    "cache-control": target.endsWith("index.html") ? "no-store" : "max-age=3600",
  });
  createReadStream(target).pipe(res);
}
