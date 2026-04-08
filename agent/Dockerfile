# Utilisation d'une image Node.js légère
FROM node:20-alpine

# Répertoire de travail
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances de production
RUN npm ci --only=production

# Copie du reste du code source
COPY . .

# Définition de l'environnement
ENV NODE_ENV=production

# Commande de démarrage
CMD ["node", "src/index.js"]