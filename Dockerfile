# Simple Dockerfile for AiCapital Backend Only
FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S aicapital -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY backend/ ./

# Build TypeScript
RUN npm run build

# Remove dev dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Change ownership
RUN chown -R aicapital:nodejs /app

# Switch to non-root user
USER aicapital

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/healthz', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
