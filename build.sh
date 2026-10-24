#!/bin/bash
set -e

echo "============================================"
echo "  SOS Mulher -- Build Completo (Linux/Mac)"
echo "============================================"

echo ""
echo "[1/2] Compilando frontend React (Vite)..."
cd web
npm install
npm run build
cd ..

echo ""
echo "[2/2] Iniciando backend Spring Boot (porta 8080)..."
echo "      Aguarde o servidor iniciar, depois abra:"
echo "      http://localhost:8080"
echo ""
cd backend
./mvnw spring-boot:run
