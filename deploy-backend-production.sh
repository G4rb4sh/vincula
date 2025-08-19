#!/bin/bash

# Script para deployment del backend en VPS Ubuntu 24.04
# IP: 72.60.48.118
# Este script debe ejecutarse EN EL VPS

echo "🚀 Configurando backend para producción en VPS..."

# Verificar si estamos ejecutando como root o con sudo
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Este script necesita permisos de administrador."
    echo "Ejecuta: sudo ./deploy-backend-production.sh"
    exit 1
fi

# Actualizar sistema
echo "📦 Actualizando sistema..."
apt update && apt upgrade -y

# Instalar Docker si no está instalado
if ! command -v docker &> /dev/null; then
    echo "🐳 Instalando Docker..."
    apt install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io
    systemctl start docker
    systemctl enable docker
else
    echo "✅ Docker ya está instalado"
fi

# Instalar Docker Compose si no está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "🔧 Instalando Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "✅ Docker Compose ya está instalado"
fi

# Crear directorio para la aplicación
APP_DIR="/opt/vincula"
if [ ! -d "$APP_DIR" ]; then
    echo "📁 Creando directorio de aplicación: $APP_DIR"
    mkdir -p $APP_DIR
fi

cd $APP_DIR

echo "✅ Sistema configurado!"
echo ""
echo "📋 Siguientes pasos:"
echo "1. Clonar o copiar el código del proyecto a: $APP_DIR"
echo "2. Crear archivo .env con las variables de entorno de producción"
echo "3. Ejecutar: docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "🔧 Variables de entorno requeridas en .env:"
echo "POSTGRES_PASSWORD=tu_password_seguro"
echo "JWT_SECRET=tu_jwt_secret_muy_seguro"
echo "LIVEKIT_API_KEY=tu_livekit_api_key"
echo "LIVEKIT_SECRET_KEY=tu_livekit_secret_key"
echo ""
echo "🌐 URLs de la aplicación:"
echo "- API Gateway: http://72.60.48.118:8080"
echo "- Health Check: http://72.60.48.118:8080/health"
echo "- LiveKit: ws://72.60.48.118:7880"

# Configurar firewall básico
echo "🔥 Configurando firewall..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 8080/tcp  # API Gateway
ufw allow 8081/tcp  # User Service
ufw allow 8082/tcp  # Call Service
ufw allow 8083/tcp  # Queue Service
ufw allow 7880/tcp  # LiveKit HTTP
ufw allow 7881/tcp  # LiveKit TCP
ufw allow 7882/udp  # LiveKit UDP
ufw allow 5432/tcp  # PostgreSQL (para conexiones externas si es necesario)
ufw allow 6379/tcp  # Redis (para conexiones externas si es necesario)

echo "✅ Firewall configurado!"
ufw status
