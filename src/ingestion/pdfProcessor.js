import fs from 'fs';
import pdfParse from 'pdf-parse';
import logger from '../utils/logger.js';

export async function processPdf(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    
    // PDF Parse returns:
    // data.text (the extracted text)
    // data.numpages (number of pages - though the text itself isn't perfectly paginated here unless parsed page by page)
    
    // Fallback simple: just return all text. 
    // Para RAG avançado, poderíamos usar bibliotecas que parseiam página a página
    return {
      text: data.text,
      pages: data.numpages,
      info: data.info
    };
  } catch (error) {
    logger.error(`Error processing PDF ${filePath}: ${error.message}`);
    throw error;
  }
}
