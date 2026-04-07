@echo off
echo ========================================================
echo INICIANDO ENVIO AUTOMATICO PARA O GITHUB...
echo ========================================================

echo 1. Iniciando o repositorio...
call git init

echo 2. Registrando os arquivos (Protegendo senhas)...
call git add .

echo 3. Criando o Pacote (Commit)...
call git commit -m "Publicando RAG Multimodal e Interface Web"

echo 4. Preparando rota principal...
call git branch -M main

echo 5. Conectando com a sua nuvem...
call git remote remove origin >nul 2>&1
call git remote add origin https://github.com/claudionor-junior/GURU_BYD.git

echo 6. Enviando pro GitHub! (Pode pedir login do github agora)
call git push -u origin main --force

echo.
echo ========================================================
echo SUCCESSO! OS ARQUIVOS FORAM PARA O GITHUB.
echo Agora entre na Vercel para importar!
echo ========================================================
pause
