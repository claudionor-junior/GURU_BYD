import { askQuestion } from '../src/chat/rag.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'A propriedade "question" é obrigatória no body JSON.' });
  }

  try {
    const result = await askQuestion(question);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor ao prever resposta.', details: error.message });
  }
}
