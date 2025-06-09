FROM node:20-alpine  AS base

FROM base AS deps
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN yarn build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/ai-dial-admin ./
COPY --from=builder --chown=nextjs:nodejs /app/yarn.lock ./
RUN yarn install

USER nextjs

EXPOSE 3000 9464

CMD ["yarn", "start"]
