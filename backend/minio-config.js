const { S3Client, GetObjectCommand, HeadBucketCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

// Configuração do cliente S3/MinIO
// Tentar múltiplos endpoints possíveis
const endpoint = process.env.MINIO_ENDPOINT || 'console-outros-minio.8a2h9d.easypanel.host';
const useSSL = process.env.MINIO_USE_SSL !== 'false';
const protocol = useSSL ? 'https' : 'http';
const port = process.env.MINIO_PORT || '443';

// Construir o endpoint correto
// No Easypanel: console-X é a console web, X (sem prefixo) é a API S3
const s3Endpoint = endpoint.replace('console-', '');
const fullEndpoint = `${protocol}://${s3Endpoint}`;

// Lista de endpoints para tentar (em ordem de prioridade)
const possibleEndpoints = [
  fullEndpoint,
  `${fullEndpoint}:${port}`,
  `${protocol}://${endpoint}`,
];

let s3Client;
let currentEndpoint = possibleEndpoints[0];

function createS3Client(endpointUrl) {
  return new S3Client({
    endpoint: endpointUrl,
    region: process.env.MINIO_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY,
      secretAccessKey: process.env.MINIO_SECRET_KEY,
    },
    forcePathStyle: true, // Necessário para MinIO
    tls: useSSL
  });
}

s3Client = createS3Client(currentEndpoint);

const BUCKET_NAME = process.env.MINIO_BUCKET || 'primazzo';

/**
 * Busca um arquivo do MinIO
 * @param {string} filePath - Caminho do arquivo dentro do bucket
 * @returns {Promise<Stream>} - Stream do arquivo
 */
async function getFile(filePath) {
  try {
    // Normalizar o caminho do arquivo (remover barra inicial se existir)
    const normalizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;

    console.log(`[MINIO] Buscando arquivo: ${normalizedPath} do bucket: ${BUCKET_NAME} (endpoint: ${currentEndpoint})`);

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: normalizedPath
    });

    const response = await s3Client.send(command);
    return response.Body;
  } catch (error) {
    console.error(`[MINIO] Erro ao buscar arquivo ${filePath}:`, error.message);
    throw error;
  }
}

/**
 * Lista arquivos no bucket
 * @param {string} prefix - Prefixo para filtrar arquivos (opcional)
 * @returns {Promise<Array>} - Lista de arquivos
 */
async function listFiles(prefix = '') {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix
    });

    const response = await s3Client.send(command);
    return response.Contents || [];
  } catch (error) {
    console.error('[MINIO] Erro ao listar arquivos:', error.message);
    throw error;
  }
}

/**
 * Testa a conexão com o MinIO testando todos os endpoints possíveis
 * @returns {Promise<boolean>} - True se a conexão está OK
 */
async function testConnection() {
  console.log(`[MINIO] Testando conexão com bucket '${BUCKET_NAME}'...`);
  console.log(`[MINIO] Access Key: ${process.env.MINIO_ACCESS_KEY?.substring(0, 8)}...`);

  for (const endpointUrl of possibleEndpoints) {
    try {
      console.log(`[MINIO] Tentando endpoint: ${endpointUrl}`);
      const testClient = createS3Client(endpointUrl);

      const command = new HeadBucketCommand({ Bucket: BUCKET_NAME });
      await testClient.send(command);

      // Se chegou aqui, a conexão foi bem-sucedida
      console.log(`[MINIO] ✓ Conexão estabelecida com sucesso!`);
      console.log(`[MINIO] ✓ Endpoint: ${endpointUrl}`);
      console.log(`[MINIO] ✓ Bucket '${BUCKET_NAME}' encontrado.`);

      // Atualizar o cliente global para usar este endpoint
      s3Client = testClient;
      currentEndpoint = endpointUrl;
      return true;
    } catch (error) {
      console.log(`[MINIO] ✗ Falha: ${error.name} - ${error.message}`);
      if (error.$metadata) {
        console.log(`[MINIO]   HTTP Status: ${error.$metadata.httpStatusCode}`);
      }
    }
  }

  console.error(`[MINIO] ✗ Não foi possível conectar em nenhum dos endpoints testados`);
  console.error(`[MINIO] Verifique:`);
  console.error(`[MINIO]   - As credenciais estão corretas?`);
  console.error(`[MINIO]   - O bucket '${BUCKET_NAME}' existe?`);
  console.error(`[MINIO]   - O endpoint está acessível?`);
  return false;
}

module.exports = {
  getFile,
  listFiles,
  testConnection,
  BUCKET_NAME
};
