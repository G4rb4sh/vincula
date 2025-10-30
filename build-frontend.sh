#!/bin/bash

# Vincula - Script de Build del Frontend
# Este script construye el frontend para subirlo a Hostinger

set -e

echo "==================================="
echo "   Vincula - Build Frontend"
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

# Construir el frontend
echo ""
echo "Construyendo frontend para producción..."
npm run build

echo ""
echo "==================================="
echo "   Build Completado"
echo "==================================="
echo ""
echo "Archivos listos en: frontend/build/"
echo ""
echo "Pasos siguientes:"
echo "  1. Sube el contenido de 'frontend/build/' a 'public_html' en Hostinger"
echo "  2. Asegúrate de subir también el archivo '.htaccess'"
echo ""
echo "Para crear un archivo ZIP para subir fácilmente:"
echo "  cd frontend/build && zip -r ../../vincula-frontend.zip . && cd ../.."
echo ""

