#!/usr/bin/env node
// The local server. It owns the database and serves the sheet, and it listens
// on the loopback address only: nothing about this project leaves the laptop.
//
//   node src/server.ts           serve the built sheet, and open it
//   node src/server.ts --dev     serve through Vite, with hot reload
//   node src/server.ts --no-open do not open a browser
//
// In dev Vite serves the page from source, so an edit shows without a
// rebuild. The API is the same in both, on the same origin, so there is no
// proxy to configure and nothing to keep in step.

import { spawn } from "node:child_process";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { createApi } from "./server/api.ts";
import { serveStatic } from "./server/static.ts";
import { openStore } from "./storage/store.ts";

const DATABASE = "characters.db";
const BUILT_SHEET = "dist/sheet";
const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT ?? 4000);

const dev = process.argv.includes("--dev");
const openBrowser = !process.argv.includes("--no-open");

const store = openStore(DATABASE);
const api = createApi(store);

// Only loaded in dev, so playing needs nothing but Node.
const vite = dev
  ? await (await import("vite")).createServer({
      server: { middlewareMode: true },
      appType: "spa",
    })
  : null;

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  if (chunks.length === 0) return undefined;
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return undefined;
  }
}

async function handleApi(req: IncomingMessage, res: ServerResponse, pathname: string) {
  const body = req.method === "PUT" || req.method === "POST" ? await readBody(req) : undefined;
  const response = api(req.method ?? "GET", pathname, body);
  const payload = JSON.stringify(response.body);
  res.writeHead(response.status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(payload);
}

const server = createServer((req, res) => {
  const pathname = new URL(req.url ?? "/", `http://${HOST}`).pathname;

  if (pathname === "/api" || pathname.startsWith("/api/")) {
    handleApi(req, res, pathname).catch((err: unknown) => {
      console.error(err);
      if (!res.headersSent) res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "Something went wrong on the server" }));
    });
    return;
  }

  if (vite) {
    vite.middlewares(req, res);
    return;
  }

  serveStatic(BUILT_SHEET, pathname, res);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code !== "EADDRINUSE") throw err;
  console.error(
    `Port ${PORT} is already in use, so this server did not start.\n` +
      `Another sheet is probably already running at http://${HOST}:${PORT}/.\n` +
      `Stop it, or start this one on another port: PORT=4001 npm start`,
  );
  process.exitCode = 1;
  void shutdown();
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}/`;
  const characters = store.list();
  console.log(`Sheet at ${url}${dev ? "  (hot reload)" : ""}`);
  for (const c of characters) {
    console.log(`  ${c.name}  revision ${c.revision}, written ${c.writtenAt}`);
  }
  if (characters.length === 0) {
    console.log("  No characters yet. Import one: npm run import");
  }
  if (openBrowser) {
    spawn("xdg-open", [url], { stdio: "ignore", detached: true }).on("error", () => {
      // No desktop to open into. The URL is printed above either way.
    });
  }
});

// Closing the listener alone leaves keep-alive connections open and the
// process alive, which means the next start finds the port still taken.
let closing = false;
async function shutdown(): Promise<void> {
  if (closing) return;
  closing = true;
  server.closeAllConnections();
  await new Promise<void>((done) => server.close(() => done()));
  await vite?.close();
  store.close();
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
