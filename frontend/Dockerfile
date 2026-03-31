# ── Stage 1: deps ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time public variables — must be declared as ARG before ENV to be
# available during `next build`. These are baked into the static output.
# INTERNAL_API_BASE_URL is NOT here — it is a runtime variable (server-side only).
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# ── Stage 3: runner ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# INTERNAL_API_BASE_URL is injected at runtime via docker-compose environment:
# It is read by serverFetch() in lib/serverApi.ts — never compiled into the bundle.
# Default fallback is http://backend:8000 (see lib/serverApi.ts).

EXPOSE 3000
CMD ["node", "server.js"]
