#!/usr/bin/env node
/**
 * CareBridge 康橋 — tiny zero-dependency static server.
 *
 * The whole app is static HTML/CSS/JS (the sub-prototypes use CDN React +
 * Babel-standalone and fetch their .jsx over HTTP), so all we need is to serve
 * the repo root with sane MIME types. No build step, no npm install required —
 * which is exactly what you want on hackathon wifi.
 *
 *   node server.js            # serves on http://localhost:8080
 *   PORT=3000 node server.js  # custom port
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = process.env.PORT || 8080;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jsx": "text/javascript; charset=utf-8", // Babel-standalone reads the text
  ".json": "application/json; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  // Decode %20 etc. and strip query string; default "/" to index.html.
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";

  // Resolve safely inside ROOT (block path-traversal).
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h1>404</h1><p>Not found. Start at <a href='/'>/</a></p>");
      return;
    }
    const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`CareBridge 康橋 running → http://localhost:${PORT}`);
});
