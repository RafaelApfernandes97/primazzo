# Multi-stage Dockerfile para WhatsApp Viewer
# Build frontend e backend em uma única imagem

# ====================
# Stage 1: Build Frontend
# ====================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copiar package files do frontend
COPY frontend/package*.json ./

# Instalar dependências do frontend
RUN npm ci --only=production

# Copiar código fonte do frontend
COPY frontend/ ./

# Build do frontend (Vite)
RUN npm run build

# ====================
# Stage 2: Backend + Frontend Build
# ====================
FROM node:20-alpine AS production

# Instalar dumb-init para melhor handling de sinais
RUN apk add --no-cache dumb-init

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copiar package files do backend
COPY backend/package*.json ./

# Instalar dependências do backend (apenas produção)
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar código do backend
COPY backend/ ./

# Copiar build do frontend para ser servido pelo backend
COPY --from=frontend-builder /app/frontend/dist ./public

# Mudar ownership para usuário não-root
RUN chown -R nodejs:nodejs /app

# Trocar para usuário não-root
USER nodejs

# Expor porta
EXPOSE 3001

# Variáveis de ambiente padrão (podem ser sobrescritas)
ENV NODE_ENV=production \
    PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Usar dumb-init para melhor handling de sinais
ENTRYPOINT ["dumb-init", "--"]

# Iniciar aplicação
CMD ["node", "server.js"]
