# ─── Kirova AI — Dockerfile ───────────────────────────────────────────────────
# Multi-stage build: builds client + server, then runs in a lean production image

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install all dependencies (monorepo root + workspaces)
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm ci --ignore-scripts

# Copy source
COPY client/ ./client/
COPY server/ ./server/

# Build React client
RUN npm run build:client

# Build Express server (TypeScript → JavaScript)
RUN npm run build:server

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy only production dependencies
COPY package.json package-lock.json ./
COPY server/package.json ./server/
RUN npm ci --workspace=server --omit=dev --ignore-scripts

# Copy compiled server
COPY --from=builder /app/server/dist ./server/dist

# Copy compiled React client (Express serves it as static files)
COPY --from=builder /app/client/dist ./client/dist

# Copy DB migration SQL beside the compiled migration module
COPY server/src/db/schema.sql ./server/dist/db/schema.sql

# Expose API port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

# Start the server
CMD ["node", "server/dist/index.js"]
