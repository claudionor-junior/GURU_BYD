import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
dotenv.config();

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

// Configure seu indice no Pinecone com dimension: 768 e metric: cosine
const indexName = process.env.PINECONE_INDEX || 'guru-byd';

export async function initIndex() {
  const indexes = await pinecone.listIndexes();
  const exists = indexes.indexes.some((idx) => idx.name === indexName);
  
  if (!exists) {
    logger.info(`Index ${indexName} não encontrado. Por favor, crie no painel com dimensões adequadas (768 para text-embedding-004 e métrica Cosine).`);
    // pinecone.createIndex(...)
  } else {
    logger.info(`Index ${indexName} já existe e está pronto.`);
  }
}

export async function upsertVectors(vectors, namespace = '') {
  const index = pinecone.index(indexName);
  try {
    const batchedVectors = [];
    const batchSize = 100;
    
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.namespace(namespace).upsert(batch);
      logger.info(`Upserted batch ${Math.ceil(i/batchSize) + 1}/${Math.ceil(vectors.length/batchSize)} para namespace '${namespace}'`);
    }
  } catch (error) {
    logger.error(`Erro no upsert do Pinecone: ${error.message}`);
    throw error;
  }
}

export async function queryVectors(vector, topK = 5, namespace = '') {
  const index = pinecone.index(indexName);
  try {
    const results = await index.namespace(namespace).query({
      topK,
      vector,
      includeMetadata: true
    });
    return results.matches;
  } catch (error) {
    logger.error(`Erro no query do Pinecone: ${error.message}`);
    throw error;
  }
}
