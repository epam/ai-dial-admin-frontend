FROM node:24-alpine AS base

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
# Nx generateLockfile/createLockFile is incomplete for npm ci (nested resolutions).
# Restore root overrides dropped from the generated package.json, then regenerate
# the lockfile with npm so it matches what the runner will install.
RUN node tools/prepare-dist-install.mjs \
  && cd dist/apps/ai-dial-admin \
  && npm install --package-lock-only --omit=dev --ignore-scripts
RUN rm -rf /app/dist/apps/ai-dial-admin/.next/cache

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/ai-dial-admin ./
RUN npm ci --omit=dev --ignore-scripts

USER nextjs

EXPOSE 3000 9464

CMD ["npm", "run", "start"]
