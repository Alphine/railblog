# RailBlog — Next.js 15 + Payload CMS 3 (embedded), single service.
#
# Uses Debian-based "slim" images (not alpine) on purpose: Payload's `sharp`
# image-processing dependency ships native bindings that are prebuilt against
# glibc, and Alpine's musl libc causes native-binding mismatches. Requires
# `output: 'standalone'` in next.config.ts (already set).

# ---- Base -------------------------------------------------------------
FROM node:20-bookworm-slim AS base

# ---- Dependencies -------------------------------------------------------
FROM base AS deps
WORKDIR /app

# build-essential/python3 are a fallback in case any native dependency
# (e.g. sharp) needs to compile from source instead of using its
# prebuilt binary for this platform.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# ---- Build ----------------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---- Runtime ----------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

# Static assets (public/media is where the Media collection uploads to —
# mount the Railway Volume at /app/public/media so uploads persist).
COPY --from=builder /app/public ./public
RUN mkdir -p /app/public/media && chown -R nextjs:nodejs /app/public/media

# Next.js standalone output: a minimal server bundle with only the
# dependencies actually used at runtime.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
