@echo off
setlocal enabledelayedexpansion

echo 🚀 Vincula - Inicio en Windows (Acceso de Red)
echo ===============================================

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
    echo ⚠️  Usando localhost - solo accesible localmente
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
    echo # Archivo de configuracion para Vincula - Windows
    echo # Base de datos PostgreSQL
    echo POSTGRES_DB=vincula
    echo POSTGRES_USER=vincula_user
    echo POSTGRES_PASSWORD=vincula_password_2024
    echo.
    echo # JWT Secret para autenticacion
    echo JWT_SECRET=your_super_secret_jwt_key_vincula_2024_production_change_this
    echo.
    echo # LiveKit Configuration
    echo LIVEKIT_API_KEY=devkey
    echo LIVEKIT_SECRET_KEY=secret
    echo.
    echo # Configuracion adicional
    echo NODE_ENV=production
    ) > .env
    echo ✅ Archivo .env creado
)

:: Crear docker-compose override para Windows
echo 📋 Configurando acceso de red...
(
echo services:
echo   livekit:
echo     environment:
echo       - "LIVEKIT_KEYS=devkey: secret"
echo       - LIVEKIT_REDIS=redis://redis:6379
echo       - LIVEKIT_RTC_NODE_IP=%HOST_IP%
echo       - LIVEKIT_RTC_USE_EXTERNAL_IP=true
echo       - LIVEKIT_RTC_UDP_PORT=7882
echo       - LIVEKIT_RTC_PORT_RANGE_START=7882
echo       - LIVEKIT_RTC_PORT_RANGE_END=7882
echo       - LIVEKIT_RTC_TCP_PORT=7881
echo       - LIVEKIT_RTC_STUN_SERVERS=stun:stun.l.google.com:19302
echo       - LIVEKIT_LOG_LEVEL=info
echo.
echo   frontend:
echo     environment:
echo       - REACT_APP_API_URL=http://%HOST_IP%:8080
echo       - REACT_APP_WS_URL=ws://%HOST_IP%:8080
echo       - REACT_APP_LIVEKIT_URL=ws://%HOST_IP%:7880
) > docker-compose.override.yml

echo ✅ Configuración de red creada

:: Detener servicios previos
echo 📋 Deteniendo servicios previos...
docker compose down >nul 2>&1

:: Limpiar imágenes del frontend para forzar reconstrucción
echo 📋 Limpiando imágenes del frontend para aplicar cambios...
docker image rm vincula-frontend >nul 2>&1

echo 📋 Iniciando servicios...
echo    • PostgreSQL Database
echo    • Redis Cache  
echo    • LiveKit Server ^(configurado para %HOST_IP%^)
echo    • API Gateway
echo    • User Service
echo    • Call Service
echo    • Queue Service
echo    • Frontend ^(RECONSTRUYENDO con cambios nuevos^)

docker compose up -d --build

echo 📋 Esperando que los servicios esten listos...
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
echo 🎉 ¡Vincula esta corriendo en Windows con acceso de red!
echo ========================================================
echo.
echo 🌐 URLs para ESTA PC:
echo    • Frontend:    http://localhost:3000
echo    • API Gateway: http://localhost:8080
echo    • LiveKit:     http://localhost:7880
echo.
echo 🌐 URLs para OTRAS PCs en la red:
echo    • Frontend:    http://%HOST_IP%:3000
echo    • API Gateway: http://%HOST_IP%:8080
echo    • LiveKit:     ws://%HOST_IP%:7880
echo.
echo 👥 Usuarios de Prueba (contraseña: 123456):
echo    • Paciente: patient@vincula.com
echo    • Doctor:   doctor@vincula.com
echo    • Familiar: family@vincula.com
echo    • Admin:    admin@vincula.com
echo.
echo 📝 Comandos utiles:
echo    • Ver logs: docker compose logs -f
echo    • Detener: docker compose down
echo.
echo ⚠️  IMPORTANTE - Configuracion del Firewall:
echo    Para permitir acceso desde otras PCs, asegurate de que el
echo    Firewall de Windows permita conexiones en los puertos:
echo    • 3000 (Frontend)
echo    • 8080 (API Gateway)  
echo    • 7880, 7881, 7882 (LiveKit)
echo.
echo 💡 Ejecuta 'configure-firewall.bat' para configurar automaticamente
echo.
pause

