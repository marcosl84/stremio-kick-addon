![Stremio Kick Add-on](https://img.shields.io/badge/Stremio-Kick%20Add--on-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node.js](https://img.shields.io/badge/node.js-14%2B-green)

# 🎮 Stremio Kick Add-on

Add-on oficial para [Kick.com](https://kick.com) no [Stremio](https://www.stremio.com/). Acesse streams ao vivo, VODs e canais diretamente do seu Stremio!

## ✨ Recursos

- 🔴 **Streams ao Vivo** - Acompanhe criadores de conteúdo em tempo real
- 🎥 **VODs** - Assista vídeos sob demanda dos seus criadores favoritos
- 📺 **Canais** - Navegue e descubra novos canais
- 🔍 **Busca** - Procure por criadores, canais e conteúdo específico
- 🏷️ **Categorias** - Filtre por gênero (Gaming, Music, IRL, Creative, Sports, Educational, Just Chatting)
- 👥 **Status Online** - Veja quem está transmitindo agora
- ⚡ **Cache Inteligente** - Melhor performance com cache de 5 minutos
- 🌐 **Totalmente Compatível** - Funciona com todos os criadores do Kick

## 🚀 Instalação

### Opção 1: Instalação Rápida (Recomendado)

1. Clone ou faça download deste repositório
2. Execute:
```bash
npm install
npm start
```
3. Abra o Stremio
4. Vá para "Adicionar Addon"
5. Cole a URL: `http://localhost:7000/manifest.json`

### Opção 2: Instalação com Deploy

#### Heroku
```bash
git push heroku main
```

#### Vercel
```bash
vercel
```

#### Docker
```bash
docker build -t stremio-kick-addon .
docker run -p 7000:7000 stremio-kick-addon
```

## 📋 Requisitos

- **Node.js**: 14.0.0 ou superior
- **npm**: 6.0.0 ou superior
- **Stremio**: Versão 4.4 ou superior

## 🛠️ Desenvolvimento

### Setup Local

```bash
# Clonar o repositório
git clone https://github.com/marcosl84/stremio-kick-addon.git
cd stremio-kick-addon

# Instalar dependências
npm install

# Criar arquivo .env
cp .env.example .env

# Iniciar em modo desenvolvimento (com auto-reload)
npm run dev
```

### Estrutura do Projeto

```
stremio-kick-addon/
├── index.js                 # Arquivo principal da aplicação
├── manifest.json            # Configuração do add-on para Stremio
├── package.json             # Dependências e scripts
├── .env.example             # Exemplo de variáveis de ambiente
├── .gitignore               # Arquivos ignorados pelo Git
├── src/
│   ├── kickApi.js          # Integração com API do Kick
│   └── handlers.js         # Handlers para catálogo, meta e stream
└── README.md               # Este arquivo
```

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=7000
HOST=0.0.0.0
CACHE_DURATION=30
MAX_RESULTS=50
```

## 📚 Como Funciona

### Fluxo de Dados

1. **Requisição do Stremio** → Addon recebe requisição
2. **Busca na API do Kick** → Faz requisição à API do Kick
3. **Cache** → Armazena resultado por 5 minutos
4. **Formatação** → Formata dados para padrão Stremio
5. **Resposta** → Retorna ao Stremio para exibição

### Endpoints do Add-on

| Endpoint | Descrição |
|----------|-----------|
| `GET /manifest.json` | Manifesto do add-on |
| `GET /` | Página inicial com informações |
| `GET /health` | Status do servidor |
| `POST /addon/manifest.json` | Manifesto (via SDK) |
| `POST /addon/catalog/:type/:id` | Catálogo de conteúdo |
| `POST /addon/meta/:type/:id` | Metadados de um item |
| `POST /addon/stream/:type/:id` | Stream de um item |

## 🎯 Tipos de Conteúdo Suportados

### Tipo: `live`
- Streams ao vivo do Kick
- Suporta filtro por categoria
- Mostra número de visualizadores

### Tipo: `vod`
- Vídeos sob demanda
- Busca por criador ou título
- Mostra duração e visualizações

### Tipo: `channel`
- Canais/Criadores
- Busca por nome
- Filtro por categoria
- Mostra seguidores e status

## 🔧 Customização

### Adicionar Novas Categorias

Edite `manifest.json`:
```json
"options": [
  "gaming",
  "music",
  "irl",
  "creative",
  "sports",
  "educational",
  "just_chatting",
  "sua_categoria"
]
```

### Ajustar Duração do Cache

Em `.env`:
```env
CACHE_DURATION=60  # 60 minutos em vez de 30
```

### Personalizar Manifesto

Edite `manifest.json` para:
- Mudar nome e descrição
- Ajustar logo e background
- Adicionar email de suporte
- Modificar tipos de catálogo

## 🐛 Troubleshooting

### O add-on não aparece no Stremio
- Certifique-se que o servidor está rodando
- Verifique se a URL é acessível
- Reinicie o Stremio
- Tente adicionar novamente a URL

### Sem resultados nas buscas
- Verifique a conexão com a internet
- Limpe o cache do navegador
- Reinicie o servidor
- Verifique logs de erro no console

### "Connection refused"
- Verifique se a porta 7000 está disponível
- Mude a porta em `.env` se necessário
- Reinicie o servidor

## 📝 API do Kick

Este add-on utiliza a API pública do Kick. Consulte a [documentação do Kick](https://kick.com/api) para mais informações.

### Rate Limiting
- Limite de requisições: Conforme políticas do Kick
- Cache local: 5 minutos para reduzir requisições

## 🚀 Deploy

### Heroku

```bash
heroku create seu-app-name
git push heroku main
heroku open
```

### Vercel

```bash
vercel
# Siga as instruções no terminal
```

### Railway

```bash
railway link
railway up
```

### Render

1. Conecte seu repositório GitHub
2. Crie novo Web Service
3. Defina variáveis de ambiente
4. Deploy automático

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork deste repositório
2. Crie uma branch para sua feature (`git checkout -b feature/sua-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona feature X'`)
4. Push para a branch (`git push origin feature/sua-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## ⚠️ Aviso Legal

Este add-on não é afiliado, endossado ou patrocinado pelo Kick.com. Este é um projeto comunitário independente.

## 📞 Suporte

- **Issues**: Abra uma [issue no GitHub](https://github.com/marcosl84/stremio-kick-addon/issues)
- **Discussões**: Use [GitHub Discussions](https://github.com/marcosl84/stremio-kick-addon/discussions)
- **Email**: Envie um email com dúvidas

## 🙏 Agradecimentos

- [Stremio](https://www.stremio.com/) pelo framework incrível
- [Kick.com](https://kick.com) pela plataforma
- Comunidade Stremio pelos feedbacks e contribuições

## 📊 Status do Projeto

- ✅ Busca de criadores
- ✅ Streams ao vivo
- ✅ VODs
- ✅ Canais
- 🔄 Status online em tempo real
- 🔄 Integração com banco de dados
- 🔄 Suporte a notificações

---

**Desenvolvido com ❤️ por [marcosl84](https://github.com/marcosl84)**

![GitHub](https://img.shields.io/badge/GitHub-marcosl84-black?style=flat&logo=github)
