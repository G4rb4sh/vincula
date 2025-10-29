#!/bin/bash

# Vincula - Script de Configuración
# Este script prepara el entorno para ejecutar la aplicación

set -e

echo "==================================="
echo "   Vincula - Setup"
echo "==================================="

# Verificar que estamos en Ubuntu/Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo "Error: Este script solo funciona en Ubuntu/Linux"
    exit 1
fi

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "Docker no está instalado. Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "Docker instalado. Por favor, cierra sesión y vuelve a iniciarla para aplicar los cambios."
    exit 0
fi

# Verificar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose no está instalado. Instalando..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo "Docker y Docker Compose están instalados correctamente"

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo ""
    echo "Creando archivo .env para producción..."
    
    # Generar JWT secret aleatorio
    JWT_SECRET=$(openssl rand -hex 32)
    POSTGRES_PASSWORD=$(openssl rand -hex 16)
    LIVEKIT_SECRET=$(openssl rand -hex 32)
    
    cat > .env << EOF
# Base de datos
POSTGRES_DB=vincula
POSTGRES_USER=vincula_user
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

# Seguridad
JWT_SECRET=${JWT_SECRET}

# LiveKit (para videollamadas y grabación)
LIVEKIT_API_KEY=devkey
LIVEKIT_SECRET_KEY=${LIVEKIT_SECRET}

# URLs de producción
# Backend: http://72.60.48.118 o http://srv965471.hstgr.cloud
# Frontend: https://grupovincula.com
REACT_APP_API_URL=http://72.60.48.118:8080
REACT_APP_WS_URL=ws://72.60.48.118:8080
REACT_APP_LIVEKIT_URL=ws://72.60.48.118:7880

# Configuración de grabación
USE_S3_STORAGE=false
RECORDINGS_DIR=/var/recordings
EOF

    echo "Archivo .env creado. IMPORTANTE: Revisa y ajusta las URLs si es necesario."
else
    echo "El archivo .env ya existe. No se sobreescribirá."
fi

# Crear directorio para grabaciones
if [ ! -d "/var/recordings" ]; then
    echo ""
    echo "Creando directorio para grabaciones..."
    sudo mkdir -p /var/recordings
    sudo chown -R $USER:$USER /var/recordings
fi

# Configurar firewall (si ufw está instalado)
if command -v ufw &> /dev/null; then
    echo ""
    echo "Configurando firewall..."
    sudo ufw allow 8080/tcp comment 'Vincula API Gateway'
    sudo ufw allow 7880/tcp comment 'LiveKit WebSocket'
    sudo ufw allow 7881/tcp comment 'LiveKit TCP'
    sudo ufw allow 7882/udp comment 'LiveKit UDP'
fi

echo ""
echo "==================================="
echo "   Setup completado"
echo "==================================="
echo ""
echo "Siguiente paso: ejecuta './start.sh' para iniciar la aplicación"
echo ""


