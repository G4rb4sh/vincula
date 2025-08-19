@echo off
echo 🚀 Vincula - Modo Desarrollo (Solo Frontend)
echo ============================================

:: Verificar si el puerto 3000 está ocupado (probablemente por Docker frontend)
echo 📡 Verificando puerto 3000...
netstat -an | findstr ":3000" >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  Puerto 3000 está ocupado (probablemente Docker frontend)
    echo 💡 Deteniendo SOLO el contenedor del frontend...
    docker compose stop frontend >nul 2>&1
    docker compose rm -f frontend >nul 2>&1
    timeout /t 2 >nul
    echo ✅ Frontend Docker detenido, backend sigue corriendo
)

:: Verificar si el backend está corriendo
echo 📡 Verificando si el backend está activo...
timeout /t 2 >nul
curl -s http://localhost:8080/health >nul 2>&1
if errorlevel 1 (
    echo Backend no esta corriendo
    echo.
    echo Opciones para iniciar el backend:
    echo    1. Iniciar automaticamente con start-backend-only.bat
    echo    2. Iniciar servicios manualmente con Docker
    echo    3. Usar start-windows.bat en otra terminal
    echo.
    set /p option="Selecciona una opcion (1, 2, 3): "
    
    if "%option%"=="1" goto backend_only
    if "%option%"=="2" goto manual_backend  
    if "%option%"=="3" goto full_start
    goto manual_backend
    
    :backend_only
    echo Iniciando backend automaticamente...
    start /wait start-backend-only.bat
    goto continue_check
    
    :manual_backend
    echo Iniciando servicios backend...
    docker compose up -d postgres redis api-gateway user-service call-service queue-service livekit
    timeout /t 10 >nul
    goto continue_check
    
    :full_start
    echo Ejecuta start-windows.bat en otra terminal y presiona Enter aqui
    pause
    goto continue_check
    
    :continue_check
    echo Verificando backend nuevamente...
    timeout /t 3 >nul
    curl -s http://localhost:8080/health >nul 2>&1
    if errorlevel 1 (
        echo Backend sigue sin responder. Verifica que este corriendo.
        pause
        exit /b 1
    )
)
echo ✅ Backend está corriendo

:: Cambiar al directorio del frontend
cd frontend

:: Verificar si node_modules existe
if not exist node_modules (
    echo 📦 Instalando dependencias del frontend...
    npm install
    if errorlevel 1 (
        echo ❌ Error instalando dependencias
        pause
        exit /b 1
    )
)

echo 📋 Iniciando frontend en modo desarrollo...
echo 🌐 El frontend estará disponible en: http://localhost:3000
echo 🔄 Hot reload activado - los cambios se reflejarán automáticamente
echo 🐳 Docker frontend detenido para usar este modo de desarrollo
echo.

:: Iniciar servidor de desarrollo en puerto 3000
set PORT=3000
set REACT_APP_API_URL=http://localhost:8080
set REACT_APP_WS_URL=ws://localhost:8080
set REACT_APP_LIVEKIT_URL=ws://localhost:7880

npm start
