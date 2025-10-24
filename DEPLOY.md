# 🚀 Guia de Deploy - WhatsApp Viewer

Este documento descreve como fazer o deploy da aplicação WhatsApp Viewer no Easypanel (ou qualquer plataforma Docker).

## 📋 Pré-requisitos

Antes de fazer o deploy, certifique-se de ter:

1. **MongoDB** configurado e acessível
2. **MinIO/S3** configurado com o bucket criado
3. Acesso ao **Easypanel** ou outra plataforma Docker

## 🐳 Deploy no Easypanel

### Passo 1: Criar Novo Projeto

1. Acesse seu painel do Easypanel
2. Crie um novo projeto/serviço
3. Escolha "Deploy from Source" (Git)

### Passo 2: Configurar Repositório

1. Conecte seu repositório Git
2. Selecione a branch principal
3. O Dockerfile na raiz será detectado automaticamente

### Passo 3: Configurar Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no Easypanel:

```env
# MongoDB
MONGODB_URI=mongodb://usuario:senha@host:porta/?tls=false&authSource=admin&authMechanism=SCRAM-SHA-256
MONGODB_DATABASE=suite

# Servidor
PORT=3001
NODE_ENV=production

# JWT
JWT_SECRET=sua_chave_secreta_super_segura

# MinIO/S3
MINIO_ENDPOINT=outros-minio.8a2h9d.easypanel.host
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=w4KMC60yzlbSbPPHwwCC
MINIO_SECRET_KEY=1hN5KJLotqKz2MTBaIUKMzCQ8sP8EUNGiFmkXZlp
MINIO_BUCKET=primazzo
MINIO_REGION=us-east-1
```

⚠️ **IMPORTANTE**: Use suas próprias credenciais reais!

### Passo 4: Configurar Porta e Domínio

- Porta interna do container: **3001**
- Exponha a porta 3001 para acesso externo
- Configure o domínio: **http://primazzoviewer.maischat.com**
  - No Easypanel, vá em Settings > Domains
  - Adicione o domínio customizado
  - Configure o DNS do domínio para apontar para o servidor Easypanel

### Passo 5: Deploy

1. Clique em "Deploy"
2. Aguarde o build (pode levar alguns minutos)
3. Verifique os logs para confirmar que tudo iniciou corretamente

### Passo 6: Verificar Health Check

Acesse `http://primazzoviewer.maischat.com/api/health`

Deve retornar:
```json
{
  "status": "OK",
  "message": "API funcionando corretamente"
}
```

### Passo 7: Acessar Aplicação

Acesse `http://primazzoviewer.maischat.com` para ver a aplicação funcionando!

## 🏗️ Arquitetura do Build

O Dockerfile utiliza **multi-stage build** para otimização:

```
┌─────────────────────────────────────┐
│  Stage 1: Frontend Builder          │
│  - Node 20 Alpine                   │
│  - Build do React/Vite              │
│  - Gera pasta /dist                 │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│  Stage 2: Production                │
│  - Node 20 Alpine                   │
│  - Copia backend                    │
│  - Copia /dist → /public            │
│  - Serve tudo via Express           │
└─────────────────────────────────────┘
```

## 🔒 Segurança

O container:
- ✅ Roda com usuário não-root (`nodejs`)
- ✅ Usa `dumb-init` para handling de sinais
- ✅ Apenas dependências de produção instaladas
- ✅ Health check configurado

## 📊 Monitoramento

### Logs

Acesse os logs no Easypanel para monitorar:

```
[MINIO] ✓ Conexão estabelecida com sucesso!
[MINIO] ✓ Endpoint: https://outros-minio.8a2h9d.easypanel.host
[MINIO] ✓ Bucket 'primazzo' encontrado.
Conectado ao MongoDB
Servidor rodando na porta 3001
```

### Health Check

O container possui health check automático que:
- Verifica a cada 30 segundos
- Timeout de 3 segundos
- Reinicia após 3 falhas consecutivas

## 🔧 Troubleshooting

### Problema: Conexão com MongoDB falha

**Solução**:
- Verifique se a URI do MongoDB está correta
- Confirme que o MongoDB está acessível da rede do Easypanel
- Verifique usuário e senha

### Problema: Arquivos não carregam do MinIO

**Solução**:
- Confirme que o endpoint MinIO NÃO tem prefixo `console-`
- Verifique as credenciais de acesso
- Confirme que o bucket existe
- Teste a conexão nos logs de inicialização

### Problema: Frontend não carrega

**Solução**:
- Verifique se `NODE_ENV=production` está configurado
- Confirme que o build do frontend foi bem-sucedido nos logs
- Acesse a rota raiz (não `/api`)

### Problema: Erro 502 Bad Gateway

**Solução**:
- Verifique se a porta 3001 está corretamente mapeada
- Confirme que o container está rodando
- Verifique os logs do container

## 🔄 Rebuild e Atualização

Para atualizar a aplicação:

1. Faça push das alterações para o Git
2. No Easypanel, clique em "Redeploy"
3. Aguarde o novo build
4. Verifique os logs

## 📝 Variáveis de Ambiente - Referência Completa

| Variável | Obrigatória | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `MONGODB_URI` | ✅ | URI de conexão do MongoDB | `mongodb://user:pass@host:27017/` |
| `MONGODB_DATABASE` | ✅ | Nome do banco de dados | `suite` |
| `PORT` | ❌ | Porta do servidor (padrão: 3001) | `3001` |
| `NODE_ENV` | ✅ | Ambiente de execução | `production` |
| `JWT_SECRET` | ✅ | Chave secreta para JWT | `sua_chave_secreta` |
| `MINIO_ENDPOINT` | ✅ | Endpoint do MinIO (sem protocolo) | `outros-minio.host` |
| `MINIO_PORT` | ❌ | Porta do MinIO (padrão: 443) | `443` |
| `MINIO_USE_SSL` | ❌ | Usar SSL (padrão: true) | `true` |
| `MINIO_ACCESS_KEY` | ✅ | Access Key do MinIO | `xxx` |
| `MINIO_SECRET_KEY` | ✅ | Secret Key do MinIO | `xxx` |
| `MINIO_BUCKET` | ✅ | Nome do bucket | `primazzo` |
| `MINIO_REGION` | ❌ | Região do S3 (padrão: us-east-1) | `us-east-1` |

## 🎯 Próximos Passos

Após o deploy bem-sucedido:

1. ✅ Configure backup do MongoDB
2. ✅ Configure SSL/HTTPS no domínio
3. ✅ Configure usuários no banco de dados `usuarios_viewer`
4. ✅ Monitore logs regularmente
5. ✅ Configure alertas de saúde do container

## 💡 Dicas

- Use domínios customizados no Easypanel para melhor usabilidade
- Configure variáveis de ambiente através do painel (não hardcode)
- Ative logs persistentes para troubleshooting
- Monitore uso de recursos (CPU/Memória)

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do container
2. Teste o endpoint `/api/health`
3. Confirme todas as variáveis de ambiente
4. Verifique conectividade com MongoDB e MinIO
