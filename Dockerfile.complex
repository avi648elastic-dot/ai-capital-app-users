# Multi-stage Dockerfile for AiCapital Application
# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci

# Copy frontend source code
COPY frontend/ ./

# Build frontend
RUN npm run build

# Stage 2: Build Backend
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci

# Copy backend source code
COPY backend/ ./

# Build backend TypeScript
RUN npm run build

# Stage 3: Production Runtime
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S aicapital -u 1001

WORKDIR /app

# Copy built frontend from builder stage
COPY --from=frontend-builder --chown=aicapital:nodejs /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder --chown=aicapital:nodejs /app/frontend/public ./frontend/public
COPY --from=frontend-builder --chown=aicapital:nodejs /app/frontend/package*.json ./frontend/

# Copy built backend from builder stage
COPY --from=backend-builder --chown=aicapital:nodejs /app/backend/dist ./backend/dist
COPY --from=backend-builder --chown=aicapital:nodejs /app/backend/package*.json ./backend/

# Install ONLY production dependencies for runtime
WORKDIR /app/backend
RUN npm ci --omit=dev && npm cache clean --force

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