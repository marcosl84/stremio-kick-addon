# 🚀 Guia de Deploy - Stremio Kick Add-on

## 📌 Escolha sua Plataforma

### ⭐ RENDER (RECOMENDADO - Melhor para este projeto)

**Por que Render?**
- ✅ Deploy super fácil via GitHub
- ✅ SSL gratuito (HTTPS)
- ✅ Sempre online (não hibernar como Heroku)
- ✅ Perfeito para add-ons Stremio
- ✅ Interface intuitiva

---

## 🎯 DEPLOY PASSO A PASSO - RENDER

### 1️⃣ Criar Conta no Render

1. Acesse: https://render.com
2. Clique em **"Sign up"**
3. Faça login com **GitHub** (recomendado)
4. Autorize o Render acessar seus repositórios

### 2️⃣ Conectar Repositório

1. No dashboard do Render, clique em **"New +"**
2. Selecione **"Web Service"**
3. Clique em **"Connect a repository"**
4. Procure por **"stremio-kick-addon"**
5. Clique em **"Connect"**

### 3️⃣ Configurar Deployment

Na tela de configuração do Web Service:

```
📋 INFORMAÇÕES BÁSICAS:
├─ Name: stremio-kick-addon
├─ Region: Ohio (US) ou Frankfurt (EU - mais perto)
├─ Branch: main
└─ Runtime: Node

🔧 BUILD & DEPLOY:
├─ Build Command: npm install
└─ Start Command: npm start

⚙️ VARIÁVEIS DE AMBIENTE:
├─ PORT: 7000
├─ HOST: 0.0.0.0
├─ NODE_ENV: production
└─ CACHE_DURATION: 30
```

### 4️⃣ Finalizar Deploy

1. Desça até o final
2. Clique em **"Create Web Service"**
3. Aguarde o deploy (2-3 minutos)
4. Quando ficar verde ✅, seu addon está online!

### 5️⃣ Obter URL do Add-on

Após o deploy bem-sucedido:

```
URL do seu manifesto será:
https://seu-app-name.onrender.com/manifest.json

Copie esta URL!
```

---

## 📱 Instalar no Stremio

### Via Link Automático:
```
stremio://addon/https://seu-app-name.onrender.com/manifest.json
```

### Manual:
1. Abra o **Stremio**
2. Vá para: **Adicionar Addon** → **Add from repository**
3. Cole a URL: `https://seu-app-name.onrender.com/manifest.json`
4. Clique em **"Install"**
5. Pronto! 🎉

---

## 🔄 DEPLOY PASSO A PASSO - RAILWAY

### 1️⃣ Criar Conta

1. Acesse: https://railway.app
2. Faça login com **GitHub**
3. Autorize o Railway

### 2️⃣ Criar Novo Projeto

1. Clique em **"New Project"**
2. Selecione **"Deploy from GitHub repo"**
3. Procure por **"stremio-kick-addon"**
4. Clique em **"Deploy Now"**

### 3️⃣ Configurar Variáveis

1. No painel do projeto, vá para **"Variables"**
2. Adicione:
   - `PORT=7000`
   - `HOST=0.0.0.0`
   - `NODE_ENV=production`

### 4️⃣ Obter URL

1. Vá para **"Settings"**
2. Em **"Environment"**, copie a URL pública
3. Seu manifesto será: `https://seu-url/manifest.json`

---

## 🐟 DEPLOY PASSO A PASSO - FLY.IO

### 1️⃣ Instalar CLI

```bash
# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh

# Windows
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

### 2️⃣ Login e Deploy

```bash
# Fazer login
fly auth login

# Clonar seu repositório
git clone https://github.com/marcosl84/stremio-kick-addon.git
cd stremio-kick-addon

# Deploy
fly launch
# Responda as perguntas (região, nome, etc)

# Verificar status
fly status
```

### 3️⃣ Obter URL

```bash
fly info
# A URL pública aparecerá como "Hostname"
```

---

## ✅ Teste de Funcionamento

### 1. Verificar se o servidor está online

```
GET https://seu-app-name.onrender.com/health
```

Deve retornar:
```json
{
  "status": "ok",
  "addon": "Kick.com Add-on"
}
```

### 2. Verificar manifesto

```
GET https://seu-app-name.onrender.com/manifest.json
```

Deve retornar a configuração do addon em JSON.

### 3. Testar no Stremio

1. Instale o addon conforme acima
2. Procure por "Streams ao Vivo"
3. Tente buscar um criador
4. Verifique os VODs

---

## 🔧 Troubleshooting

### ❌ "App is not loading"

**Solução:**
1. Verifique os logs: `fly logs` (Fly.io) ou no dashboard (Render)
2. Certifique-se de que as variáveis de ambiente estão corretas
3. Reinicie o serviço

### ❌ "Connection refused"

**Solução:**
1. Verifique se a porta está correta (7000)
2. Verifique se `HOST=0.0.0.0` está definido
3. Reinicie o deployment

### ❌ "Addon não aparece no Stremio"

**Solução:**
1. Verifique a URL do manifesto
2. Reinicie o Stremio
3. Tente adicionar novamente

### ❌ "Sem resultados nas buscas"

**Solução:**
1. Verifique a conexão com a internet no servidor
2. Limpe o cache: reinicie o app
3. Verifique os logs para erros

---

## 📊 Monitoramento

### Render:
- Dashboard automático mostra CPU, memória, requisições
- Logs em tempo real disponíveis

### Railway:
- Mesma funcionalidade
- Créditos mensais mostrados

### Fly.io:
```bash
# Ver logs
fly logs

# Ver status
fly status

# Reiniciar
fly restart
```

---

## 🔄 Atualizações

Qualquer push para `main` fará auto-deploy:

```bash
# Fazer uma mudança
git add .
git commit -m "Melhoria no addon"
git push origin main

# Deploy automático acontece em 1-2 minutos!
```

---

## 🆘 Precisa de Ajuda?

### Logs do Render:
1. Acesse o dashboard
2. Clique no seu Web Service
3. Vá para "Logs"

### Logs do Railway:
1. Clique no seu projeto
2. Vá para "Deployments"
3. Clique no último deployment

### Logs do Fly.io:
```bash
fly logs
```

---

## 📝 Resumo Rápido

| Etapa | O que fazer |
|-------|-----------|
| 1 | Escolher plataforma (Render recomendado) |
| 2 | Fazer login com GitHub |
| 3 | Conectar repositório |
| 4 | Copiar URL do manifesto |
| 5 | Colar no Stremio |
| 6 | Pronto! 🎉 |

---

**Deploy criado com sucesso! 🚀**

Dúvidas? Verifique os logs ou entre em contato!
