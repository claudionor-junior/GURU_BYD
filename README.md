# Guru BYD - RAG Multimodal

Sistema de RAG (Retrieval-Augmented Generation) para responder perguntas técnicas sobre carros da marca BYD. Ele ingere PDFs, imagens e vídeos utilizando modelos Multimodais (Gemini 1.5 Flash), extrai atributos técnicos, divide em vetores usando `text-embedding-004` e salva no **Pinecone** para ser consumido via uma API local com Express, cuja inferência final é dada pelo Gemini 3.1 Pro.

## Requisitos
- Node.js 18+
- Chaves de API do Google Gemini (`GEMINI_API_KEY`)
- Chave e Índice Pinecone (`PINECONE_API_KEY`) - *Certifique-se de usar dimensão 768 no índice do Pinecone, com a métrica Cosine*.

## Instalação
1. Clone e entre na pasta do projeto:
   ```bash
   cd Guru_BYD
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Renomeie o arquivo `.env.example` para `.env` e preencha as credenciais.

## Como Ingerir Dados
Para ler uma pasta cheia de manuais em PDFs (e até imagens ou pequenos vídeos suportados localmente):
```bash
npm run ingest "C:\caminho\absoluto\para\Manuais BYD"
```
*(Ele varre as pastas, divide os textos em chunks e os atira usando as integrações já configuradas).*

## Como Rodar o Servidor e Fazer Buscas
1. Inicie a API:
   ```bash
   npm start
   ```
2. Faça requisições POST para a porta configurada (padrão 3000):
   ```bash
   curl -X POST http://localhost:3000/chat \
        -H "Content-Type: application/json" \
        -d "{\"question\": \"O que significa a luz de alerta do airbag do BYD Song Plus?\"}"
   ```
   
A resposta será retornada no JSON, juntamente com o nome do Documento fonte.
