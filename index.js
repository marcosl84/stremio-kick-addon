require('dotenv').config();

const { addonBuilder } = require('stremio-addon-sdk');
const express = require('express');
const cors = require('cors');
const manifest = require('./manifest.json');
const { handleCatalog, handleMeta, handleStream } = require('./src/handlers');
const { startKeepAlive } = require('./src/keepAlive');

const app = express();
const PORT = process.env.PORT || 7000;

// Middleware
app.use(cors());
app.use(express.json());

// Criar builder do addon
const builder = new addonBuilder(manifest);

// Handlers de catálogo
builder.defineCatalogHandler(async ({ type, id, extra }) => {
  console.log(`📚 Catálogo requisitado: type=${type}, id=${id}`);
  return handleCatalog(type, id, extra || {});
});

// Handlers de metadados
builder.defineMetaHandler(async ({ type, id }) => {
  console.log(`📝 Meta requisitada: type=${type}, id=${id}`);
  const meta = await handleMeta(type, id);
  return { meta: meta || {} };
});

// Handlers de streams
builder.defineStreamHandler(async ({ type, id }) => {
  console.log(`🎬 Stream requisitado: type=${type}, id=${id}`);
  return handleStream(type, id);
});

// Middleware do addon
const addonInterface = builder.getInterface();

// Rotas do addon
app.use('/addon', addonInterface);

// Rota de manifesto
app.get('/manifest.json', (req, res) => {
  console.log('📦 Manifesto requisitado');
  res.json(manifest);
});

// Rota raiz
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Stremio Kick Add-on</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
        }
        .container {
          background: rgba(0, 0, 0, 0.8);
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        h1 {
          margin-top: 0;
          color: #667eea;
        }
        .install-btn {
          display: inline-block;
          padding: 12px 24px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 20px;
          transition: background 0.3s;
        }
        .install-btn:hover {
          background: #764ba2;
        }
        .info {
          margin-top: 20px;
          padding: 15px;
          background: rgba(102, 126, 234, 0.1);
          border-left: 3px solid #667eea;
          border-radius: 5px;
        }
        code {
          background: #333;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
        }
        .feature-list {
          list-style: none;
          padding: 0;
        }
        .feature-list li {
          padding: 8px 0;
          margin-left: 20px;
        }
        .feature-list li:before {
          content: "✓ ";
          color: #667eea;
          font-weight: bold;
          margin-left: -20px;
          margin-right: 10px;
        }
        .status {
          font-size: 14px;
          color: #90EE90;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎮 Stremio Kick Add-on</h1>
        <p>Add-on oficial para Kick.com no Stremio</p>
        
        <div class="info">
          <strong>Instalar o Add-on:</strong><br>
          <a href="stremio://addon/https://stremio-kick-addon.onrender.com/manifest.json" class="install-btn">
            Instalar Add-on
          </a>
          <p style="margin-top: 15px; font-size: 12px;">
            Ou copie e cole esta URL no Stremio:<br>
            <code>https://stremio-kick-addon.onrender.com/manifest.json</code>
          </p>
        </div>

        <h2>Recursos</h2>
        <ul class="feature-list">
          <li>Busca de criadores e canais</li>
          <li>Streams ao vivo com status online</li>
          <li>VODs (Vídeos sob demanda)</li>
          <li>Acesso a canais com categorias</li>
          <li>Filtros por gênero</li>
          <li>Cache para melhor performance</li>
          <li>Suporte a múltiplos criadores</li>
        </ul>

        <h2>Como Usar</h2>
        <ol>
          <li>Clique no botão "Instalar Add-on" acima</li>
          <li>Ou abra o Stremio e vá para "Adicionar Addon"</li>
          <li>Cole a URL do manifesto</li>
          <li>Procure por streams ao vivo, VODs ou canais</li>
        </ol>

        <div class="info" style="margin-top: 30px;">
          <strong>Status do Servidor:</strong> ✅ Online<br>
          <strong>Versão:</strong> 1.0.0<br>
          <strong>Keep-Alive:</strong> ✅ Ativo<br>
          <strong>Manifesto:</strong> <a href="/manifest.json" style="color: #667eea;">Ver Manifesto</a>
          <div class="status">Servidor será mantido acordado 24/7 ⏰</div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', addon: manifest.name, keepAlive: true });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error('❌ Erro:', err);
  res.status(500).json({ error: err.message });
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║  🎮 Stremio Kick Add-on                            ║
║  ✅ Servidor rodando                              ║
║  🌐 https://stremio-kick-addon.onrender.com       ║
║  📦 /manifest.json                                ║
║  🔄 Keep-Alive: ATIVO (24/7)                      ║
╚════════════════════════════════════════════════════╝
  `);

  // Iniciar keep-alive para manter o app acordado no Render
  startKeepAlive();
});

// Tratamento de erro não capturado
process.on('unhandledRejection', err => {
  console.error('❌ Erro não tratado:', err);
});

module.exports = app;
