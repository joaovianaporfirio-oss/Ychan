@echo off
title Ychan Imageboard
cd /d "%~dp0"

echo ======================================================
echo    Ychan - Imageboard Minimalista Retr
echo ======================================================
echo.
echo Iniciando servidor local com suporte a MIME types...
echo O seu navegador sera aberto automaticamente.
echo.

python server.py
if %errorlevel% neq 0 (
    echo.
    echo Python nao detectado ou falhou. Tentando abrir index.html direto...
    start "" "%~dp0index.html"
)
pause
