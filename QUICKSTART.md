# Stremio Kick Add-on - Guia Rápido de Deploy

## 🚀 COMECE AQUI

### Opção 1: Deploy com um Click (Render - Recomendado)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/marcosl84/stremio-kick-addon)

Clique no botão acima e siga as instruções.

### Opção 2: Deploy Manual (Todos os Passos)

Veja o arquivo [DEPLOY.md](./DEPLOY.md) para instruções detalhadas de cada plataforma.

---

## ⚡ Quick Start Local

```bash
# 1. Instalar dependências
npm install

# 2. Copiar variáveis de ambiente
cp .env.example .env

# 3. Rodar em desenvolvimento
npm run dev

# 4. Abrir no navegador
http://localhost:7000
```

---

## 📋 Plataformas Suportadas

| Plataforma | Dificuldade | Custo | Recomendação |
|-----------|-----------|-------|--------------|
| **Render** | ⭐ Fácil | Grátis | ⭐⭐⭐ Melhor |
| **Railway** | ⭐ Fácil | Créditos | ⭐⭐ Bom |
| **Fly.io** | ⭐⭐ Médio | Grátis | ⭐⭐ Bom |
| **Docker** | ⭐⭐ Médio | Varia | ⭐ Avançado |

---

## 🎯 Deploy em 5 Minutos (Render)

1. **Acesse**: https://render.com
2. **Clique**: "Sign up" → "Continue with GitHub"
3. **Autorize**: O Render acessar seus repositórios
4. **Clique**: "New +" → "Web Service"
5. **Conecte**: Selecione `stremio-kick-addon`
6. **Configure**: 
   - Start Command: `npm start`
   - PORT: `7000`
7. **Deploy**: Clique "Create Web Service"
8. **Aguarde**: 2-3 minutos (fica verde quando pronto ✅)
9. **Copie**: URL do seu manifesto: `https://seu-app.onrender.com/manifest.json`
10. **Instale** no Stremio!

---

## 🔗 Links Importantes

- [Render Dashboard](https://dashboard.render.com)
- [Railway Dashboard](https://railway.app/dashboard)
- [Fly.io Dashboard](https://fly.io/dashboard)
- [Stremio Official](https://www.stremio.com/)
- [Kick.com](https://kick.com)

---

## 📱 Instalar no Stremio

Depois do deploy, você terá uma URL assim:
```
https://seu-app-name.onrender.com/manifest.json
```

No Stremio:
1. Vá para: **Adicionar Addon**
2. Cole a URL acima
3. Clique em **Install**
4. Pronto! 🎉

---

## ✅ Verificar se Está Funcionando

```bash
# Teste a saúde do servidor
curl https://seu-app-name.onrender.com/health

# Deve retornar:
# {"status":"ok","addon":"Kick.com Add-on"}
```

---

## 🐛 Problemas?

- **App não abre?** → Verifique os logs na plataforma
- **Sem resultados?** → Reinicie o addon
- **Erro de conexão?** → Verifique PORT e HOST

Veja [DEPLOY.md](./DEPLOY.md) para troubleshooting completo.

---

## 📝 Arquivos Importantes

- `index.js` - Aplicação principal
- `manifest.json` - Configuração do Stremio
- `src/kickApi.js` - Integração com API
- `Procfile` - Comando de deploy
- `Dockerfile` - Containerização
- `.env.example` - Variáveis de ambiente

---

## 🤝 Suporte

- 📖 [Documentação Completa](./README.md)
- 🚀 [Guia de Deploy](./DEPLOY.md)
- 🐛 [Issues](https://github.com/marcosl84/stremio-kick-addon/issues)

---

**Desenvolvido com ❤️ para a comunidade Stremio**

