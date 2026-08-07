# 🎯 GUIA COMPLETO - DEPLOY NO RENDER EM 5 MINUTOS

## ✅ PRÉ-REQUISITOS

- ✅ Conta GitHub (você já tem)
- ✅ Repositório `stremio-kick-addon` (já criado)
- ✅ Navegador web

---

## 📝 PASSO 1: Acessar Render.com

1. Abra: **https://render.com**
2. Clique em **"Sign up"** (canto superior direito)

---

## 🔐 PASSO 2: Conectar com GitHub

1. Clique em **"Continue with GitHub"**
2. Será redirecionado para GitHub
3. Clique em **"Authorize renderinc"**
4. Confirme sua senha do GitHub
5. Volta para o Render automaticamente ✅

---

## 🆕 PASSO 3: Criar Web Service

No dashboard do Render:

1. Clique no botão **"New +"** (lado superior)
2. Selecione **"Web Service"**

---

## 🔗 PASSO 4: Conectar Repositório

1. Clique em **"Build and deploy from a Git repository"**
2. Clique em **"Connect a repository"**
3. Procure por: **`stremio-kick-addon`**
4. Clique em **"Connect"** ao lado dele

---

## ⚙️ PASSO 5: Configurar Deployment

Preencha os campos conforme abaixo:

### 📋 INFORMAÇÕES BÁSICAS:
```
Name:                stremio-kick-addon
Environment:         Node
Branch:              main
Build Command:       npm install
Start Command:       npm start
```

### 🌍 REGIÃO:
```
Escolha: Frankfurt (Europe) - mais perto do Brasil
Ou: Ohio (US) - também funciona bem
```

### ⚙️ PLANO:
```
Selecione: FREE (Gratuito)
```

---

## 🔧 PASSO 6: Adicionar Variáveis de Ambiente

Clique em **"Advanced"** ou procure por **"Environment"**

Adicione estas variáveis:

| Chave | Valor |
|-------|-------|
| `PORT` | `7000` |
| `HOST` | `0.0.0.0` |
| `NODE_ENV` | `production` |
| `CACHE_DURATION` | `30` |

---

## 🚀 PASSO 7: Iniciar Deploy

1. Desça até o final
2. Clique em **"Create Web Service"**
3. Aguarde! (2-3 minutos)

---

## 🟢 PASSO 8: Confirmar Deploy

Você verá na tela:
- Primeiro: 🟡 **Building** (compilando)
- Depois: 🟡 **Deploying** (implantando)
- Finalmente: 🟢 **Live** (PRONTO!)

Quando ficar 🟢 verde, clique na URL no topo!

---

## 📌 PASSO 9: Obter URL do Manifesto

Após o deploy ficar 🟢 Live:

```
URL do seu servidor será algo como:
https://stremio-kick-addon.onrender.com

URL do manifesto para o Stremio:
https://stremio-kick-addon.onrender.com/manifest.json
```

**Copie esta última URL!**

---

## 📱 PASSO 10: Instalar no Stremio

1. Abra o **Stremio** no seu computador
2. Vá para **"Adicionar Addon"**
3. Procure a opção **"Add from Repository"**
4. Cole a URL: `https://seu-app.onrender.com/manifest.json`
5. Clique em **"Install"**
6. Pronto! 🎉

---

## ✅ TESTAR SE ESTÁ FUNCIONANDO

### No Navegador:

```
1. Acesse: https://seu-app.onrender.com
   (Deve abrir uma página com informações do addon)

2. Teste o Health Check:
   https://seu-app.onrender.com/health
   (Deve retornar: {"status":"ok","addon":"Kick.com Add-on"})

3. Teste o Manifesto:
   https://seu-app.onrender.com/manifest.json
   (Deve retornar JSON com configuração)
```

### No Stremio:

```
1. Procure por "Streams ao Vivo"
2. Tente buscar um criador (ex: "pokimane")
3. Veja se aparecem resultados
4. Clique em um stream para abrir
```

---

## 🔄 O QUE ACONTECE AGORA?

- ✅ Seu add-on está **online 24/7**
- ✅ Qualquer mudança no GitHub faz **auto-deploy**
- ✅ Certificado SSL/HTTPS **incluído**
- ✅ Acesso por múltiplos usuários **suportado**

---

## 📊 ACOMPANHAR O DEPLOY

No dashboard do Render:

1. Clique no seu serviço
2. Abra a aba **"Logs"**
3. Veja as mensagens de execução em tempo real

Procure por:
```
✅ Servidor rodando
📍 http://0.0.0.0:7000
📦 Manifesto: /manifest.json
```

---

## 🐛 PROBLEMAS?

### ❌ "Build failed"
- Verifique os logs
- Certifique-se que `npm install` funciona localmente

### ❌ "App crashed"
- Vá para "Logs"
- Procure pelo erro
- Pode ser variável de ambiente faltando

### ❌ "Sem resultados no Stremio"
- Reinicie o Stremio
- Tente adicionar o addon novamente
- Verifique a URL

### ❌ "Cannot GET /"
- Isso é normal! A página inicial carrega uma página HTML
- Teste a URL do manifesto

---

## 💡 DICAS

1. **Resetar Variáveis**: Vá em "Environment" no Render
2. **Ver Logs**: Clique em "Logs" no dashboard
3. **Reiniciar**: Clique em "Restart Instance"
4. **Atualizações Automáticas**: Qualquer push no GitHub faz deploy

---

## 📞 SUPORTE

Se algo der errado:

1. Verifique os **Logs** no Render
2. Confirme as **Variáveis de Ambiente**
3. Teste localmente: `npm start`
4. Abra uma [Issue no GitHub](https://github.com/marcosl84/stremio-kick-addon/issues)

---

## 🎉 PARABÉNS!

Seu add-on Kick para Stremio está **ONLINE** e **FUNCIONANDO**! 🚀

Agora você pode:
- ✅ Buscar criadores do Kick
- ✅ Assistir streams ao vivo
- ✅ Acessar VODs
- ✅ Filtrar por categorias

**Divirta-se!** 🎮

---

**Dúvidas?** Revise este guia ou consulte [DEPLOY.md](./DEPLOY.md)

