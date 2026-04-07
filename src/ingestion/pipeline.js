import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import { processPdf } from './pdfProcessor.js';
import { processMedia } from './mediaProcessor.js';
import { chunkText } from './chunker.js';
import { generateBatchedEmbeddings } from '../embeddings/gemini.js';
import { upsertVectors } from '../vectorstore/pinecone.js';

function getFilesRecursively(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFilesRecursively(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

export async function runIngestion(targetDirectory) {
  logger.info(`Iniciando ingestão no diretório: ${targetDirectory}`);
  const allFiles = getFilesRecursively(targetDirectory);
  
  for (const filePath of allFiles) {
    try {
      const mimeType = mime.lookup(filePath) || 'application/octet-stream';
      logger.info(`Processando arquivo [${mimeType}]: ${path.basename(filePath)}`);
      
      let extractionResult;
      let extractType = 'text';

      if (mimeType === 'application/pdf') {
        extractionResult = await processPdf(filePath);
        extractType = 'pdf';
      } else if (mimeType.startsWith('image/') || mimeType.startsWith('video/')) {
        extractionResult = await processMedia(filePath);
        extractType = mimeType.split('/')[0];
      } else {
        logger.warn(`Pulando tipo não suportado: ${filePath}`);
        continue;
      }
      
      const fullText = extractionResult.text;
      if (!fullText || fullText.trim() === '') {
        logger.warn(`Nenhum texto extraído de: ${filePath}`);
        continue;
      }

      const chunks = chunkText(fullText, 1000, 200);
      logger.info(`Gerados ${chunks.length} chunks para ${path.basename(filePath)}`);

      // Gerar IDs e metadados e preparar batch para embedding
      for (let i = 0; i < chunks.length; i += 50) {
        const batchChunks = chunks.slice(i, i + 50);
        
        const embeddings = await generateBatchedEmbeddings(batchChunks);
        
        const vectors = batchChunks.map((chunkStr, idx) => {
          return {
            id: `${path.basename(filePath)}-chunk-${i + idx}-${uuidv4()}`,
            values: embeddings[idx],
            metadata: {
              source: path.basename(filePath),
              type: extractType,
              content: chunkStr,
              location: filePath
            }
          };
        });

        await upsertVectors(vectors);
      }
      
      logger.info(`SUCESSO: ${path.basename(filePath)} processado e salvo no Vector DB.`);

    } catch (error) {
      logger.error(`Ocorreu um erro no arquivo ${filePath}: ${error.message}`);
    }
  }
  
  logger.info(`Ingestão concluída para ${targetDirectory}!`);
}
