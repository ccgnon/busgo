# 🚌 busGO — Plateforme de billets de bus + Agent IA Telegram

Application full-stack avec agent IA conversationnel sur Telegram.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────┐
│  Telegram User  │────▶│   BusBot Agent   │────▶│  Claude API   │
└─────────────────┘     │  (node-telegram) │     │  (tool_use)   │
                        └────────┬─────────┘     └───────────────┘
                                 │ HTTP
                                 ▼
                        ┌──────────────────┐     ┌───────────────┐
         React App ────▶│  Express Backend │────▶│  PostgreSQL   │
                        └──────────────────┘     └───────────────┘
```

## Stack

| Couche    | Technologie                                    |
|-----------|------------------------------------------------|
| Frontend  | React 18 · Vite · Zustand · React Router       |
| Backend   | Node.js · Express · JWT · bcrypt               |
| Base de données | PostgreSQL 16 + Prisma ORM             |
| Agent IA  | Claude (Anthropic) · tool_use · multi-turn     |
| Telegram  | node-telegram-bot-api · polling                |

---

## Démarrage

### 1. PostgreSQL (Docker)
```bash
docker-compose up -d
```

### 2. Backend
```bash
cd backend
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev          # → http://localhost:4000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev          # → http://localhost:5173
```

### 4. Agent Telegram
```bash
cd agent
cp .env.example .env
# Renseigner TELEGRAM_BOT_TOKEN et ANTHROPIC_API_KEY dans .env
npm install
npm run dev
```

---

## Configuration de l'agent (agent/.env)

```env
# Obtenir via @BotFather sur Telegram → /newbot
TELEGRAM_BOT_TOKEN=123456789:ABCdef...

# https://console.anthropic.com/api-keys
ANTHROPIC_API_KEY=sk-ant-api03-...

# URL de l'API busGO (backend)
BUSGO_API_URL=http://localhost:4000/api

# Compte de service pour les réservations (créé par le seed)
AGENT_USER_EMAIL=demo@busgo.fr
AGENT_USER_PASSWORD=demo1234
```

### Créer un bot Telegram
1. Ouvrir Telegram → chercher **@BotFather**
2. Envoyer `/newbot`
3. Choisir un nom (ex: `busGO Assistant`)
4. Choisir un username (ex: `busgo_assistant_bot`)
5. Copier le token → `TELEGRAM_BOT_TOKEN`

---

## Fonctionnalités de l'agent

L'agent comprend le langage naturel et peut :

| Intention | Exemple |
|-----------|---------|
| Rechercher un trajet | "Bus Paris Lyon demain matin" |
| Comparer les prix | "Le moins cher pour aller à Marseille ?" |
| Voir les sièges | "Quels sièges sont disponibles ?" |
| Réserver | "Je prends le bus de 10h, siège côté fenêtre" |
| Voir ses billets | "Mes réservations en cours" |
| Annuler | "Annule ma réservation BG3A7F2E1" |
| Infos pratiques | "Combien de temps Paris→Lyon ?" |

### Commandes Telegram
```
/start   → Accueil et présentation
/help    → Liste des fonctionnalités
/reset   → Effacer la conversation
/status  → État de la plateforme
```

---

## Architecture de l'agent

```
agent/
├── src/
│   ├── index.js                    ← Point d'entrée + validation env
│   ├── handlers/
│   │   ├── telegram.js             ← Bot Telegram, routing des commandes
│   │   └── agent.js                ← Boucle agentique Claude (tool_use loop)
│   ├── tools/
│   │   ├── definitions.js          ← Schémas des outils (format Anthropic)
│   │   ├── executor.js             ← Dispatch des appels d'outils
│   │   └── busgoClient.js          ← Client HTTP vers l'API busGO
│   ├── memory/
│   │   └── conversationMemory.js   ← Contexte par utilisateur (TTL 30min)
│   └── utils/
│       └── formatter.js            ← Helpers formatage Telegram
```

### Boucle agentique (agentic loop)
```
User message
     │
     ▼
Claude API (avec tools disponibles)
     │
     ├─ stop_reason: end_turn → Répondre à l'utilisateur
     │
     └─ stop_reason: tool_use
           │
           ├─ Exécuter les outils en parallèle (busGO API)
           │
           └─ Renvoyer les résultats à Claude → recommencer
```

### Outils disponibles pour Claude

| Outil | Description |
|-------|-------------|
| `search_trips` | Recherche de trajets |
| `get_trip_detail` | Détail + plan de sièges |
| `get_stations` | Liste des gares |
| `create_booking` | Créer une réservation |
| `get_booking` | Consulter une réservation |
| `cancel_booking` | Annuler une réservation |
| `get_my_bookings` | Historique des réservations |
| `check_api_health` | État de la plateforme |

---

## Roadmap

- [ ] Paiement Stripe réel
- [ ] Notifications push (départ dans 1h)
- [ ] Support photos de billet QR
- [ ] Redis pour mémoire de conversation persistante
- [ ] Webhook Telegram (remplacement du polling)
- [ ] Multi-langue (EN, ES, DE)
