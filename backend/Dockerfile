# 🏗️ Multi-stage Docker build for AI-Capital Backend
# Stage 1: Dependencies (production only)
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Builder (compile TypeScript)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 3: Runner (minimal production image)
FROM node:18-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Copy only production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Copy compiled JavaScript
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

EXPOSE 5000
CMD ["node", "dist/index.js"]

