# Stremio Kick Live Add-on

Versão corrigida para Render/Stremio.

## O que foi corrigido

- Corrigido `Router.use() requires a middleware function but got Object`.
- O `builder.getInterface()` agora passa por `getRouter()`.
- Rotas padrão do Stremio ficam disponíveis em `/manifest.json`, `/catalog/...`, `/meta/...` e `/stream/...`.
- O servidor usa `process.env.PORT` e `0.0.0.0`, compatível com Render.
- Catálogo e stream consultam os endpoints utilizados pelo site da Kick.
- Cache simples para reduzir chamadas.
- Health check em `/health`.

## Render

Build Command:
npm install

Start Command:
npm start

Não é necessário definir PORT manualmente no Render.

## Depois do deploy

Teste:

https://SEU-SERVICO.onrender.com/health

e:

https://SEU-SERVICO.onrender.com/manifest.json

Depois adicione no Stremio:

https://SEU-SERVICO.onrender.com/manifest.json

## Observação

A obtenção do playback HLS depende dos endpoints públicos/website da Kick. A API oficial de desenvolvedor da Kick possui endpoints públicos, mas alguns recursos exigem OAuth. Se a Kick alterar os endpoints do player, o módulo `src/kickApi.js` precisará ser atualizado.
