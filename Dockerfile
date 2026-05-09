# ─────────────────────────────────────────────────────────────
# Stage 1: Build
# ─────────────────────────────────────────────────────────────
FROM node:22 AS builder

WORKDIR /app

# Copiar dependency manifests primero (mejor caching de layers)
COPY package*.json ./

# Instalar todas las deps (incluye dev para prisma generate)
RUN npm install

# Copiar código fuente
COPY . .

# Generar Prisma Client (incluye binarios nativos para el host)
RUN npx prisma generate

# Build de la app
RUN npm run build

# ─────────────────────────────────────────────────────────────
# Stage 2: Production
# ─────────────────────────────────────────────────────────────
FROM node:22 AS production

WORKDIR /app

# Copiar solo prod deps
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts

# Copiar built artifacts
COPY --from=builder /app/dist ./dist

# Copiar Prisma Client generado (con binarios nativos)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copiar schema para migraciones en runtime (opcional)
COPY prisma/schema.prisma ./

# Copiar prisma config
COPY prisma.config.ts ./

# Usuario no-root por seguridad
RUN useradd --create-home --shell /bin/bash appuser && chown -R appuser:appuser /app
USER appuser

# Exponer puerto
EXPOSE 3000

# Start
CMD ["node", "dist/main.js"]