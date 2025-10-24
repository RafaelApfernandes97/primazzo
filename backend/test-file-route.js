require('dotenv').config();
const http = require('http');

// Testar uma requisição ao endpoint de arquivos
const testFilePath = '00004c8d-1686-44ac-ae94-cf68fa5c0728.pdf';

console.log(`\nTestando rota: /arquivos/${testFilePath}\n`);

const options = {
  hostname: 'localhost',
  port: 3001,
  path: `/arquivos/${testFilePath}`,
  method: 'GET',
  timeout: 10000
};

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);

  let size = 0;
  res.on('data', (chunk) => {
    size += chunk.length;
  });

  res.on('end', () => {
    console.log(`\nTotal de bytes recebidos: ${size} (${(size / 1024).toFixed(2)} KB)`);
    if (res.statusCode === 200) {
      console.log('\n✓ SUCESSO: Arquivo baixado do MinIO com sucesso!');
    } else {
      console.log('\n✗ ERRO: Status code diferente de 200');
    }
    process.exit(res.statusCode === 200 ? 0 : 1);
  });
});

req.on('error', (error) => {
  console.error('Erro na requisição:', error.message);
  console.log('\nO servidor pode não estar rodando ou ainda está iniciando...');
  process.exit(1);
});

req.on('timeout', () => {
  console.error('Timeout na requisição');
  req.destroy();
  process.exit(1);
});

req.end();
