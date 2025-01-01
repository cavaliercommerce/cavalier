FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apk add --no-cache libc6-compat && \
    corepack enable && \
    pnpm install turbo --global

FROM base AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY . .
RUN turbo prune --scope=@cavaliercommerce/storefront --docker

FROM base AS installer
WORKDIR /app

COPY .gitignore .gitignore
COPY reset.d.ts reset.d.ts
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

RUN turbo run build --filter=@cavaliercommerce/storefront...

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=installer /app/apps/storefront/next.config.js .
COPY --from=installer /app/apps/storefront/package.json .

COPY --from=installer --chown=nextjs:nodejs /app/apps/storefront/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/storefront/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/storefront/public ./apps/web/public

CMD node apps/storefront/server.js