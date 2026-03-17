# ── Étape 1 : Build React ──────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Activer pnpm via corepack
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

WORKDIR /app

# Installer les dépendances en premier (cache Docker optimal)
COPY package.json pnpm-lock.yaml* ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile

# Copier le reste et builder
COPY . .
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
# On build uniquement le frontend React (pas le serveur Express)
RUN pnpm exec vite build

# ── Étape 2 : Serve avec Nginx ─────────────────────────────────────────────
FROM nginx:1.27-alpine

# Config Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier le build React
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
