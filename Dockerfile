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
# Nx 23.0.2+ drops overrides for packages promoted to direct deps in generatePackageJson
# (e.g. dompurify via monaco-editor). Reinject root overrides so runner `npm ci` matches the lockfile.
RUN node -e "const fs=require('fs');const p='dist/apps/ai-dial-admin/package.json';const pkg=JSON.parse(fs.readFileSync(p,'utf8'));const root=JSON.parse(fs.readFileSync('package.json','utf8'));pkg.overrides={...pkg.overrides,...root.overrides};fs.writeFileSync(p,JSON.stringify(pkg,null,2)+'\n')"
RUN rm -rf /app/dist/apps/ai-dial-admin/.next/cache

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/ai-dial-admin ./
COPY --from=builder --chown=nextjs:nodejs /app/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

USER nextjs

EXPOSE 3000 9464

CMD ["npm", "run", "start"]
