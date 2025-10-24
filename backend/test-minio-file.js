require('dotenv').config();
const { getFile } = require('./minio-config');

// Testar busca de arquivo com caminho completo
const testPath = 'arquivos/2025-10/13/04482c5f-5fa5-4e5f-9c9e-6c402bc0809a.jpg';

console.log(`Testando busca do arquivo: ${testPath}\n`);

getFile(testPath)
  .then(stream => {
    console.log('✓ SUCESSO: Stream obtido do MinIO!');
    console.log('Tipo do stream:', stream.constructor.name);

    let bytes = 0;
    stream.on('data', (chunk) => {
      bytes += chunk.length;
    });

    stream.on('end', () => {
      console.log(`✓ Total de bytes recebidos: ${bytes} (${(bytes / 1024).toFixed(2)} KB)`);
      process.exit(0);
    });

    stream.on('error', (error) => {
      console.error('✗ Erro no stream:', error.message);
      process.exit(1);
    });
  })
  .catch(error => {
    console.error('✗ ERRO ao buscar arquivo:', error.message);
    console.error('Código:', error.code);
    process.exit(1);
  });
