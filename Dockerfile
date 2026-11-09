FROM node:24.22.2-alpine3.24 AS base

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

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/ai-dial-admin ./
COPY --from=builder --chown=nextjs:nodejs /app/package-lock.json ./
RUN npm install --global npm@11.21.2 --ignore-scripts --no-audit --no-fund \
    && npm ci --omit=dev --ignore-scripts

USER nextjs

EXPOSE 3000 9464

CMD ["npm", "run", "start"]
