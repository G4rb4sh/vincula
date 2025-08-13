#!/bin/bash

# Script de inicio para Vincula - Producción
# Versión actualizada sin mock server

echo "🚀 Vincula - Inicio en Producción"
echo "=================================="

# Verificar si existe .env
if [ ! -f .env ]; then
    echo "❌ Archivo .env no encontrado."
    echo "💡 Creando archivo .env con configuración por defecto..."
    
    cat > .env << EOF
# Archivo de configuración para Vincula
# Base de datos PostgreSQL
POSTGRES_DB=vincula
POSTGRES_USER=vincula_user
POSTGRES_PASSWORD=vincula_password_2024

# JWT Secret para autenticación
JWT_SECRET=your_super_secret_jwt_key_vincula_2024_production_change_this

# LiveKit Configuration
LIVEKIT_API_KEY=devkey
LIVEKIT_SECRET_KEY=secret

# Configuración adicional
NODE_ENV=production
EOF
    echo "✅ Archivo .env creado"
fi

# Cargar variables de entorno
export $(cat .env | grep -v '^#' | xargs) 2>/dev/null

# Verificar si Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker no está corriendo. Por favor, inicia Docker Desktop."
    echo "💡 Intentando iniciar Docker..."
    open -a Docker 2>/dev/null || echo "⚠️  No se pudo iniciar Docker automáticamente"
    echo "   Espera a que Docker esté listo y ejecuta este script nuevamente."
    exit 1
fi

echo "📋 Deteniendo servicios previos (si existen)..."
docker compose down 2>/dev/null

echo "📋 Iniciando servicios (Docker Compose)..."
echo "   • PostgreSQL Database"
echo "   • Redis Cache"
echo "   • LiveKit Server"
echo "   • API Gateway"
echo "   • User Service"
echo "   • Call Service"
echo "   • Queue Service"
echo "   • Frontend (Nginx)"

docker compose up -d

echo "📋 Esperando que los servicios estén listos..."
sleep 10

# Verificar si la base de datos necesita ser poblada
echo "📋 Verificando base de datos..."
DB_CHECK=$(docker compose exec -T postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' \n' || echo "0")

if [ "$DB_CHECK" = "0" ] || [ -z "$DB_CHECK" ]; then
    echo "📋 Poblando base de datos con usuarios de prueba..."
    docker compose exec -T postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} << EOF
-- Insertar usuarios iniciales para pruebas
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at) VALUES 
(
    uuid_generate_v4(),
    'patient@vincula.com',
    '\$2a\$10\$8K1p/a0dUrziYBWLlso2aOZZgS2Cjmvu/bEhKUmhBqBaXhxhXKIZC',
    'Juan',
    'Pérez',
    'patient',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    uuid_generate_v4(),
    'doctor@vincula.com',
    '\$2a\$10\$8K1p/a0dUrziYBWLlso2aOZZgS2Cjmvu/bEhKUmhBqBaXhxhXKIZC',
    'Ana',
    'García',
    'employee',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    uuid_generate_v4(),
    'family@vincula.com',
    '\$2a\$10\$8K1p/a0dUrziYBWLlso2aOZZgS2Cjmvu/bEhKUmhBqBaXhxhXKIZC',
    'María',
    'López',
    'family',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    uuid_generate_v4(),
    'admin@vincula.com',
    '\$2a\$10\$8K1p/a0dUrziYBWLlso2aOZZgS2Cjmvu/bEhKUmhBqBaXhxhXKIZC',
    'Carlos',
    'Administrador',
    'admin',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;
EOF
    echo "✅ Usuarios de prueba creados"
else
    echo "✅ Base de datos ya contiene usuarios"
fi

# Asegurar que ningún servidor local ocupe el puerto 3000 (interfiere con el frontend en Docker)
if lsof -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "⚠️  Detectado un proceso escuchando en el puerto 3000 en el host."
    echo "   Esto puede interferir con el frontend en Docker. Por favor, cierra ese proceso."
    lsof -nP -iTCP:3000 -sTCP:LISTEN || true
fi

echo ""
echo "🎉 ¡Vincula está corriendo en PRODUCCIÓN!"
echo "========================================"
echo ""
echo "🌐 URLs Disponibles:"
echo "   • Frontend:    http://localhost:3000"
echo "   • API Gateway: http://localhost:8080"
echo "   • User Service: http://localhost:8081"
echo "   • LiveKit:     http://localhost:7880"
echo ""
echo "👥 Usuarios de Prueba (contraseña: 123456):"
echo "   • Paciente: patient@vincula.com"
echo "   • Doctor:   doctor@vincula.com"
echo "   • Familiar: family@vincula.com"
echo "   • Admin:    admin@vincula.com"
echo ""
echo "📝 Comandos útiles:"
echo "   • Ver logs backend: docker compose logs -f"
echo "   • Ver logs específicos: docker compose logs -f [servicio]"
echo "   • Detener todo: ./stop.sh"
echo "   • Reiniciar: ./stop.sh && ./start.sh"
echo ""
echo "⚠️  IMPORTANTE: Mock server DESHABILITADO - usando backend real"
echo "" 