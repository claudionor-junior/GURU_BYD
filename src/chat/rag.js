import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { generateEmbedding } from '../embeddings/gemini.js';
import { queryVectors } from '../vectorstore/pinecone.js';
import logger from '../utils/logger.js';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_prevent_crash');
const chatModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

export async function askQuestion(question) {
  try {
    logger.info(`Recebendo pergunta: ${question}`);
    
    // 1. Gerar embedding da pergunta
    const questionEmbedding = await generateEmbedding(question);
    
    // 2. Buscar no Pinecone os 5 chunks mais similares
    const matches = await queryVectors(questionEmbedding, 5);
    
    if (!matches || matches.length === 0) {
      return { answer: "Desculpe, não encontrei informações relevantes nos manuais para esta pergunta.", sources: [] };
    }
    
    // 3. Formatar o contexto
    let contextText = "CONTEXTO RETIRADO DOS MANUAIS DA BYD:\n";
    const sources = [];

    matches.forEach((match, index) => {
      const content = match.metadata.content || '';
      const sourceFile = match.metadata.source || 'Desconhecido';
      const type = match.metadata.type || 'text';
      
      contextText += `\n[Documento ${index + 1}] | Fonte: ${sourceFile} (${type})\n${content}\n`;
      
      sources.push({
        document: sourceFile,
        type: type,
        score: match.score
      });
    });

    // 4. Prompt para o Gemini responder baseado EXCLUSIVAMENTE no contexto
    const prompt = `Você é um assistente técnico virtual experiente para carros da marca BYD. Responda à pergunta do usuário utilizando EXCLUSIVAMENTE o contexto fornecido. Se a resposta não estiver no contexto, diga que não sabe. Não invente informações. Ao fornecer a resposta, cite de qual documento a informação foi retirada.
    
${contextText}

PERGUNTA: ${question}
RESPOSTA:`;

    const result = await chatModel.generateContent(prompt);
    const answer = result.response.text();

    logger.info(`Resposta gerada com sucesso.`);

    return {
      answer,
      sources
    };

  } catch (error) {
    logger.error(`Ocorreu um erro no RAG: ${error.message}`);
    throw error;
  }
}
