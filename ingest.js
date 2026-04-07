import { runIngestion } from './src/ingestion/pipeline.js';
import { initIndex } from './src/vectorstore/pinecone.js';

const directory = process.argv[2];

if (!directory) {
  console.log("Uso: node ingest.js <caminho_para_a_pasta>");
  console.log("Exemplo: node ingest.js \"C:\\Users\\junio\\Downloads\\Manuais BYD\"");
  process.exit(1);
}

await initIndex();
await runIngestion(directory);
