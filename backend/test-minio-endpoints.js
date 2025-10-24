require('dotenv').config();
const https = require('https');

// Lista de endpoints possíveis baseados no padrão do Easypanel
const baseHost = 'outros-minio.8a2h9d.easypanel.host';
const testEndpoints = [
  `https://${baseHost}`,
  `https://s3.${baseHost}`,
  `https://api.${baseHost}`,
  `https://minio.${baseHost}`,
  `https://console-${baseHost}`,
  `https://s3-${baseHost}`,
];

console.log('Testando endpoints disponíveis...\n');

async function testEndpoint(url) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      console.log(`✓ ${url}`);
      console.log(`  Status: ${res.statusCode}`);
      console.log(`  Headers:`, res.headers);
      console.log('');
      resolve({ url, status: res.statusCode, success: true });
    });

    req.on('error', (error) => {
      console.log(`✗ ${url}`);
      console.log(`  Erro: ${error.message}`);
      console.log('');
      resolve({ url, error: error.message, success: false });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`✗ ${url} (timeout)`);
      console.log('');
      resolve({ url, error: 'timeout', success: false });
    });
  });
}

(async () => {
  for (const endpoint of testEndpoints) {
    await testEndpoint(endpoint);
  }

  console.log('\n=== INFORMAÇÕES DAS CREDENCIAIS ===');
  console.log('URL original:', 'https://console-outros-minio.8a2h9d.easypanel.host/api/v1/service-account-credentials');
  console.log('Access Key:', process.env.MINIO_ACCESS_KEY);
  console.log('Bucket:', process.env.MINIO_BUCKET);
  console.log('\nNOTA: A URL fornecida parece ser um endpoint da Console Web do MinIO.');
  console.log('Para acessar a API S3, geralmente é necessário usar um endpoint diferente.');
  console.log('No Easypanel, o endpoint S3 pode estar em um dos seguintes formatos:');
  console.log('  - https://<service-name>.project.easypanel.host');
  console.log('  - https://s3.<service-name>.project.easypanel.host');
  console.log('  - Ou configurado em uma porta específica');
})();
