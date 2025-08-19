#!/bin/bash

# Script específico para iniciar Vincula en WSL/Ubuntu
# Este script contiene optimizaciones adicionales para entornos WSL

echo "🚀 Vincula - Inicio en WSL/Ubuntu"
echo "=================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar si estamos en WSL
if [[ -n "$WSL_DISTRO_NAME" ]]; then
    print_success "Detectado entorno WSL: $WSL_DISTRO_NAME"
    
    # Verificar integración con Docker Desktop
    if ! docker info >/dev/null 2>&1; then
        print_warning "Docker no está disponible."
        echo "En WSL, asegúrate de que:"
        echo "1. Docker Desktop esté instalado en Windows"
        echo "2. La integración con WSL esté habilitada en Docker Desktop"
        echo "3. Reiniciar la distribución WSL después de habilitar la integración"
        echo ""
        echo "Para verificar Docker Desktop WSL integration:"
        echo "- Abre Docker Desktop en Windows"
        echo "- Ve a Settings > Resources > WSL Integration"
        echo "- Habilita la integración para tu distribución WSL"
        exit 1
    fi
    
    # Verificar si Docker daemon está corriendo
    if ! docker ps >/dev/null 2>&1; then
        print_error "Docker daemon no está corriendo en WSL"
        echo "Intenta:"
        echo "- Iniciar Docker Desktop en Windows"
        echo "- Esperar a que esté completamente iniciado"
        echo "- Reiniciar esta terminal WSL"
        exit 1
    fi
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    print_success "Detectado entorno Linux nativo"
    
    # En Linux nativo, verificar docker daemon
    if ! systemctl is-active --quiet docker; then
        print_warning "Docker daemon no está corriendo"
        echo "Intentando iniciar Docker..."
        sudo systemctl start docker
        sleep 3
    fi
else
    print_warning "Sistema no reconocido como WSL ni Linux"
fi

# Verificar herramientas necesarias
echo "🔧 Verificando herramientas del sistema..."

# Instalar herramientas faltantes si es necesario
if ! command -v netcat >/dev/null 2>&1 && ! command -v nc >/dev/null 2>&1; then
    print_warning "netcat no está instalado"
    echo "Para instalar: sudo apt update && sudo apt install netcat-openbsd"
fi

if ! command -v curl >/dev/null 2>&1; then
    print_warning "curl no está instalado"
    echo "Para instalar: sudo apt update && sudo apt install curl"
fi

# Verificar puertos específicos para WSL
echo "🔍 Verificando puertos disponibles..."
PORTS=(3000 8080 8081 8082 8083 7880 5432 6379)
for port in "${PORTS[@]}"; do
    if ss -tln 2>/dev/null | grep -q ":$port "; then
        print_warning "Puerto $port está ocupado"
        echo "   Proceso usando puerto $port:"
        ss -tlnp 2>/dev/null | grep ":$port " || true
    fi
done

# Verificar memoria disponible (importante en WSL)
MEM_AVAILABLE=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
if [[ -n "$MEM_AVAILABLE" ]] && [[ "$MEM_AVAILABLE" -lt 4000000 ]]; then
    print_warning "Memoria disponible: $(($MEM_AVAILABLE / 1024)) MB"
    echo "Vincula requiere al menos 4GB de RAM disponible para funcionar óptimamente"
    echo "Considera cerrar otras aplicaciones si experimentas problemas"
fi

# Configurar variables de entorno específicas para WSL
export DOCKER_HOST_IP="localhost"
export LIVEKIT_RTC_NODE_IP="localhost"

print_success "Verificaciones completadas"
echo ""
echo "🎯 Iniciando aplicación con configuración WSL optimizada..."

# Ejecutar el script principal con configuración WSL
exec ./start.sh