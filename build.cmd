@echo off
echo ============================================
echo   SOS Mulher -- Build Completo (Windows)
echo ============================================

echo.
echo [1/2] Compilando frontend React (Vite)...
cd web
call npm install
call npm run build
if errorlevel 1 (
    echo ERRO: falha no build do frontend.
    exit /b 1
)
cd ..

echo.
echo [2/2] Iniciando backend Spring Boot (porta 8080)...
echo       Aguarde o servidor iniciar, depois abra:
echo       http://localhost:8080
echo.
cd backend
call mvnw.cmd spring-boot:run
