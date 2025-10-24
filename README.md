# 📱 WhatsApp Viewer - Mais Chat

Aplicação web moderna para visualizar atendimentos de WhatsApp armazenados no MongoDB com suporte a mídia através do MinIO.

## 🌐 URL da Aplicação

**Produção**: [http://primazzoviewer.maischat.com](http://primazzoviewer.maischat.com)

## ✨ Funcionalidades Implementadas

- ✅ **Autenticação JWT** - Login seguro com tokens e bcrypt
- ✅ **Lista de Contatos** - Visualize todos os contatos com histórico completo
- ✅ **Busca Inteligente** - Busque por nome ou número de telefone em tempo real
- ✅ **Atendimentos** - Veja todos os atendimentos de cada contato
- ✅ **Filtro por Protocolo** - Busque atendimentos por número de protocolo
- ✅ **Filtro por Data** - Calendário interativo com seleção de intervalo
- ✅ **Histórico de Mensagens** - Visualize todas as mensagens de cada atendimento
- ✅ **Suporte a Mídia Completo** - Visualize e baixe:
  - 🖼️ Imagens (JPG, PNG, GIF, WebP)
  - 🎵 Áudios (MP3, OGG, WAV, Opus)
  - 🎥 Vídeos (MP4, WebM)
  - 📄 Documentos (PDF, XLSX, DOCX)
- ✅ **Botões de Download** - Baixe qualquer arquivo com um clique
- ✅ **Armazenamento MinIO/S3** - Arquivos servidos diretamente da nuvem
- ✅ **Interface Responsiva** - Design moderno inspirado no WhatsApp
- ✅ **Deploy Docker** - Build otimizado multi-stage pronto para produção

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────┐
│           Frontend (React + Vite)               │
│  - Interface moderna e responsiva               │
│  - Autenticação JWT                             │
│  - Busca e filtros avançados                    │
│  - Calendário de datas                          │
│  - Preview de mídia                             │
└─────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────┐
│          Backend (Node.js + Express)            │
│  - API RESTful                                  │
│  - Autenticação JWT                             │
│  - Integração MinIO/S3                          │
│  - Serve frontend em produção                   │
└─────────────────────────────────────────────────┘
         │                           │
         ↓                           ↓
┌──────────────────┐      ┌──────────────────────┐
│    MongoDB       │      │    MinIO/S3          │
│  - Atendimentos  │      │  - Imagens           │
│  - Mensagens     │      │  - Áudios            │
│  - Usuários      │      │  - Vídeos            │
│  - Contatos      │      │  - Documentos        │
│  - Arquivos      │      │                      │
└──────────────────┘      └──────────────────────┘
```

## 🚀 Deploy no Easypanel

A aplicação está configurada para deploy automatizado no **Easypanel** usando Docker.

### Deploy Rápido

1. **Faça push para Git**
2. **Configure no Easypanel**:
   - Crie novo serviço
   - Configure variáveis de ambiente (veja `.env.example`)
   - Exponha porta 3001
   - Configure domínio: `primazzoviewer.maischat.com`
3. **Deploy!**

📖 **Guia completo**: Veja [DEPLOY.md](DEPLOY.md) para instruções detalhadas passo a passo.

## 🛠️ Desenvolvimento Local

### Backend

```bash
cd backend
npm install
cp .env.example .env  # Configure as variáveis
node server.js
```

Servidor rodando em: `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend rodando em: `http://localhost:3000`

### Desenvolvimento com Hot Reload

```bash
# Backend com nodemon
cd backend
npm run dev

# Frontend com Vite
cd frontend
npm run dev
```

## 📦 Tecnologias

### Frontend
- ⚛️ React 18
- ⚡ Vite
- 🎨 CSS3 com design moderno
- 📡 Axios para requisições
- 🔐 JWT para autenticação
- 📅 Calendário customizado

### Backend
- 🟢 Node.js 20
- 🚂 Express
- 🔐 JWT (jsonwebtoken)
- 🔒 Bcrypt para senhas
- 🗄️ MongoDB Driver
- ☁️ AWS SDK S3 (compatível com MinIO)

### DevOps & Infraestrutura
- 🐳 Docker com multi-stage build
- 📦 Alpine Linux (imagem otimizada)
- 🔒 Container com usuário não-root
- 💚 Health checks configurados
- ☁️ MinIO/S3 para armazenamento de arquivos

## 🔧 Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `MONGODB_URI` | URI de conexão do MongoDB | `mongodb://user:pass@host:27017/` |
| `MONGODB_DATABASE` | Nome do banco | `suite` |
| `JWT_SECRET` | Chave secreta para JWT | `sua_chave_super_secreta` |
| `MINIO_ENDPOINT` | Endpoint do MinIO (sem protocolo) | `outros-minio.host` |
| `MINIO_ACCESS_KEY` | Access Key do MinIO | `xxx` |
| `MINIO_SECRET_KEY` | Secret Key do MinIO | `xxx` |
| `MINIO_BUCKET` | Nome do bucket | `primazzo` |
| `PORT` | Porta do servidor | `3001` |
| `NODE_ENV` | Ambiente | `production` |

## 📁 Estrutura do Projeto

```
whatsapp-viewer/
├── frontend/              # Aplicação React
│   ├── src/
│   │   ├── App.jsx       # Componente principal com lógica
│   │   ├── Login.jsx     # Tela de login
│   │   └── App.css       # Estilos modernos
│   ├── package.json
│   └── vite.config.js    # Configuração Vite
├── backend/               # API Node.js
│   ├── server.js         # Servidor Express + rotas
│   ├── minio-config.js   # Configuração e funções MinIO
│   ├── package.json
│   └── .env              # Variáveis (não commitar)
├── Dockerfile            # Build multi-stage otimizado
├── .dockerignore         # Arquivos excluídos do build
├── .env.example          # Template de variáveis
├── DEPLOY.md             # Guia completo de deploy
└── README.md             # Este arquivo
```

## 🔐 Segurança

- ✅ Autenticação JWT com expiração de 24h
- ✅ Senhas criptografadas com bcrypt
- ✅ Container roda com usuário não-root (nodejs)
- ✅ Variáveis de ambiente para todas as credenciais
- ✅ CORS configurado
- ✅ Validação de tokens em todas as rotas protegidas
- ✅ Conexão segura com MinIO via HTTPS

## 📊 API Endpoints

### Autenticação

#### `POST /api/login`
Login com usuário e senha.

**Body:**
```json
{
  "username": "usuario",
  "password": "senha"
}
```

**Resposta:**
```json
{
  "token": "jwt_token_aqui",
  "username": "usuario",
  "nome": "Nome do Usuário"
}
```

### Contatos

#### `GET /api/contatos`
Lista todos os contatos com atendimentos.

**Query Parameters:**
- `search` (opcional): Buscar por nome ou telefone
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Quantidade por página (padrão: 50)

### Atendimentos

#### `GET /api/contatos/:canalCliente/atendimentos`
Busca atendimentos de um contato específico.

**Query Parameters:**
- `protocolo` (opcional): Filtrar por protocolo
- `dataInicio` (opcional): Data inicial (YYYY-MM-DD)
- `dataFim` (opcional): Data final (YYYY-MM-DD)
- `page`, `limit`: Paginação

#### `GET /api/atendimentos/:idAtendimento`
Busca detalhes de um atendimento.

### Mensagens

#### `GET /api/atendimentos/:idAtendimento/mensagens`
Busca todas as mensagens de um atendimento.

**Query Parameters:**
- `page`, `limit`: Paginação (padrão: 500 mensagens)

### Arquivos

#### `GET /arquivos/*`
Serve arquivos do MinIO/S3.

Exemplos:
- `/arquivos/2025-10/13/imagem.jpg`
- `/arquivos/2025-10/13/audio.mp3`

### Health Check

#### `GET /api/health`
Verifica se a API está funcionando.

**Resposta:**
```json
{
  "status": "OK",
  "message": "API funcionando corretamente"
}
```

## 📊 Monitoramento

### Health Check Automático

O container possui health check que:
- ✅ Verifica a cada 30 segundos
- ✅ Timeout de 3 segundos
- ✅ Reinicia após 3 falhas consecutivas

### Logs

Monitore os logs para verificar:
- ✅ Conexão com MongoDB
- ✅ Conexão com MinIO (endpoint, bucket)
- ✅ Requisições de arquivos
- ✅ Erros e avisos

## 🎨 Interface do Usuário

### Painel de 3 Colunas

1. **Contatos** (Esquerda)
   - Lista de todos os contatos
   - Busca em tempo real
   - Avatar com inicial
   - Total de atendimentos

2. **Atendimentos** (Centro)
   - Atendimentos do contato selecionado
   - Filtro por protocolo
   - Filtro por intervalo de datas (calendário)
   - Status visual (cores)

3. **Mensagens** (Direita)
   - Histórico completo de mensagens
   - Preview de imagens
   - Player de áudio integrado
   - Player de vídeo
   - Botões de download para todos os arquivos

### Design

- 🎨 Interface inspirada no WhatsApp Web
- 📱 Totalmente responsivo
- 🌙 Cores suaves e modernas
- ⚡ Animações suaves
- 🖱️ Hover effects em todos os elementos interativos

## 🔄 Build e Deploy

### Build Local

```bash
# Build do frontend
cd frontend
npm run build

# O build estará em frontend/dist
```

### Build Docker

```bash
# Build da imagem
docker build -t whatsapp-viewer .

# Executar localmente
docker run -p 3001:3001 \
  -e MONGODB_URI="..." \
  -e MONGODB_DATABASE="suite" \
  -e JWT_SECRET="..." \
  -e MINIO_ENDPOINT="..." \
  -e MINIO_ACCESS_KEY="..." \
  -e MINIO_SECRET_KEY="..." \
  -e MINIO_BUCKET="primazzo" \
  whatsapp-viewer
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Add nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Notas Técnicas

- O backend usa agregação do MongoDB para otimizar consultas
- A busca é case-insensitive e usa regex para flexibilidade
- Paginação implementada em todas as listagens
- Frontend usa debounce na busca (500ms)
- Arquivos são servidos via streaming do MinIO
- Content-Type definido automaticamente por extensão
- Health check garante alta disponibilidade

## 📝 Licença

Este projeto é proprietário da **Mais Chat**.

## 👥 Suporte

- 📧 Email: suporte@maischat.com
- 🌐 Site: [maischat.com](https://maischat.com)
- 📱 WhatsApp Viewer: [primazzoviewer.maischat.com](http://primazzoviewer.maischat.com)

---

Desenvolvido com ❤️ pela equipe Mais Chat
