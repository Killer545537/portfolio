# Dockerfile for Web Frontend (TanStack Start + Bun)
# Build context should be set to the repository root

# ==========================================
# Stage 1: Build the Web frontend
# ==========================================
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY apps/web/package.json apps/web/bun.lock ./apps/web/

# Install dependencies
WORKDIR /app/apps/web
# --frozen-lockfile makes the build fail loudly on a stale bun.lock
# instead of silently resolving different versions than the repo pins.
RUN bun install --frozen-lockfile

# Copy the rest of the web app source
WORKDIR /app
COPY apps/web ./apps/web

# Copy me.toml to root (needed at build time - imported as ../../../../me.toml from src/lib/)
COPY me.toml ./me.toml

# Build the web app
WORKDIR /app/apps/web
RUN bun run build

# ==========================================
# Stage 2: Runtime
# ==========================================
FROM oven/bun:1-debian AS runtime

WORKDIR /app

# No apt layer needed: the base image already ships ca-certificates, and the
# health check below uses bun itself rather than curl.

# Copy the built web app
COPY --from=builder /app/apps/web/.output ./.output

# Copy me.toml for runtime (if needed)
COPY --from=builder /app/me.toml ./me.toml

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
	CMD bun -e "const r = await fetch('http://localhost:'+(process.env.PORT ?? 3000)); process.exit(r.ok ? 0 : 1)"

# Run the web server
CMD ["bun", "run", ".output/server/index.mjs"]
