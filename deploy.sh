#!/bin/bash

# Stremio Kick Add-on - Deploy Script
# Este script facilita o deploy em diferentes plataformas

echo "╔════════════════════════════════════════╗"
echo "║  🎮 Stremio Kick Add-on - Deploy       ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não está instalado!${NC}"
    echo "Visite: https://nodejs.org"
    exit 1
fi

echo -e "${GREEN}✅ Node.js encontrado:${NC} $(node --version)"
echo -e "${GREEN}✅ npm encontrado:${NC} $(npm --version)"
echo ""

# Menu de opções
echo -e "${BLUE}Escolha uma opção de deploy:${NC}"
echo ""
echo "1) 🌐 Render (Recomendado)"
echo "2) 🚄 Railway"
echo "3) ✈️  Fly.io"
echo "4) 🔧 Local (Desenvolvimento)"
echo "5) 🐳 Docker"
echo ""
read -p "Digite o número da opção (1-5): " choice

case $choice in
    1)
        echo ""
        echo -e "${BLUE}🌐 Render Deploy${NC}"
        echo "---"
        echo ""
        echo "1. Acesse: https://render.com"
        echo "2. Faça login com GitHub"
        echo "3. Clique em 'New +' → 'Web Service'"
        echo "4. Conecte o repositório 'stremio-kick-addon'"
        echo "5. Configure:"
        echo "   - Start Command: npm start"
        echo "   - PORT: 7000"
        echo ""
        read -p "Pressione Enter para abrir o site do Render..."
        open "https://render.com" 2>/dev/null || xdg-open "https://render.com" 2>/dev/null || echo "Abra https://render.com no seu navegador"
        ;;
    2)
        echo ""
        echo -e "${BLUE}🚄 Railway Deploy${NC}"
        echo "---"
        echo ""
        echo "1. Acesse: https://railway.app"
        echo "2. Faça login com GitHub"
        echo "3. Clique em 'New Project' → 'Deploy from GitHub'"
        echo "4. Selecione 'stremio-kick-addon'"
        echo "5. Adicione variáveis de ambiente:"
        echo "   - PORT=7000"
        echo "   - NODE_ENV=production"
        echo ""
        read -p "Pressione Enter para abrir o site do Railway..."
        open "https://railway.app" 2>/dev/null || xdg-open "https://railway.app" 2>/dev/null || echo "Abra https://railway.app no seu navegador"
        ;;
    3)
        echo ""
        echo -e "${BLUE}✈️  Fly.io Deploy${NC}"
        echo "---"
        echo ""
        
        if ! command -v flyctl &> /dev/null; then
            echo -e "${YELLOW}⚠️  CLI do Fly.io não está instalada${NC}"
            echo ""
            echo "Instalando Fly CLI..."
            curl -L https://fly.io/install.sh | sh
        fi
        
        echo -e "${GREEN}✅ Iniciando deploy no Fly.io...${NC}"
        echo ""
        fly auth login
        fly launch
        echo ""
        echo -e "${GREEN}✅ Deploy iniciado!${NC}"
        echo "Execute 'fly status' para ver o status"
        ;;
    4)
        echo ""
        echo -e "${BLUE}🔧 Desenvolvimento Local${NC}"
        echo "---"
        echo ""
        
        if [ ! -d "node_modules" ]; then
            echo -e "${YELLOW}📥 Instalando dependências...${NC}"
            npm install
        fi
        
        if [ ! -f ".env" ]; then
            echo -e "${YELLOW}📝 Criando arquivo .env...${NC}"
            cp .env.example .env
            echo -e "${GREEN}✅ Arquivo .env criado${NC}"
        fi
        
        echo ""
        echo -e "${GREEN}🚀 Iniciando servidor local...${NC}"
        echo ""
        npm run dev
        ;;
    5)
        echo ""
        echo -e "${BLUE}🐳 Docker Deploy${NC}"
        echo "---"
        echo ""
        
        if ! command -v docker &> /dev/null; then
            echo -e "${RED}❌ Docker não está instalado!${NC}"
            echo "Visite: https://www.docker.com/products/docker-desktop"
            exit 1
        fi
        
        echo -e "${YELLOW}🔨 Compilando imagem Docker...${NC}"
        docker build -t stremio-kick-addon .
        
        echo ""
        echo -e "${GREEN}✅ Imagem criada!${NC}"
        echo ""
        echo "Para rodar:"
        echo "  docker run -p 7000:7000 stremio-kick-addon"
        echo ""
        read -p "Rodar container agora? (s/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Ss]$ ]]; then
            docker run -p 7000:7000 stremio-kick-addon
        fi
        ;;
    *)
        echo -e "${RED}❌ Opção inválida!${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Pronto!${NC}"
echo ""
