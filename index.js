require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { addonBuilder, getRouter } = require("stremio-addon-sdk");
const manifest = require("./manifest.json");
const { handleCatalog, handleMeta, handleStream } = require("./src/handlers");

const app = express();
const PORT = Number(process.env.PORT || 7000);
const HOST = process.env.HOST || "0.0.0.0";

app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async ({ type, id, extra }) => {
  return handleCatalog(type, id, extra || {});
});

builder.defineMetaHandler(async ({ type, id }) => {
  return { meta: await handleMeta(type, id) };
});

builder.defineStreamHandler(async ({ type, id }) => {
  return handleStream(type, id);
});

// IMPORTANT: getInterface() returns an object, not an Express middleware.
// getRouter() converts the Stremio addon interface into an Express Router.
const addonRouter = getRouter(builder.getInterface());

// Stremio standard routes: /manifest.json, /catalog/..., /meta/..., /stream/...
app.use("/", addonRouter);

app.get("/", (req, res) => {
  res.type("html").send(`
    <html><head><meta charset="utf-8"><title>Kick Live - Stremio Add-on</title>
    <style>body{font-family:Arial;max-width:760px;margin:40px auto;padding:20px}
    code{background:#eee;padding:3px 6px;border-radius:4px}</style></head>
    <body>
      <h1>Kick Live - Stremio Add-on</h1>
      <p>Servidor online.</p>
      <p>Manifest: <code>/manifest.json</code></p>
      <p>Health: <code>/health</code></p>
    </body></html>
  `);
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", addon: manifest.name, version: manifest.version });
});

app.use((err, req, res, next) => {
  console.error("Addon error:", err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`Kick Stremio Add-on listening on ${HOST}:${PORT}`);
  console.log(`Manifest: /manifest.json`);
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

module.exports = app;