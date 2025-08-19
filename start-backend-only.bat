@echo off
echo 🚀 Vincula - Solo Backend (Para Desarrollo Frontend)
echo =================================================

:: Obtener la IP del adaptador de red principal
echo 📡 Detectando IP del host...
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /C:"IPv4"') do (
    set "temp_ip=%%i"
    set "temp_ip=!temp_ip: =!"
    if not "!temp_ip!"=="127.0.0.1" if not "!temp_ip:~0,3!"=="169" (
        set HOST_IP=!temp_ip!
        goto :ip_found
    )
)

:ip_found
if "%HOST_IP%"=="" (
    echo ❌ No se pudo detectar la IP del host
    set HOST_IP=localhost
    echo ⚠️  Usando localhost
) else (
    echo ✅ IP del host detectada: %HOST_IP%
)

:: Verificar si Docker Desktop está corriendo
echo 🐳 Verificando Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Desktop no está corriendo
    echo 💡 Por favor inicia Docker Desktop y espera a que esté listo
    pause
    exit /b 1
)
echo ✅ Docker Desktop está corriendo

:: Crear archivo .env si no existe
if not exist .env (
    echo 💡 Creando archivo .env...
    (
    echo # Archivo de configuracion para Vincula - Backend Only
    echo POSTGRES_DB=vincula
    echo POSTGRES_USER=vincula_user
    echo POSTGRES_PASSWORD=vincula_password_2024
    echo JWT_SECRET=your_super_secret_jwt_key_vincula_2024_production_change_this
    echo LIVEKIT_API_KEY=devkey
    echo LIVEKIT_SECRET_KEY=secret
    echo NODE_ENV=development
    ) > .env
    echo ✅ Archivo .env creado
)

:: Detener servicios previos
echo 📋 Deteniendo servicios previos...
docker compose down >nul 2>&1

echo 📋 Iniciando solo servicios backend...
echo    • PostgreSQL Database
echo    • Redis Cache  
echo    • LiveKit Server
echo    • API Gateway
echo    • User Service
echo    • Call Service
echo    • Queue Service
echo.
echo 🚫 Frontend NO incluido - para desarrollo local

docker compose up -d postgres redis api-gateway user-service call-service queue-service livekit

echo 📋 Esperando que los servicios estén listos...
timeout /t 10 >nul

:: Verificar si la base de datos necesita ser poblada
echo 📋 Verificando base de datos...
for /f %%i in ('docker compose exec -T postgres psql -U vincula_user -d vincula -t -c "SELECT COUNT(*) FROM users;" 2^>nul ^| findstr /r "[0-9]"') do set DB_COUNT=%%i

if "%DB_COUNT%"=="0" (
    echo 📋 Poblando base de datos con usuarios de prueba...
    docker compose exec -T postgres psql -U vincula_user -d vincula -c "INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at) VALUES (uuid_generate_v4(), 'patient@vincula.com', '$2a$10$8K1p/a0dUrziYBWLlso2aOZZgS2Cjmvu/bEhKUmhBqBaXhxhXKIZC', 'Juan', 'Perez', 'patient', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), (uuid_generate_v4(), 'doctor@vincula.com', '$2a$10$8K1p/a0dUrziYBWLlso2aOZZgS2Cjmvu/bEhKUmhBqBaXhxhXKIZC', 'Ana', 'Garcia', 'employee', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), (uuid_generate_v4(), 'family@vincula.com', '$2a$10$8K1p/a0dUrziYBWLlso2aOZZgS2Cjmvu/bEhKUmhBqBaXhxhXKIZC', 'Maria', 'Lopez', 'family', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), (uuid_generate_v4(), 'admin@vincula.com', '$2a$10$8K1p/a0dUrziYBWLlso2aOZZgS2Cjmvu/bEhKUmhBqBaXhxhXKIZC', 'Carlos', 'Administrador', 'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT (email) DO NOTHING;" >nul
    echo ✅ Usuarios de prueba creados
) else (
    echo ✅ Base de datos ya contiene usuarios
)

echo.
echo 🎉 ¡Backend de Vincula está corriendo!
echo ====================================
echo.
echo 🌐 URLs disponibles:
echo    • API Gateway: http://localhost:8080
echo    • LiveKit:     http://localhost:7880
echo.
echo 👥 Usuarios de Prueba (contraseña: 123456):
echo    • Paciente: patient@vincula.com
echo    • Doctor:   doctor@vincula.com
echo    • Familiar: family@vincula.com
echo    • Admin:    admin@vincula.com
echo.
echo 💡 Para desarrollo del frontend:
echo    Ejecuta 'start-dev.bat' en otra terminal
echo.
echo 📝 Comandos útiles:
echo    • Ver logs: docker compose logs -f
echo    • Detener: docker compose down
echo.
pause
