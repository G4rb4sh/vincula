#!/bin/bash

# Vincula - Script de Build del Frontend con HTTPS
# Este script construye el frontend para usar HTTPS en el backend

set -e

echo "==========================================="
echo "   Vincula - Build Frontend (HTTPS)"
echo "==========================================="

# Verificar que estamos en el directorio correcto
if [ ! -d "frontend" ]; then
    echo "Error: No se encuentra el directorio frontend"
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js no está instalado"
    echo "Por favor, instala Node.js desde https://nodejs.org/"
    exit 1
fi

# Ir al directorio frontend
cd frontend

# Instalar dependencias
echo ""
echo "Instalando dependencias de Node.js..."
npm install

# Configurar variables de entorno para producción con HTTPS
echo ""
echo "Configurando variables de entorno para producción (HTTPS)..."
export REACT_APP_API_URL=https://api.grupovincula.com
export REACT_APP_WS_URL=wss://api.grupovincula.com
export REACT_APP_LIVEKIT_URL=ws://72.60.48.118:7880
export GENERATE_SOURCEMAP=false
export CI=false

echo "API URL: $REACT_APP_API_URL"
echo "WebSocket URL: $REACT_APP_WS_URL"
echo "LiveKit URL: $REACT_APP_LIVEKIT_URL"

# Construir el frontend
echo ""
echo "Construyendo frontend para producción..."
npm run build

# Copiar .htaccess al build
echo ""
echo "Copiando .htaccess al build..."
if [ -f ".htaccess" ]; then
    cp .htaccess build/
    echo ".htaccess copiado correctamente"
else
    echo "Advertencia: No se encontró .htaccess en el directorio frontend"
fi

echo ""
echo "==========================================="
echo "   Build Completado (HTTPS)"
echo "==========================================="
echo ""
echo "Archivos listos en: frontend/build/"
echo ""
echo "URLs configuradas:"
echo "  API: https://api.grupovincula.com"
echo "  WebSocket: wss://api.grupovincula.com"
echo "  LiveKit: ws://72.60.48.118:7880"
echo ""
echo "Pasos siguientes:"
echo "  1. Sube el contenido de 'frontend/build/' a 'public_html' en Hostinger"
echo "  2. Asegúrate de subir también el archivo '.htaccess'"
echo ""
echo "Para crear un archivo ZIP para subir fácilmente:"
echo "  cd frontend/build && zip -r ../../vincula-frontend-https.zip . && cd ../.."
echo ""

