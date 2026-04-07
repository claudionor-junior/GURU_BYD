import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use text-embedding-004
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

export async function generateEmbedding(text) {
  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    logger.error(`Error generating embedding: ${error.message}`);
    throw error;
  }
}

export async function generateBatchedEmbeddings(texts) {
  try {
    const results = [];
    for (const text of texts) {
      // In a real production scenario with many documents, we could use batch embedding endpoints,
      // but the Node SDK supports one-by-one or via specific REST endpoints. We process them sequentially here.
      const embedding = await generateEmbedding(text);
      results.push(embedding);
    }
    return results;
  } catch (error) {
    logger.error(`Error generating batch embeddings: ${error.message}`);
    throw error;
  }
}
