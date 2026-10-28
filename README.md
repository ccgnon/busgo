# 🚌 busGO CMR — Plateforme de réservation de bus au Cameroun

> Réservation intercité, paiement Mobile Money, agent IA Telegram

---

## 📦 Stack technique

| Composant | Technologie |
|-----------|-------------|
| Backend   | Node.js 20 + Express 4 + Prisma 5 |
| Base de données | PostgreSQL 16 |
| Cache     | Redis 7 |
| Frontend  | React 18 + Vite 5 + React Router v6 |
| Agent IA  | Telegraf 4 + Groq LLaMA 3.3-70B |
| Paiement  | MTN MoMo · Orange Money · Carte |
| SMS       | Africa's Talking (sandbox) |
| DevOps    | Docker Compose |

---

## 🛠️ Installation locale (Docker)

### Prérequis

- **Docker Desktop** ≥ 24 — https://docs.docker.com/get-docker/
- **Docker Compose** v2 (inclus dans Docker Desktop)
- **Git** ≥ 2.40

Vérifiez :

```bash
docker --version        # Docker version 24.x.x
docker compose version  # Docker Compose version v2.x.x
git --version
```

---

### Étape 1 — Cloner le projet

```bash
git clone https://gitlab.com/VOTRE_ORG/busgo.git
cd busgo
```

---

### Étape 2 — Configurer les variables d'environnement

Copiez le fichier exemple et éditez-le :

```bash
cp .env.example .env
```

Ouvrez `.env` dans votre éditeur et remplissez :

```dotenv
# ─── Base de données (laisser tel quel pour Docker local) ───
DATABASE_URL="postgresql://busgo:busgo2026@postgres:5432/busgo_db"

# ─── Sécurité JWT ───
JWT_SECRET="changez-moi-en-production-clé-très-longue"

# ─── Telegram Bot (optionnel pour l'agent IA) ───
# Créez un bot sur https://t.me/BotFather, copiez le token ici
TELEGRAM_BOT_TOKEN=""

# ─── Groq LLM (optionnel pour l'agent IA) ───
# Obtenez une clé gratuite sur https://console.groq.com
GROQ_API_KEY=""

# ─── Africa's Talking SMS (optionnel) ───
AT_API_KEY=""
AT_USERNAME="sandbox"

# ─── Email SMTP (optionnel) ───
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""

# ─── Redis (laisser tel quel pour Docker local) ───
REDIS_URL="redis://redis:6379"

# ─── Frontend → Backend ───
VITE_API_URL="http://localhost:4000"
```

> **Note** : Les variables optionnelles peuvent être laissées vides pour démarrer. Le projet fonctionnera sans agent IA ni SMS.

---

### Étape 3 — Démarrer les services Docker

```bash
# Construire et démarrer tous les services en arrière-plan
docker compose up -d --build
```

La première fois, Docker télécharge les images et construit les containers (environ 2-5 min selon votre connexion).

Vérifiez que tous les services sont démarrés :

```bash
docker compose ps
```

Résultat attendu :
```
NAME              STATUS          PORTS
busgo-postgres    Up (healthy)    5432/tcp
busgo-redis       Up              6379/tcp
busgo-backend     Up              0.0.0.0:4000->4000/tcp
busgo-frontend    Up              0.0.0.0:5173->5173/tcp
busgo-agent       Up              (si TELEGRAM_BOT_TOKEN renseigné)
```

---

### Étape 4 — Initialiser la base de données

```bash
# Appliquer le schéma Prisma
docker compose exec backend npm run db:push

# Insérer les données initiales (agences, gares, voyages de test, utilisateurs)
docker compose exec backend npm run db:seed
```

Résultat du seed :
```
✅ 3 agences créées
✅ 8 gares créées
✅ 2 utilisateurs créés
✅ 20 voyages créés (aujourd'hui + demain)
```

---

### Étape 5 — Accéder à l'application

| URL | Description |
|-----|-------------|
| http://localhost:5173 | **Frontend React** (interface principale) |
| http://localhost:4000 | **API Backend** |
| http://localhost:4000/health | Health check de l'API |
| http://localhost:5050 | **pgAdmin** (si activé, voir ci-dessous) |

---

## 🔑 Comptes de test

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@busgo.cm | busgo2026 | ADMIN |
| test@busgo.cm | busgo2026 | USER |

---

## 🗄️ pgAdmin (interface base de données)

Pour activer pgAdmin (visualiser la BDD via navigateur) :

```bash
docker compose --profile tools up -d pgadmin
```

Accès : http://localhost:5050
- Email : `admin@busgo.cm`
- Mot de passe : `busgo2026`

Connexion au serveur PostgreSQL :
- Host : `postgres`
- Port : `5432`
- Database : `busgo_db`
- Username : `busgo`
- Password : `busgo2026`

---

## 🔧 Commandes utiles

```bash
# Voir les logs en temps réel
docker compose logs -f

# Logs d'un service spécifique
docker compose logs -f backend
docker compose logs -f agent

# Redémarrer un service
docker compose restart backend

# Ouvrir Prisma Studio (interface BDD visuelle)
docker compose exec backend npm run db:studio
# puis ouvrez http://localhost:5555

# Arrêter tous les services
docker compose down

# Arrêter ET supprimer les volumes (reset complet)
docker compose down -v
```

---

## 📂 Structure du projet

```
busgo/
├── .env.example          ← Variables d'environnement (template)
├── .gitignore
├── docker-compose.yml    ← Orchestration Docker
├── README.md
│
├── backend/              ← API Node.js + Express
│   ├── Dockerfile
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma ← Modèles BDD
│   │   └── seed.js       ← Données initiales
│   └── src/
│       ├── index.js      ← Point d'entrée Express
│       ├── middleware/
│       │   └── auth.js   ← JWT + RBAC
│       └── routes/
│           ├── auth.js       ← /api/auth
│           ├── trips.js      ← /api/trips
│           ├── bookings.js   ← /api/bookings
│           ├── stations.js   ← /api/stations
│           ├── agencies.js   ← /api/agencies
│           ├── users.js      ← /api/users
│           └── admin.js      ← /api/admin
│
├── frontend/             ← React 18 + Vite
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── index.css
│       ├── App.jsx
│       └── pages/
│           ├── Home.jsx       ← Page d'accueil (Canvas Cameroun)
│           ├── Search.jsx     ← Résultats de recherche
│           ├── BookingFlow.jsx← Tunnel de réservation (4 étapes)
│           ├── MyBookings.jsx ← Mes voyages
│           ├── Login.jsx      ← Connexion
│           ├── Register.jsx   ← Inscription
│           └── Admin.jsx      ← Tableau de bord admin
│
└── agent/                ← Agent IA Telegram "Baobab"
    ├── Dockerfile
    ├── package.json
    └── src/
        └── index.js      ← Telegraf + Groq (PID lock intégré)
```

---

## 🌐 API Reference

### Authentification

```
POST /api/auth/register  — Inscription
POST /api/auth/login     — Connexion (retourne JWT)
GET  /api/auth/me        — Profil utilisateur (auth requise)
```

### Voyages

```
GET  /api/trips/search?from=YDE&to=DLA&date=2026-10-15&pax=1
GET  /api/trips/:id
GET  /api/trips/:id/seats
POST /api/trips          — Admin/Agence uniquement
```

### Réservations

```
POST /api/bookings            — Créer une réservation
GET  /api/bookings/my         — Mes réservations (auth)
GET  /api/bookings/:id        — Détail
POST /api/bookings/:id/cancel — Annuler
POST /api/bookings/:id/validate — Valider (code 6 chiffres)
```

### Admin

```
GET /api/admin/stats     — Statistiques globales
GET /api/admin/bookings  — Liste toutes les réservations
```

---

## ⚙️ Variables d'environnement complètes

| Variable | Description | Requis |
|----------|-------------|--------|
| `DATABASE_URL` | URL PostgreSQL | ✅ |
| `JWT_SECRET` | Clé secrète JWT (32+ chars) | ✅ |
| `REDIS_URL` | URL Redis | ✅ |
| `TELEGRAM_BOT_TOKEN` | Token bot Telegram (BotFather) | ⚪ |
| `GROQ_API_KEY` | Clé API Groq (LLaMA) | ⚪ |
| `AT_API_KEY` | Africa's Talking (SMS) | ⚪ |
| `AT_USERNAME` | Nom d'utilisateur AT (ex: sandbox) | ⚪ |
| `SMTP_HOST` | Serveur SMTP | ⚪ |
| `SMTP_PORT` | Port SMTP (587 = TLS) | ⚪ |
| `SMTP_USER` | Email d'envoi | ⚪ |
| `SMTP_PASS` | Mot de passe SMTP | ⚪ |
| `VITE_API_URL` | URL de l'API vue depuis le frontend | ✅ |

---

## 🔴 Bugs connus et correctifs appliqués

### 1. Prisma P1012 — Enums invalides

**Symptôme** : `Error: P1012 - This line is not an enum value definition`

**Cause** : Enums déclarés sur une seule ligne avec le parseur wasm de Prisma 5.

**Fix appliqué** : Tous les enums sont déclarés multi-lignes AVANT les blocs `model` dans `schema.prisma`.

### 2. Vite — Unterminated string constant (Admin.jsx)

**Symptôme** : `SyntaxError: Unterminated string constant` lignes 237, 242

**Cause** : Apostrophes parasites `gap:4'` et `fontSize:10'` dans les styles JSX.

**Fix appliqué** : Styles corrigés dans `Admin.jsx`.

### 3. Telegram 409 Conflict

**Symptôme** : `Error 409: Conflict: terminated by other getUpdates request`

**Cause** : Deux instances du bot en concurrence sur le polling.

**Fix appliqué** : Fichier de lock PID + `deleteWebhook({ drop_pending_updates: true })` au démarrage dans `agent/src/index.js`.

---

## 📄 Licence

MIT — © 2026 busGO Technologies SARL, Yaoundé, Cameroun.
