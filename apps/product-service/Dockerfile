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
RUN turbo prune --scope=@cavaliercommerce/product-service --docker

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
RUN npx prisma generate --schema apps/product-service/prisma/schema.prisma
RUN turbo run build --filter=@cavaliercommerce/product-service...

FROM node:20-alpine AS runner
WORKDIR /usr/src/app

RUN apk add --no-cache openssl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

COPY --from=installer --chown=nodejs:nodejs /usr/src/app/package.json ./package.json
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/apps/product-service/package.json ./apps/product-service/package.json
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/apps/product-service/dist ./apps/product-service/dist
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/apps/product-service/node_modules ./apps/product-service/node_modules
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/apps/product-service/prisma ./apps/product-service/prisma
COPY --from=installer --chown=nodejs:nodejs /usr/src/app/packages ./packages

USER nodejs
WORKDIR /usr/src/app/apps/product-service
RUN npx prisma generate
CMD node dist/main.js
