export function chunkText(text, chunkSize = 1000, overlap = 200) {
  // Simple strategy: divide por palavras/sentenças ou pedaços com overlap.
  const chunks = [];
  let index = 0;
  
  if (!text || text.length === 0) return chunks;

  while (index < text.length) {
    let end = index + chunkSize;
    
    // Tentativa de não quebrar palavra ou sentença no meio
    if (end < text.length) {
      // Procurar último ponto ou espaço
      const lastSpace = text.lastIndexOf(' ', end);
      const lastDot = text.lastIndexOf('. ', end);
      
      // Se houver ponto no final, preferir ponto para terminar o chunk
      if (lastDot > index && end - lastDot < 150) {
        end = lastDot + 1;
      } else if (lastSpace > index) {
        end = lastSpace;
      }
    }
    
    chunks.push(text.substring(index, end).trim());
    
    index = end - overlap;
    
    // Previne loops infinitos se overlap for maior ou igual ao chunkSize ou não avançar
    if (index <= arguments[0].lastIndex) {
      index = end; // Fallback
    }
    arguments[0].lastIndex = index;
  }
  
  return chunks;
}
