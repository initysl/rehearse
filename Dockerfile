# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
WORKDIR /app/server

FROM base AS deps
COPY server/package*.json ./
RUN npm ci

FROM base AS build
COPY --from=deps /app/server/node_modules ./node_modules
COPY server/ ./
RUN npm run build
# Keep migration SQL available for dist/db/migrate.js at runtime.
RUN mkdir -p dist/db/migrations && cp -r src/db/migrations/*.sql dist/db/migrations/
RUN npm prune --omit=dev

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=5000
WORKDIR /app/server

COPY --from=build --chown=node:node /app/server/package*.json ./
COPY --from=build --chown=node:node /app/server/node_modules ./node_modules
COPY --from=build --chown=node:node /app/server/dist ./dist

USER node
EXPOSE 5000

CMD ["node", "dist/server.js"]
