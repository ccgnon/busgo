#!/bin/bash
# ╔══════════════════════════════════════════════════════╗
# ║           busGO — Démarrage unifié                   ║
# ╚══════════════════════════════════════════════════════╝

set -e
cd "$(dirname "$0")"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║        🚌 busGO  — Démarrage         ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# ── 1. Vérifier les .env ──────────────────────────────────
check_env() {
  local dir=$1 file="$1/.env" example="$1/.env.example"
  if [ ! -f "$file" ]; then
    if [ -f "$example" ]; then
      echo -e "${YELLOW}⚠️  $dir/.env manquant → copie depuis .env.example${NC}"
      cp "$example" "$file"
    else
      echo -e "${RED}❌  $dir/.env introuvable${NC}"; exit 1
    fi
  else
    echo -e "${GREEN}✅  $dir/.env OK${NC}"
  fi
}

check_env "backend"
check_env "agent"

# ── 2. Vérifier Docker / PostgreSQL ──────────────────────
echo ""
echo -e "${BLUE}🐘 Vérification PostgreSQL...${NC}"
if docker compose ps 2>/dev/null | grep -q "busgo_postgres.*running"; then
  echo -e "${GREEN}✅  PostgreSQL déjà en cours${NC}"
else
  echo -e "${YELLOW}▶  Démarrage PostgreSQL (Docker)...${NC}"
  docker compose up -d
  echo -e "${BLUE}⏳  Attente PostgreSQL (10s)...${NC}"
  sleep 10
fi

# ── 3. Migrations Prisma si nécessaire ───────────────────
echo ""
echo -e "${BLUE}🗄️  Vérification base de données...${NC}"
cd backend
if npx prisma migrate status 2>/dev/null | grep -q "No pending migrations"; then
  echo -e "${GREEN}✅  Migrations à jour${NC}"
else
  echo -e "${YELLOW}▶  Application des migrations...${NC}"
  npx prisma db push --accept-data-loss
fi
cd ..

# ── 4. Vérifier les node_modules ─────────────────────────
echo ""
echo -e "${BLUE}📦 Vérification des dépendances...${NC}"
for dir in backend frontend agent; do
  if [ ! -d "$dir/node_modules" ]; then
    echo -e "${YELLOW}▶  npm install dans $dir...${NC}"
    npm install --prefix "$dir" --silent
  else
    echo -e "${GREEN}✅  $dir/node_modules OK${NC}"
  fi
done

# ── 5. Vérifier concurrently ─────────────────────────────
if [ ! -d "node_modules" ]; then
  echo ""
  echo -e "${YELLOW}▶  Installation de concurrently...${NC}"
  npm install --silent
fi

# ── 6. Lancer tout ───────────────────────────────────────
echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  🚀 Démarrage de tous les services   ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BLUE}Backend  ${NC}→ http://localhost:4000"
echo -e "  ${GREEN}Frontend ${NC}→ http://localhost:5173"
echo -e "  ${MAGENTA:-$'\033[0;35m'}Agent    ${NC}→ Telegram Bot"
echo ""
echo -e "  ${YELLOW}Ctrl+C pour tout arrêter${NC}"
echo ""

npm run dev
