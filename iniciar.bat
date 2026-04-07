@echo off
echo ========================================================
echo [ 1 / 3 ] Instalando as dependencias do Projeto...
echo ========================================================
call npm install

echo.
echo ========================================================
echo [ 2 / 3 ] Iniciando Ingestao (Apenas manual do BYD HAN)
echo ========================================================
call npm run ingest "C:\Users\junio\Downloads\Manuais BYD\BYD HAN"

echo.
echo ========================================================
echo [ 3 / 3 ] Iniciando Servidor RAG na Porta 3000
echo ========================================================
call npm start
pause
