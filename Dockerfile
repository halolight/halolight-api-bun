# Use official Bun image
FROM oven/bun:1.1-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Build application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Drizzle types and build
RUN bun run db:generate
RUN bun run build

# Production image
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3002

# Copy only necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle ./drizzle

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bunuser

# Change ownership and switch user
RUN chown -R bunuser:nodejs /app
USER bunuser

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:3002/api/health').then(r => r.ok ? process.exit(0) : process.exit(1))" || exit 1

# Start server
CMD ["bun", "run", "start"]
