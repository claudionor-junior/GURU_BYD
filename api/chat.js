import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';

// Vercel Serverless Function - Handler Único
export default async function handler(req, res) {
  // Apenas aceita requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Apenas requisições POST são permitidas.' });
  }

  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'A pergunta está vazia.' });
    }

    // 1. CHECAGEM DE VARIÁVEIS DE AMBIENTE (Diagnóstico blindado)
    const geminiKey = process.env.GEMINI_API_KEY;
    const pineconeKey = process.env.PINECONE_API_KEY;
    const pineconeIndex = process.env.PINECONE_INDEX || 'guru-byd';

    if (!geminiKey || geminiKey.trim() === '') {
      return res.status(500).json({ 
        error: 'Chave do GEMINI não encontrada.', 
        details: 'Adicione GEMINI_API_KEY nas Environment Variables da Vercel e faça um novo Deploy.' 
      });
    }

    if (!pineconeKey || pineconeKey.trim() === '') {
      return res.status(500).json({ 
        error: 'Chave do PINECONE não encontrada.', 
        details: 'Adicione PINECONE_API_KEY nas Environment Variables da Vercel e faça um novo Deploy.' 
      });
    }

    // 2. INICIALIZAÇÃO DE SDKs
    const genAI = new GoogleGenerativeAI(geminiKey);
    const pinecone = new Pinecone({ apiKey: pineconeKey });

    // 3. GERAÇÃO DE EMBEDDING (GEMINI)
    let questionEmbedding;
    try {
      const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
      const embedResult = await embeddingModel.embedContent(question);
      questionEmbedding = embedResult.embedding.values;
    } catch (err) {
      return res.status(500).json({ 
        error: 'Falha ao conectar no provedor de Embeddings (Google).', 
        details: err.message 
      });
    }

    // 4. BUSCA NO BANCO VETORIAL (PINECONE)
    let matches;
    try {
      const index = pinecone.index(pineconeIndex);
      const queryResponse = await index.query({
        topK: 5,
        vector: questionEmbedding,
        includeMetadata: true
      });
      matches = queryResponse.matches;
    } catch (err) {
      return res.status(500).json({ 
        error: `Falha ao consultar Pinecone (Índice: ${pineconeIndex}).`, 
        details: err.message 
      });
    }

    if (!matches || matches.length === 0) {
      return res.status(200).json({ 
        answer: "Desculpe, não encontrei informações relevantes nos manuais para esta pergunta.", 
        sources: [] 
      });
    }

    // Montar Contexto
    let contextText = "CONTEXTO RETIRADO DOS MANUAIS DA BYD:\n";
    const sources = [];

    matches.forEach((match, index) => {
      const content = match.metadata?.content || '';
      const sourceFile = match.metadata?.source || 'Desconhecido';
      const type = match.metadata?.type || 'text';
      
      contextText += `\n[Documento ${index + 1}] | Fonte: ${sourceFile} (${type})\n${content}\n`;
      
      sources.push({
        document: sourceFile,
        type: type,
        score: match.score
      });
    });

    // 5. GERAÇÃO DE RESPOSTA (GEMINI)
    let answer;
    try {
      const chatModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const prompt = `Você é um assistente técnico virtual experiente para carros da marca BYD. Responda à pergunta do usuário utilizando EXCLUSIVAMENTE o contexto fornecido. Se a resposta não estiver no contexto, diga que não sabe. Não invente informações. Ao fornecer a resposta, cite de qual documento a informação foi retirada.\n\n${contextText}\n\nPERGUNTA: ${question}\nRESPOSTA:`;
      
      const result = await chatModel.generateContent(prompt);
      answer = result.response.text();
    } catch (err) {
      return res.status(500).json({ 
        error: 'Falha ao gerar resposta final via Modelo Principal do Google.', 
        details: err.message 
      });
    }

    // Sucesso!
    return res.status(200).json({ answer, sources });

  } catch (globalError) {
    // Um cata-tudo para impedir The Serverless Crash
    return res.status(500).json({ 
      error: 'Erro brutal na arquitetura do servidor interno.', 
      details: globalError.message 
    });
  }
}
