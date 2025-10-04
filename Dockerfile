# Multi-stage build for production
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm ci --only=production
RUN cd frontend && npm ci --only=production
RUN cd backend && npm ci --only=production

# Build the application
FROM base AS builder
WORKDIR /app

# Copy source code
COPY . .

# Install all dependencies (including dev dependencies)
RUN npm install
RUN cd frontend && npm install
RUN cd backend && npm install

# Build frontend
RUN cd frontend && npm run build

# Build backend
RUN cd backend && npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules

# Copy package files for production
COPY --from=deps /app/package*.json ./
COPY --from=deps /app/backend/package*.json ./backend/

# Set correct permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose ports
EXPOSE 3000 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start both frontend and backend
CMD ["sh", "-c", "cd backend && npm start & cd .. && npm start"]
