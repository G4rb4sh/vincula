#!/bin/bash

# Script para hacer build del frontend para producción
# Este script creará los archivos estáticos optimizados para subirlos a Hostinger

echo "🚀 Construyendo frontend para producción..."

# Ir al directorio del frontend
cd frontend

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Variables de entorno para producción
export REACT_APP_API_URL=http://72.60.48.118:8080
export REACT_APP_WS_URL=ws://72.60.48.118:8080
export REACT_APP_LIVEKIT_URL=ws://72.60.48.118:7880
export GENERATE_SOURCEMAP=false
export CI=false

echo "🔧 Variables de entorno configuradas:"
echo "  - REACT_APP_API_URL: $REACT_APP_API_URL"
echo "  - REACT_APP_WS_URL: $REACT_APP_WS_URL"
echo "  - REACT_APP_LIVEKIT_URL: $REACT_APP_LIVEKIT_URL"

# Hacer build
echo "🏗️  Ejecutando build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completado exitosamente!"
    echo "📁 Los archivos están en: frontend/build/"
    echo ""
    echo "📋 Siguientes pasos:"
    echo "1. Comprimir la carpeta 'build' en un archivo ZIP"
    echo "2. Subir el ZIP a Hostinger"
    echo "3. Extraer en el directorio public_html de tu dominio"
    echo ""
    echo "🌐 El sitio estará disponible en: https://grupovincula.com"
else
    echo "❌ Error en el build!"
    exit 1
fi

# Mostrar información del build
echo ""
echo "📊 Información del build:"
du -sh build/
echo ""
echo "📁 Contenido del build:"
ls -la build/
