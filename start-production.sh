#!/bin/bash

# Script para ejecutar el backend en producción
# Debe ejecutarse en el VPS (72.60.48.118)

echo "🚀 Iniciando Vincula en modo producción..."

# Verificar que existe el archivo .env
if [ ! -f ".env" ]; then
    echo "❌ Error: No se encontró el archivo .env"
    echo "📋 Copia production.env.example como .env y completa las variables:"
    echo "cp production.env.example .env"
    echo "nano .env"
    exit 1
fi

# Verificar que Docker está instalado y ejecutándose
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker no está instalado"
    echo "Ejecuta primero: sudo ./deploy-backend-production.sh"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Error: Docker no está ejecutándose"
    echo "Inicia Docker: sudo systemctl start docker"
    exit 1
fi

# Cargar variables de entorno
source .env

echo "🔧 Configuración cargada:"
echo "  - Base de datos: $POSTGRES_DB"
echo "  - Usuario DB: $POSTGRES_USER"
echo "  - IP Externa: 72.60.48.118"
echo "  - Dominio: grupovincula.com"

# Detener servicios anteriores si existen
echo "🛑 Deteniendo servicios anteriores..."
docker-compose -f docker-compose.prod.yml down

# Construir y ejecutar servicios
echo "🏗️  Construyendo e iniciando servicios..."
docker-compose -f docker-compose.prod.yml up --build -d

# Verificar estado de los servicios
echo "⏳ Esperando que los servicios estén listos..."
sleep 30

echo "📊 Estado de los servicios:"
docker-compose -f docker-compose.prod.yml ps

# Verificar conectividad
echo ""
echo "🔍 Verificando conectividad..."

# Health check del API Gateway
if curl -f http://localhost:8080/health &> /dev/null; then
    echo "✅ API Gateway: OK"
else
    echo "❌ API Gateway: ERROR"
fi

# Verificar PostgreSQL
if docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U $POSTGRES_USER &> /dev/null; then
    echo "✅ PostgreSQL: OK"
else
    echo "❌ PostgreSQL: ERROR"
fi

# Verificar Redis
if docker-compose -f docker-compose.prod.yml exec redis redis-cli ping &> /dev/null; then
    echo "✅ Redis: OK"
else
    echo "❌ Redis: ERROR"
fi

echo ""
echo "🌐 URLs de la aplicación:"
echo "  - API Health Check: http://72.60.48.118:8080/health"
echo "  - API Gateway: http://72.60.48.118:8080"
echo "  - User Service: http://72.60.48.118:8081"
echo "  - Call Service: http://72.60.48.118:8082"
echo "  - Queue Service: http://72.60.48.118:8083"
echo "  - LiveKit: ws://72.60.48.118:7880"
echo ""
echo "🎯 Frontend en producción apuntará a: http://72.60.48.118:8080"
echo ""
echo "📝 Para ver logs en tiempo real:"
echo "docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🛑 Para detener todos los servicios:"
echo "docker-compose -f docker-compose.prod.yml down"
