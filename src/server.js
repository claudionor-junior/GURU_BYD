import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import { askQuestion } from './chat/rag.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Servindo arquivos front-end do chat

app.post('/api/chat', async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'A propriedade "question" é obrigatória no body JSON.' });
  }

  try {
    const result = await askQuestion(question);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor ao prever resposta.', details: error.message });
  }
});

app.listen(PORT, () => {
  logger.info(`Servidor RAG rodando na porta ${PORT}`);
});

export default app;

