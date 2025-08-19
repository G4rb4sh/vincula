#!/bin/bash

# Script para detener todos los servicios de Vincula - Producción

echo "🛑 Deteniendo Vincula (Producción)"
echo "================================="

echo "📋 Deteniendo frontend..."
# Buscar y terminar procesos del frontend
pkill -f "node.*react-scripts" 2>/dev/null && echo "   ✅ Frontend detenido" || echo "   ℹ️  Frontend no estaba corriendo"
pkill -f "npm.*start" 2>/dev/null || true

echo "📋 Deteniendo servicios Docker..."
echo "   • API Gateway"
echo "   • User Service" 
echo "   • Call Service"
echo "   • Queue Service"
echo "   • LiveKit Server"
echo "   • PostgreSQL Database"
echo "   • Redis Cache"

docker compose down

echo "📋 Limpiando procesos en puertos..."
# Limpiar puertos específicos si están ocupados
PORTS=(3000 8080 8081 8082 8083 7880 5432 6379)

for port in "${PORTS[@]}"; do
    if command -v lsof >/dev/null 2>&1; then
        if lsof -ti:$port >/dev/null 2>&1; then
            echo "   🔧 Liberando puerto $port..."
            lsof -ti:$port | xargs kill -9 2>/dev/null || true
        fi
    elif command -v fuser >/dev/null 2>&1; then
        if fuser $port/tcp >/dev/null 2>&1; then
            echo "   🔧 Liberando puerto $port..."
            fuser -k $port/tcp >/dev/null 2>&1 || true
        fi
    elif command -v netstat >/dev/null 2>&1; then
        # Solo mostrar advertencia si hay algo en el puerto
        if netstat -tln 2>/dev/null | grep -q ":$port "; then
            echo "   ⚠️  Puerto $port puede estar ocupado. Considera reiniciar Docker o el sistema."
        fi
    fi
done

# Verificar que Docker esté limpio
echo "📋 Verificando estado de contenedores..."
RUNNING_CONTAINERS=$(docker ps -q)
if [ ! -z "$RUNNING_CONTAINERS" ]; then
    echo "   ⚠️  Algunos contenedores siguen corriendo:"
    docker ps --format "table {{.Names}}\t{{.Status}}"
else
    echo "   ✅ No hay contenedores corriendo"
fi

echo ""
echo "✅ Todos los servicios de Vincula han sido detenidos"
echo ""
echo "📝 Para iniciar nuevamente:"
echo "   • Inicio en producción: ./start.sh"
echo "   • Configuración completa: ./run-app.sh"
echo ""
echo "🧹 Comandos de limpieza adicional:"
echo "   • Eliminar volúmenes: docker compose down -v"
echo "   • Limpiar sistema Docker: docker system prune -f"
echo "   • Limpiar todo Docker: docker system prune -a --volumes -f"
echo ""
echo "🔍 Verificar puertos libres:"
echo "   • lsof -i :3000,8080,8081,8082,8083,7880,5432,6379  (si tienes lsof)"
echo "   • netstat -tln | grep -E ':(3000|8080|8081|8082|8083|7880|5432|6379) '"
echo "   • ss -tln | grep -E ':(3000|8080|8081|8082|8083|7880|5432|6379) '"
echo "" 