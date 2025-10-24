require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { getFile, testConnection } = require('./minio-config');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Rota de login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }

    // Buscar usuário no MongoDB
    const user = await db.collection('usuarios_viewer').findOne({
      username,
      ativo: true
    });

    if (!user) {
      console.log(`[LOGIN] Usuário não encontrado: ${username}`);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Validar senha com bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.log(`[LOGIN] Senha incorreta para usuário: ${username}`);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        username: user.username,
        nome: user.nome,
        userId: user._id
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`[LOGIN] Login bem-sucedido: ${username}`);

    res.json({
      token,
      username: user.username,
      nome: user.nome
    });

  } catch (error) {
    console.error('[LOGIN] Erro:', error);
    res.status(500).json({ error: 'Erro ao processar login' });
  }
});

// Servir arquivos do MinIO
app.get('/arquivos/*', async (req, res) => {
  try {
    // Extrair o caminho do arquivo da URL
    // req.params[0] contém tudo depois de /arquivos/
    const requestedPath = req.params[0];

    // No MinIO, os arquivos estão em arquivos/2025-10/13/arquivo.jpg
    // Então precisamos adicionar "arquivos/" no início
    const minioPath = `arquivos/${requestedPath}`;

    console.log(`[FILES] GET ${req.originalUrl}`);
    console.log(`[FILES] Buscando no MinIO: ${minioPath}`);

    // Buscar o arquivo do MinIO
    const stream = await getFile(minioPath);

    // Determinar o tipo de conteúdo baseado na extensão do arquivo
    const ext = path.extname(requestedPath).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.ogg': 'audio/ogg',
      '.webm': 'video/webm',
      '.oga': 'audio/ogg',
      '.opus': 'audio/opus'
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    // Fazer pipe do stream do MinIO para a resposta
    stream.pipe(res);

    stream.on('error', (error) => {
      console.error(`[FILES] Erro ao fazer stream do arquivo ${minioPath}:`, error);
      if (!res.headersSent) {
        res.status(404).json({ error: 'Arquivo não encontrado' });
      }
    });

  } catch (error) {
    console.error('[FILES] Erro ao buscar arquivo:', error);
    if (error.code === 'NotFound') {
      res.status(404).json({ error: 'Arquivo não encontrado' });
    } else {
      res.status(500).json({ error: 'Erro ao buscar arquivo' });
    }
  }
});

// MongoDB connection
const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db(process.env.MONGODB_DATABASE);
    console.log('Conectado ao MongoDB');
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
}

// Função para extrair número de telefone do campo canal_cliente
function extractPhoneNumber(canalCliente) {
  if (!canalCliente) return '';
  // Remove @c.us e formata o número
  return canalCliente.replace('@c.us', '');
}

// Rotas da API

// 1. Listar todos os contatos únicos dos atendimentos com busca
app.get('/api/contatos', authenticateToken, async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Pipeline de agregação para obter contatos únicos
    const pipeline = [
      {
        $match: {
          canal_cliente: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$canal_cliente',
          id_user: { $first: '$id_user' },
          ultimoAtendimento: { $max: '$date' },
          totalAtendimentos: { $sum: 1 },
          status: { $last: '$status' }
        }
      },
      {
        $lookup: {
          from: 'clientes_users',
          localField: 'id_user',
          foreignField: '_id',
          as: 'usuario'
        }
      },
      {
        $addFields: {
          telefone: {
            $replaceAll: {
              input: '$_id',
              find: '@c.us',
              replacement: ''
            }
          },
          nome: { $arrayElemAt: ['$usuario.nome', 0] }
        }
      },
      {
        $project: {
          _id: 0,
          id: '$_id',
          telefone: 1,
          nome: 1,
          id_user: 1,
          ultimoAtendimento: 1,
          totalAtendimentos: 1,
          status: 1
        }
      }
    ];

    // Adicionar filtro de busca se fornecido
    if (search) {
      // Normalizar termo de busca (remover todos caracteres não numéricos)
      const searchNormalized = search.replace(/\D/g, '');

      const orConditions = [];

      // Busca por nome (se não for apenas números)
      if (search !== searchNormalized || searchNormalized === '') {
        orConditions.push({ nome: { $regex: search, $options: 'i' } });
      }

      // Busca por telefone normalizado (apenas números)
      // Permite busca parcial - ex: 988359194 encontra 5547988359194
      if (searchNormalized) {
        orConditions.push({ telefone: { $regex: searchNormalized } });
      }

      if (orConditions.length > 0) {
        pipeline.push({
          $match: {
            $or: orConditions
          }
        });
      }

      console.log('[DEBUG] Busca:', search, '→ Normalizado:', searchNormalized);
    }

    // Ordenar por último atendimento
    pipeline.push({ $sort: { ultimoAtendimento: -1 } });

    // Contar total antes da paginação
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await db.collection('atendimentos').aggregate(countPipeline).toArray();
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Adicionar paginação
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    const contatos = await db.collection('atendimentos').aggregate(pipeline).toArray();

    res.json({
      data: contatos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar contatos:', error);
    res.status(500).json({ error: 'Erro ao buscar contatos' });
  }
});

// 2. Buscar atendimentos de um contato específico
app.get('/api/contatos/:canalCliente/atendimentos', authenticateToken, async (req, res) => {
  try {
    const { canalCliente } = req.params;
    const { page = 1, limit = 20, protocolo, dataInicio, dataFim } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log(`[DEBUG] GET /api/contatos/${canalCliente}/atendimentos - page=${page} limit=${limit} protocolo=${protocolo} dataInicio=${dataInicio} dataFim=${dataFim}`);

    // Construir filtro usando $and para combinar condições
    const andConditions = [{ canal_cliente: canalCliente }];

    // Filtro por protocolo (busca parcial case-insensitive)
    if (protocolo) {
      andConditions.push({ protocolo: { $regex: protocolo, $options: 'i' } });
    }

    // Filtro por data - verifica sobreposição de intervalos
    // Um atendimento deve aparecer se houver qualquer sobreposição entre:
    // - Intervalo do atendimento: [date, fim]
    // - Intervalo selecionado: [dataInicio, dataFim]
    if (dataInicio || dataFim) {
      const inicioDate = dataInicio ? new Date(dataInicio) : null;
      const fimDate = dataFim ? new Date(dataFim) : null;

      if (inicioDate) inicioDate.setHours(0, 0, 0, 0);
      if (fimDate) fimDate.setHours(23, 59, 59, 999);

      if (inicioDate && fimDate) {
        // Ambas as datas fornecidas - verificar sobreposição
        // Há sobreposição se:
        // - O atendimento começa antes ou durante o período selecionado E
        // - O atendimento termina depois ou durante o período selecionado (ou ainda está ativo)
        andConditions.push({
          $or: [
            // Caso 1: Atendimento com data de fim definida - verificar sobreposição
            {
              date: { $lte: fimDate },
              fim: { $gte: inicioDate, $ne: null }
            },
            // Caso 2: Atendimento sem data de fim (ainda ativo) que começou antes do fim do período
            {
              date: { $lte: fimDate },
              $or: [
                { fim: null },
                { fim: { $exists: false } }
              ]
            }
          ]
        });
      } else if (inicioDate) {
        // Apenas data de início - atendimentos que terminam em/depois dessa data ou ainda ativos
        andConditions.push({
          $or: [
            { fim: { $gte: inicioDate } },
            { fim: null },
            { fim: { $exists: false } }
          ]
        });
      } else if (fimDate) {
        // Apenas data de fim - atendimentos que começam em/antes dessa data
        andConditions.push({ date: { $lte: fimDate } });
      }
    }

    const filter = { $and: andConditions };
    console.log('[DEBUG] Filter:', JSON.stringify(filter, null, 2));

    const total = await db.collection('atendimentos').countDocuments(filter);

    const atendimentos = await db.collection('atendimentos')
      .find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    // Log dos atendimentos encontrados para debug
    if (dataInicio || dataFim) {
      console.log(`[DEBUG] Encontrados ${atendimentos.length} atendimentos:`);
      atendimentos.slice(0, 5).forEach(atend => {
        console.log(`  - Protocolo: ${atend.protocolo}, Início: ${atend.date?.toISOString()?.split('T')[0]}, Fim: ${atend.fim ? atend.fim.toISOString().split('T')[0] : 'sem fim'}`);
      });
    }

    res.json({
      data: atendimentos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar atendimentos:', error);
    res.status(500).json({ error: 'Erro ao buscar atendimentos' });
  }
});

// 3. Buscar mensagens de um atendimento específico
app.get('/api/atendimentos/:idAtendimento/mensagens', authenticateToken, async (req, res) => {
  try {
    const { idAtendimento } = req.params;
    const { page = 1, limit = 100 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Support queries where id_atend in the DB is stored as ObjectId or as string.
    let idQuery = idAtendimento
    if (ObjectId.isValid(idAtendimento)) {
      try {
        idQuery = new ObjectId(idAtendimento)
      } catch (e) {
        // fallback to string id if conversion fails
        idQuery = idAtendimento
      }
    }
    
  const debugFilter = { $or: [ { id_atend: idQuery }, { id_rota: idQuery } ] }
  console.log(`[DEBUG] GET /api/atendimentos/${idAtendimento}/mensagens - idAtendimento param=${idAtendimento} idQuery=${idQuery} page=${page} limit=${limit} filter=${JSON.stringify(debugFilter)}`);

    // Some datasets reference the atendimento id in different fields (id_atend or id_rota).
    // Build a filter that matches either field to be tolerant to schema differences.
    const filter = { $or: [ { id_atend: idQuery }, { id_rota: idQuery } ] }

    const total = await db.collection('atendimentos_mensagens').countDocuments(filter);

    const mensagens = await db.collection('atendimentos_mensagens')
      .find(filter)
      .sort({ data: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();
    
    console.log(`[DEBUG] mensagens encontradas: ${mensagens.length}`);

    // Enriquecer mensagens com o nome do atendente (se id_atend estiver presente)
    try {
      // Extrai ids únicos de id_atend presentes nas mensagens
      const idAtendSet = new Set();
      mensagens.forEach((m) => {
        if (m && m.id_atend) {
          // Stringify to normalize ObjectId and string
          idAtendSet.add(String(m.id_atend));
        }
      });

      const idAtendList = Array.from(idAtendSet).filter(Boolean);

      if (idAtendList.length > 0) {
        // Converter para ObjectId quando possível
        const idObjs = idAtendList.map((s) => (ObjectId.isValid(s) ? new ObjectId(s) : s));

        const usuarios = await db.collection('usuarios')
          .find({ _id: { $in: idObjs } })
          .project({ nome: 1 })
          .toArray();

        const usuarioMap = {};
        usuarios.forEach((u) => {
          usuarioMap[String(u._id)] = u.nome;
        });

        // Anexar nome do atendente em cada mensagem quando disponível
        mensagens.forEach((m) => {
          if (m && m.id_atend) {
            m.atendenteNome = usuarioMap[String(m.id_atend)] || null;
          } else {
            m.atendenteNome = null;
          }
        });

        console.log(`[DEBUG] usuários encontrados para id_atend: ${Object.keys(usuarioMap).length}`);
      }
    } catch (e) {
      console.error('Erro ao enriquecer mensagens com nome do atendente:', e);
    }

    // Enriquecer mensagens do tipo 'midia' com os dados do arquivo (coleção 'arquivos')
    try {
      const arquivosToFetch = new Set()
      mensagens.forEach((m) => {
        if (m && m.tipo === 'midia' && m.objeto) {
          arquivosToFetch.add(String(m.objeto))
        }
      })

      const arquivosList = Array.from(arquivosToFetch).filter(Boolean)
      if (arquivosList.length > 0) {
        const arquivosIds = arquivosList.map((s) => (ObjectId.isValid(s) ? new ObjectId(s) : s))
        const arquivosDocs = await db.collection('arquivos').find({ _id: { $in: arquivosIds } }).toArray()
        const arquivosMap = {}
        arquivosDocs.forEach((a) => {
          arquivosMap[String(a._id)] = a
        })

        mensagens.forEach((m) => {
          if (m && m.tipo === 'midia' && m.objeto) {
            const arquivo = arquivosMap[String(m.objeto)]
            if (arquivo) {
              // Construir URL pública para o arquivo baseado no campo local
              // Normalizar para evitar '/arquivos/arquivos/...' caso 'local' já contenha 'arquivos/'
              let localPath = arquivo.local || ''
              if (localPath.startsWith('arquivos/')) {
                localPath = localPath.replace(/^arquivos\//, '')
              }
              const fileUrl = `/arquivos/${localPath}`
              m.arquivo = {
                nome: arquivo.nome,
                local: arquivo.local,
                tipo: arquivo.tipo,
                size: arquivo.size,
                url: fileUrl
              }
            }
          }
        })
        console.log(`[DEBUG] arquivos encontrados para midia: ${arquivosDocs.length}`)
      }
    } catch (e) {
      console.error('Erro ao enriquecer mensagens com arquivos:', e)
    }

    res.json({
      data: mensagens,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

// 4. Buscar detalhes de um atendimento específico
app.get('/api/atendimentos/:idAtendimento', authenticateToken, async (req, res) => {
  try {
    const { idAtendimento } = req.params;

    // Convert to ObjectId when applicable
    let idQuery = idAtendimento
    if (ObjectId.isValid(idAtendimento)) {
      try {
        idQuery = new ObjectId(idAtendimento)
      } catch (e) {
        idQuery = idAtendimento
      }
    }

    const atendimento = await db.collection('atendimentos')
      .findOne({ _id: idQuery });

    if (!atendimento) {
      return res.status(404).json({ error: 'Atendimento não encontrado' });
    }

    res.json(atendimento);
  } catch (error) {
    console.error('Erro ao buscar atendimento:', error);
    res.status(500).json({ error: 'Erro ao buscar atendimento' });
  }
});

// 5. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API funcionando corretamente' });
});

// Servir arquivos estáticos do frontend (em produção)
// O frontend buildado estará em ./public após o Docker build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));

  // SPA fallback - redirecionar todas as rotas não-API para index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Iniciar servidor
async function startServer() {
  await connectDB();

  // Testar conexão com MinIO
  console.log('\n=== Testando conexão com MinIO ===');
  const minioOk = await testConnection();
  if (!minioOk) {
    console.warn('AVISO: Falha ao conectar com MinIO. Verifique as configurações.');
  }
  console.log('===================================\n');

  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`http://localhost:${PORT}`);
  });
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nFechando conexão com MongoDB...');
  await client.close();
  process.exit(0);
});
