FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ENV NODE_ENV=production
# Pas d'EXPOSE nécessaire pour le polling Telegram
CMD ["node", "src/index.js"]
