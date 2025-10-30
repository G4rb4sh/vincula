#!/bin/bash

# Vincula - Script de Build del Frontend CON PROXY
# Este script construye el frontend para usar Hostinger como proxy

set -e

echo "==================================="
echo "   Vincula - Build Frontend"
echo "   (Con Hostinger Proxy)"
echo "==================================="

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

# Configurar variables de entorno para usar URLs RELATIVAS (proxy en Hostinger)
echo ""
echo "Configurando para usar Hostinger como proxy..."
export REACT_APP_API_URL=/api
export REACT_APP_WS_URL=/ws
export REACT_APP_LIVEKIT_URL=ws://72.60.48.118:7880
export GENERATE_SOURCEMAP=false
export CI=false

# Construir el frontend
echo ""
echo "Construyendo frontend para producción..."
npm run build

# Copiar .htaccess con proxy al build
echo ""
echo "Copiando .htaccess con configuración de proxy..."
if [ -f ".htaccess.proxy" ]; then
    cp .htaccess.proxy build/.htaccess
    echo ".htaccess con proxy copiado correctamente"
else
    echo "Advertencia: No se encontró .htaccess.proxy"
fi

echo ""
echo "==================================="
echo "   Build Completado"
echo "==================================="
echo ""
echo "Archivos listos en: frontend/build/"
echo ""
echo "IMPORTANTE: Este build usa Hostinger como proxy"
echo ""
echo "Pasos siguientes:"
echo "  1. Contacta a Hostinger para habilitar mod_proxy"
echo "  2. Sube el contenido de 'frontend/build/' a 'public_html'"
echo "  3. Verifica que .htaccess se subió correctamente"
echo ""

