#!/bin/bash

# Vincula - Script de Inicio
# Este script inicia todos los servicios de la aplicación

set -e

echo "==================================="
echo "   Vincula - Iniciando"
echo "==================================="

# Verificar que el archivo .env existe
if [ ! -f .env ]; then
    echo "Error: No se encontró el archivo .env"
    echo "Ejecuta './setup.sh' primero"
    exit 1
fi

# Cargar variables de entorno
source .env

# Detener contenedores existentes si los hay
echo "Deteniendo contenedores existentes (si los hay)..."
docker-compose -f docker-compose.yaml -f docker-compose.prod.yml down 2>/dev/null || true

# Construir las imágenes
echo ""
echo "Construyendo imágenes Docker..."
docker-compose -f docker-compose.yaml -f docker-compose.prod.yml build

# Iniciar servicios
echo ""
echo "Iniciando servicios..."
docker-compose -f docker-compose.yaml -f docker-compose.prod.yml up -d

# Esperar a que los servicios estén listos
echo ""
echo "Esperando a que los servicios estén listos..."
sleep 10

# Verificar estado de los servicios
echo ""
echo "==================================="
echo "   Estado de los Servicios"
echo "==================================="
docker-compose -f docker-compose.yaml -f docker-compose.prod.yml ps

echo ""
echo "==================================="
echo "   Aplicación Iniciada"
echo "==================================="
echo ""
echo "Servicios disponibles:"
echo "  - API Gateway:    http://localhost:8080"
echo "  - User Service:   http://localhost:8081"
echo "  - Call Service:   http://localhost:8082"
echo "  - Queue Service:  http://localhost:8083"
echo "  - LiveKit:        ws://localhost:7880"
echo "  - PostgreSQL:     localhost:5432"
echo "  - Redis:          localhost:6379"
echo ""
echo "Para ver los logs: docker-compose -f docker-compose.yaml -f docker-compose.prod.yml logs -f"
echo "Para detener: ./cleanup.sh"
echo ""


