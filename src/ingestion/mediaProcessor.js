import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
import mime from 'mime-types';
import fs from 'fs';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// File API for large files (like videos)
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType
    },
  };
}

export async function processMedia(filePath) {
  try {
    const mimeType = mime.lookup(filePath);
    if (!mimeType) {
      throw new Error(`MimeType desconhecido para ${filePath}`);
    }

    // Usando Gemini 1.5 Flash para processamento rápido de mídias (OCR ou Descrição)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = "Você é um assistente técnico especialista. Descreva e transcreva detalhadamente todo o conteúdo textual e mecânico presente nessa mídia. Foque nas instruções, alertas, passos e nomes de componentes. Retorne apenas o conteúdo descritivo profundo.";

    let result;

    if (mimeType.startsWith('video/')) {
      logger.info(`Efetuando upload de vídeo para File API: ${filePath}`);
      // Usar a File API
      const uploadResult = await fileManager.uploadFile(filePath, {
        mimeType,
        displayName: filePath,
      });

      // Aguardar o processamento (Active state)
      let file = await fileManager.getFile(uploadResult.file.name);
      while (file.state === "PROCESSING") {
        logger.info("Vídeo processando... aguardando 10s");
        await new Promise((resolve) => setTimeout(resolve, 10000));
        file = await fileManager.getFile(uploadResult.file.name);
      }

      if (file.state === "FAILED") {
        throw new Error("O processamento do vídeo falhou.");
      }

      result = await model.generateContent([
        prompt,
        {
          fileData: {
            fileUri: uploadResult.file.uri,
            mimeType: uploadResult.file.mimeType,
          },
        },
      ]);
      
      // Limpeza
      await fileManager.deleteFile(uploadResult.file.name);

    } else if (mimeType.startsWith('image/')) {
      // In-line para imagens
      const imagePart = fileToGenerativePart(filePath, mimeType);
      result = await model.generateContent([prompt, imagePart]);
    } else {
      throw new Error(`Tipo de mídia não suportado pelo MediaProcessor: ${mimeType}`);
    }

    return { text: result.response.text(), type: mimeType };
  } catch (error) {
    logger.error(`Error processing media ${filePath}: ${error.message}`);
    throw error;
  }
}
