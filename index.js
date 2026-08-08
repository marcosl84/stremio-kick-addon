require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { addonBuilder, getRouter } = require("stremio-addon-sdk");
const manifest = require("./manifest.json");
const { handleCatalog, handleMeta, handleStream, toLiveMeta } = require("./src/handlers");
const kick = require("./src/kickApi");

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

app.get("/configure", (req, res) => {
  const base = `${req.protocol}://${req.get("host")}`;
  res.type("html").send(`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Kick Live - Vincular Conta</title>
<style>
body{font-family:Arial,sans-serif;max-width:680px;margin:40px auto;padding:20px;background:#0f0f0f;color:#eee}
h1{color:#53fc18}h3{color:#53fc18}
.step{background:#1a1a1a;padding:16px;border-radius:8px;margin:16px 0}
input{width:100%;padding:12px;background:#111;border:1px solid #53fc18;color:#fff;border-radius:4px;font-size:14px;box-sizing:border-box}
button{background:#53fc18;color:#000;border:none;padding:12px 24px;border-radius:4px;cursor:pointer;font-weight:bold;margin-top:12px}
code{background:#222;padding:8px 12px;border-radius:4px;font-size:13px;display:block;word-break:break-all;color:#53fc18;margin:8px 0;cursor:pointer}
.copy-hint{font-size:11px;color:#888;margin-top:-4px}
#result{display:none;margin-top:16px}
#addon-url{word-break:break-all;background:#111;padding:12px;border-radius:4px;color:#53fc18;margin-top:8px}
a{color:#53fc18}
.tip{background:#1a2e1a;border-left:3px solid #53fc18;padding:10px 14px;border-radius:4px;margin:8px 0}
</style></head>
<body>
<h1>🎮 Kick Live — Vincular Conta</h1>
<p>Siga os passos abaixo para ver seus canais seguidos e inscritos no Stremio.</p>
<div class="step">
<h3>Passo 1 — Abrir o Kick.com logado</h3>
<p>Acesse <a href="https://kick.com" target="_blank">kick.com</a> e certifique-se de estar logado na sua conta.</p>
</div>
<div class="step">
<h3>Passo 2 — Abrir o Console do navegador</h3>
<p>Pressione <strong>F12</strong> (ou clique com botão direito na página → <em>Inspecionar</em>) e clique na aba <strong>Console</strong>.</p>
<p>Cole o comando abaixo no Console e pressione <strong>Enter</strong>:</p>
<code onclick="copyCmd()" id="cmd">Object.entries(localStorage).filter(([k])=>k.toLowerCase().includes('token')||k.toLowerCase().includes('auth')).map(([k,v])=>k+': '+v).join('\\n') || 'Nenhum token encontrado'</code>
<p class="copy-hint">👆 Clique para copiar o comando</p>
<div class="tip">Se aparecer um texto longo começando com <strong>eyJ</strong>, copie apenas esse valor (sem o nome da chave e sem aspas).</div>
</div>
<div class="step">
<h3>Passo 3 — Inserir o token</h3>
<input type="text" id="token" placeholder="Cole aqui o valor que começa com eyJ..." />
<button onclick="gen()">Gerar URL personalizada</button>
</div>
<div id="result" class="step">
<h3>Passo 4 — Instalar no Stremio</h3>
<p>Adicione a URL abaixo no Stremio (Add-ons → <em>Add by URL</em>):</p>
<div id="addon-url"></div>
<br>
<button onclick="install()">Instalar direto no Stremio</button>
</div>
<script>
const base='${base}';
function copyCmd(){
  navigator.clipboard.writeText(document.getElementById('cmd').textContent);
  alert('Copiado! Cole no Console do navegador.');
}
function gen(){
  const t=document.getElementById('token').value.trim();
  if(!t)return alert('Insira seu token!');
  const url=base+'/'+encodeURIComponent(t)+'/manifest.json';
  document.getElementById('addon-url').textContent=url;
  document.getElementById('result').style.display='block';
}
function install(){
  const t=document.getElementById('token').value.trim();
  const url=base+'/'+encodeURIComponent(t)+'/manifest.json';
  location.href='stremio://'+url.replace(/^https?:\/\//,'');
}
</script>
</body></html>`);
});

const RESERVED = new Set(['health', 'configure', 'catalog', 'meta', 'stream', 'manifest.json']);

async function tokenManifest(req, res) {
  const token = decodeURIComponent(req.params.token);
  if (RESERVED.has(token)) return res.status(404).end();
  const sub = {
    ...manifest,
    id: `${manifest.id}.sub`,
    catalogs: [
      { type: "live", id: "kick_subscribed", name: "Kick - Inscritos ❤️", extra: [] },
      ...manifest.catalogs
    ]
  };
  res.json(sub);
}

async function tokenCatalog(req, res) {
  const token = decodeURIComponent(req.params.token);
  if (RESERVED.has(token)) return res.status(404).end();
  const { type, catalogId } = req.params;
  const extra = req.query.search ? { search: req.query.search } : {};

  try {
    if (catalogId === "kick_subscribed") {
      const channels = await kick.getFollowedChannels(token);
      return res.json({ metas: channels.map(toLiveMeta) });
    }
    const result = await handleCatalog(type, catalogId, extra);
    res.json(result);
  } catch (e) {
    console.error("token catalog error:", e.message);
    res.json({ metas: [] });
  }
}

async function tokenMeta(req, res) {
  const token = decodeURIComponent(req.params.token);
  if (RESERVED.has(token)) return res.status(404).end();
  try {
    const meta = await handleMeta(req.params.type, req.params.id);
    res.json({ meta });
  } catch { res.json({ meta: null }); }
}

async function tokenStream(req, res) {
  const token = decodeURIComponent(req.params.token);
  if (RESERVED.has(token)) return res.status(404).end();
  try {
    const result = await handleStream(req.params.type, req.params.id);
    res.json(result);
  } catch { res.json({ streams: [] }); }
}

app.get("/:token/manifest.json", tokenManifest);
app.get("/:token/catalog/:type/:catalogId.json", tokenCatalog);
app.get("/:token/meta/:type/:id.json", tokenMeta);
app.get("/:token/stream/:type/:id.json", tokenStream);

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