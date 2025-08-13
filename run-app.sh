#!/bin/bash

# =================================
# VINCULA - Script de Ejecución
# =================================
# Este script ejecuta toda la aplicación Vincula con todos sus componentes

set -e  # Salir si algún comando falla

# Verificar si se pasó el flag --yes o -y para modo no-interactivo
AUTO_YES=false
if [[ "$1" == "--yes" ]] || [[ "$1" == "-y" ]]; then
    AUTO_YES=true
fi

echo "🚀 Iniciando Vincula - Aplicación de Videollamadas Médicas"
echo "============================================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
print_step() {
    echo -e "\n${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# =================================
# 1. VERIFICACIÓN DE REQUISITOS
# =================================
print_step "Verificando requisitos del sistema..."

# Verificar Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado. Por favor instalar Docker Desktop."
    exit 1
fi

# Verificar Docker Compose
if ! command -v docker compose &> /dev/null; then
    print_error "Docker Compose no está instalado."
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Por favor instalar Node.js 18+."
    exit 1
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado."
    exit 1
fi

print_success "Todos los requisitos están instalados"

# =================================
# 2. CONFIGURACIÓN DE VARIABLES DE ENTORNO
# =================================
print_step "Configurando variables de entorno..."

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    cat > .env << 'EOF'
# =================================
# CONFIGURACIÓN DE ENTORNO - VINCULA
# =================================

# Base de datos
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=vincula
POSTGRES_USER=vincula_user
POSTGRES_PASSWORD=vincula_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro_cambialo_en_produccion
JWT_EXPIRATION=24h

# Livekit
LIVEKIT_API_KEY=devkey
LIVEKIT_SECRET_KEY=secret
LIVEKIT_HOST=ws://localhost:7880
LIVEKIT_URL=http://localhost:7880

# API Gateway
API_GATEWAY_PORT=8080
API_GATEWAY_HOST=localhost

# Microservicios
USER_SERVICE_PORT=8081
CALL_SERVICE_PORT=8082
QUEUE_SERVICE_PORT=8083
NOTIFICATION_SERVICE_PORT=8084
AUDIT_SERVICE_PORT=8085
RECORDING_SERVICE_PORT=8086

# Frontend
REACT_APP_API_URL=http://localhost:8080
REACT_APP_WS_URL=ws://localhost:8080
REACT_APP_LIVEKIT_URL=ws://localhost:7880

# Grabación (desarrollo)
RECORDING_ENABLED=true
RECORDING_PATH=/tmp/recordings

# Desarrollo
NODE_ENV=development
GO_ENV=development
LOG_LEVEL=debug
EOF
    print_success "Archivo .env creado con configuración de desarrollo"
else
    print_success "Archivo .env ya existe"
fi

# Cargar variables de entorno
set -a
source .env 2>/dev/null || true
set +a

# Verificar variables críticas
if [ -z "$LIVEKIT_SECRET_KEY" ]; then
    export LIVEKIT_SECRET_KEY="secret"
    print_warning "LIVEKIT_SECRET_KEY no encontrado, usando valor por defecto"
fi

if [ -z "$POSTGRES_PASSWORD" ]; then
    export POSTGRES_PASSWORD="vincula_password"
    print_warning "POSTGRES_PASSWORD no encontrado, usando valor por defecto"
fi

if [ -z "$JWT_SECRET" ]; then
    export JWT_SECRET="tu_jwt_secret_super_seguro_cambialo_en_produccion"
    print_warning "JWT_SECRET no encontrado, usando valor por defecto"
fi

# =================================
# 3. DETENER SERVICIOS ANTERIORES
# =================================
print_step "Deteniendo servicios anteriores..."

# Detener contenedores Docker
docker compose down 2>/dev/null || true

# Matar procesos de Node.js anteriores
pkill -f "node.*react-scripts" 2>/dev/null || true
pkill -f "npm.*start" 2>/dev/null || true

print_success "Servicios anteriores detenidos"

# =================================
# 4. LIMPIAR Y PREPARAR ENTORNO
# =================================
print_step "Limpiando entorno..."

# Limpiar volúmenes Docker (automático en modo no-interactivo)
if [ "$AUTO_YES" = true ]; then
    print_warning "Modo automático: Limpiando volúmenes Docker..."
    docker compose down -v 2>/dev/null || true
    docker system prune -f 2>/dev/null || true
    print_success "Volúmenes Docker limpiados"
else
    # Modo interactivo con timeout
    echo "¿Deseas limpiar los volúmenes de Docker? (y/N) [Auto N en 5s]: "
    read -t 5 -n 1 -r REPLY 2>/dev/null || true
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker compose down -v
        docker system prune -f
        print_success "Volúmenes Docker limpiados"
    else
        print_warning "Volúmenes Docker no limpiados"
    fi
fi

# =================================
# 5. CONSTRUIR E INICIAR SERVICIOS BACKEND
# =================================
print_step "Iniciando servicios backend con Docker Compose..."

# Construir e iniciar servicios
docker compose up -d --build

print_success "Servicios backend iniciados"

# =================================
# 6. ESPERAR A QUE LOS SERVICIOS ESTÉN LISTOS
# =================================
print_step "Esperando a que los servicios estén listos..."

# Función para verificar PostgreSQL
wait_for_postgres() {
    local max_attempts=30
    local attempt=1
    
    echo "Esperando PostgreSQL..."
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec vincula-postgres-1 pg_isready -U healthcare_user > /dev/null 2>&1; then
            print_success "PostgreSQL está listo"
            return 0
        fi
        
        echo "Intento $attempt/$max_attempts - Esperando PostgreSQL..."
        sleep 2
        ((attempt++))
    done
    
    print_warning "PostgreSQL no respondió después de $max_attempts intentos"
    return 1
}

# Función para verificar Redis
wait_for_redis() {
    local max_attempts=30
    local attempt=1
    
    echo "Esperando Redis..."
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec vincula-redis-1 redis-cli ping > /dev/null 2>&1; then
            print_success "Redis está listo"
            return 0
        fi
        
        echo "Intento $attempt/$max_attempts - Esperando Redis..."
        sleep 2
        ((attempt++))
    done
    
    print_warning "Redis no respondió después de $max_attempts intentos"
    return 1
}

# Función para verificar Livekit
wait_for_livekit() {
    local max_attempts=30
    local attempt=1
    
    echo "Esperando Livekit..."
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z localhost 7880 > /dev/null 2>&1; then
            print_success "Livekit está listo"
            return 0
        fi
        
        echo "Intento $attempt/$max_attempts - Esperando Livekit..."
        sleep 2
        ((attempt++))
    done
    
    print_warning "Livekit no respondió después de $max_attempts intentos"
    return 1
}

# Esperar servicios
wait_for_postgres || true
wait_for_redis || true
wait_for_livekit || true

print_success "Servicios backend listos"

# =================================
# 7. EJECUTAR MIGRACIONES DE BASE DE DATOS
# =================================
print_step "Ejecutando migraciones de base de datos..."

# Ejecutar migraciones usando Docker
docker compose exec -T postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT 1" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    # Ejecutar archivos de migración
    for migration in database/migrations/*.sql; do
        if [ -f "$migration" ]; then
            echo "Ejecutando migración: $(basename $migration)"
            docker compose exec -T postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -f "/docker-entrypoint-initdb.d/migrations/$(basename $migration)"
        fi
    done
    print_success "Migraciones ejecutadas correctamente"
else
    print_warning "No se pudieron ejecutar las migraciones automáticamente"
fi

# =================================
# 8. INSTALAR DEPENDENCIAS DEL FRONTEND
# =================================
print_step "Instalando dependencias del frontend..."

cd frontend

# Verificar si node_modules existe
if [ ! -d "node_modules" ]; then
    npm install
    print_success "Dependencias instaladas"
else
    print_success "Dependencias ya instaladas"
fi

cd ..

# =================================
# 9. INICIAR FRONTEND
# =================================
print_step "Iniciando frontend de React..."

# Abrir una nueva terminal para el frontend
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)'/frontend && npm start"' 2>/dev/null || \
gnome-terminal -- bash -c "cd $(pwd)/frontend && npm start; exec bash" 2>/dev/null || \
echo "Por favor, abre una nueva terminal y ejecuta: cd frontend && npm start"

print_success "Frontend iniciándose en nueva terminal"

# =================================
# 10. MOSTRAR ESTADO DE SERVICIOS
# =================================
print_step "Verificando estado de servicios..."

echo ""
echo "🌐 SERVICIOS ACTIVOS:"
echo "===================="
echo "• PostgreSQL:      http://localhost:5432"
echo "• Redis:           http://localhost:6379"
echo "• Livekit:         http://localhost:7880"
echo "• API Gateway:     http://localhost:8080"
echo "• User Service:    http://localhost:8081"
echo "• Call Service:    http://localhost:8082"
echo "• Queue Service:   http://localhost:8083"
echo "• Notification:    http://localhost:8084"
echo "• Audit Service:   http://localhost:8085"
echo "• Recording:       http://localhost:8086"
echo "• Frontend React:  http://localhost:3000"
echo ""

# =================================
# 11. COMANDOS ÚTILES
# =================================
print_step "Comandos útiles para desarrollo:"

echo ""
echo "📝 COMANDOS ÚTILES:"
echo "=================="
echo "• Ver logs Docker:           docker compose logs -f"
echo "• Ver logs específico:       docker compose logs -f [servicio]"
echo "• Reiniciar servicios:       docker compose restart"
echo "• Detener todo:              docker compose down"
echo "• Ejecutar migración:        docker compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB"
echo "• Frontend (manual):         cd frontend && npm start"
echo "• Build frontend:            cd frontend && npm run build"
echo "• Tests frontend:            cd frontend && npm test"
echo ""

# =================================
# 12. INFORMACIÓN FINAL
# =================================
print_success "¡Vincula está ejecutándose!"

echo ""
echo "🎉 APLICACIÓN LISTA:"
echo "==================="
echo "• Aplicación web: http://localhost:3000"
echo "• API Gateway:    http://localhost:8080"
echo "• Livekit UI:     http://localhost:7880"
echo ""
echo "👥 USUARIOS DE PRUEBA:"
echo "====================="
echo "• Empleado:  user: employee@test.com, pass: password123"
echo "• Paciente:  user: patient@test.com,  pass: password123"
echo "• Familiar:  user: family@test.com,   pass: password123"
echo "• Admin:     user: admin@test.com,    pass: password123"
echo ""

print_warning "NOTA: Para detener la aplicación, ejecuta: docker compose down"
print_warning "NOTA: Los logs se pueden ver con: docker compose logs -f"

echo ""
echo "🔧 Para desarrollo:"
echo "• Edita el código y se recargará automáticamente"
echo "• Revisa los logs si hay errores"
echo "• Las grabaciones se guardan en /tmp/recordings"
echo ""

# Solo hacer monitoreo si no es modo automático
if [ "$AUTO_YES" = false ]; then
    # Mantener el script activo
    echo "Presiona Ctrl+C para detener el monitoreo..."
    echo "Monitoreando servicios..."

    # Monitorear servicios
    while true; do
        sleep 10
        
        # Verificar si Docker Compose sigue activo
        if ! docker compose ps | grep -q "Up"; then
            print_error "Algunos servicios se han detenido"
            docker compose ps
            break
        fi
    done
else
    print_success "Modo automático completado. Servicios ejecutándose en background."
fi 