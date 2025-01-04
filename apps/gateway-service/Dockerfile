FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apk add --no-cache libc6-compat && \
    corepack enable && \
    pnpm install turbo --global

FROM base AS builder
RUN apk add --no-cache openssl
WORKDIR /usr/src/app
COPY package.json pnpm-lock.yaml* ./
COPY . .
RUN turbo prune --scope=@cavaliercommerce/gateway-service --docker

FROM base AS installer
WORKDIR /usr/src/app

COPY .gitignore .gitignore
COPY reset.d.ts reset.d.ts
COPY --from=builder /usr/src/app/out/json/ .
COPY --from=builder /usr/src/app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /usr/src/app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /usr/src/app/out/full/ .

RUN pnpm install --frozen-lockfile
COPY turbo.json turbo.json
RUN npx prisma generate --schema apps/gateway-service/prisma/schema.prisma
RUN turbo run build --filter=@cavaliercommerce/gateway-service...

FROM node:20-alpine AS runner
WORKDIR /usr/src/app

RUN apk add --no-cache openssl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

COPY --from=installer --chown=nodejs:nodejs /usr/src/app/package.json ./package.json
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/apps/gateway-service/package.json ./apps/gateway-service/package.json
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/apps/gateway-service/dist ./apps/gateway-service/dist
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/apps/gateway-service/node_modules ./apps/gateway-service/node_modules
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/apps/gateway-service/prisma ./apps/gateway-service/prisma

USER nodejs
WORKDIR /usr/src/app/apps/gateway-service
CMD node dist/main.js
