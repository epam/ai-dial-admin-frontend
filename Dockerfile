FROM node:24.21-alpine3.24 AS base

# Pin npm for builds; remove its bundled dependencies from the final image below.
RUN apk upgrade --no-cache libcrypto3 libssl3 \
 && npm install --global npm@12.1.0

FROM base AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
RUN rm -rf /app/dist/apps/ai-dial-admin/.next/cache

FROM deps AS prod-deps
WORKDIR /app
RUN npm prune --omit=dev

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Runtime starts with node directly. Project overrides do not patch global npm's
# bundled dependencies, so remove npm/npx and its cache.
RUN npm cache clean --force \
 && rm -rf /usr/local/lib/node_modules/npm \
 && rm -f /usr/local/bin/npm /usr/local/bin/npx

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/ai-dial-admin ./
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000 9464

# Equivalent of the generated `npm run start` (`next start`), without npm.
CMD ["node", "node_modules/next/dist/bin/next", "start"]
