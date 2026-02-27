# Backend Dockerfile — Node 20 Alpine
# Supports both development (with ts-node-dev) and production builds

FROM node:20-alpine AS base
WORKDIR /app

# OpenSSL is required by Prisma on Alpine
RUN apk add --no-cache openssl

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source and Prisma schema
COPY . .

# Generate Prisma client
RUN npx prisma generate

# ─── Development target ─────────────────────────────
FROM base AS development
EXPOSE 5001
CMD ["npm", "run", "dev"]

# ─── Production build ───────────────────────────────
FROM base AS build
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/prisma ./prisma

EXPOSE 5001
CMD ["node", "dist/index.js"]
