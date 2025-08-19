@echo off

echo 🔥 Vincula - Configurador de Firewall de Windows
echo =================================================
echo.
echo ⚠️  IMPORTANTE: Este script debe ejecutarse como ADMINISTRADOR
echo.
echo 📋 Configurando reglas del firewall para permitir acceso externo...
echo.

:: Verificar si se está ejecutando como administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Ejecutando con permisos de administrador
) else (
    echo ❌ ERROR: Este script requiere permisos de administrador
    echo 💡 Haz clic derecho sobre el archivo y selecciona "Ejecutar como administrador"
    pause
    exit /b 1
)

echo.
echo 📋 Creando reglas de firewall...

:: Eliminar reglas existentes (por si las hubiera)
netsh advfirewall firewall delete rule name="Vincula Frontend" >nul 2>&1
netsh advfirewall firewall delete rule name="Vincula API Gateway" >nul 2>&1
netsh advfirewall firewall delete rule name="Vincula User Service" >nul 2>&1
netsh advfirewall firewall delete rule name="Vincula Call Service" >nul 2>&1
netsh advfirewall firewall delete rule name="Vincula Queue Service" >nul 2>&1
netsh advfirewall firewall delete rule name="Vincula LiveKit HTTP" >nul 2>&1
netsh advfirewall firewall delete rule name="Vincula LiveKit TCP" >nul 2>&1
netsh advfirewall firewall delete rule name="Vincula LiveKit UDP" >nul 2>&1

echo 🌐 Configurando puerto 3000 (Frontend)...
netsh advfirewall firewall add rule name="Vincula Frontend" dir=in action=allow protocol=TCP localport=3000
if %errorLevel% == 0 (
    echo ✅ Puerto 3000 configurado
) else (
    echo ❌ Error configurando puerto 3000
)

echo 🌐 Configurando puerto 8080 (API Gateway)...
netsh advfirewall firewall add rule name="Vincula API Gateway" dir=in action=allow protocol=TCP localport=8080
if %errorLevel% == 0 (
    echo ✅ Puerto 8080 configurado
) else (
    echo ❌ Error configurando puerto 8080
)

echo 🌐 Configurando puerto 8081 (User Service)...
netsh advfirewall firewall add rule name="Vincula User Service" dir=in action=allow protocol=TCP localport=8081
if %errorLevel% == 0 (
    echo ✅ Puerto 8081 configurado
) else (
    echo ❌ Error configurando puerto 8081
)

echo 🌐 Configurando puerto 8082 (Call Service)...
netsh advfirewall firewall add rule name="Vincula Call Service" dir=in action=allow protocol=TCP localport=8082
if %errorLevel% == 0 (
    echo ✅ Puerto 8082 configurado
) else (
    echo ❌ Error configurando puerto 8082
)

echo 🌐 Configurando puerto 8083 (Queue Service)...
netsh advfirewall firewall add rule name="Vincula Queue Service" dir=in action=allow protocol=TCP localport=8083
if %errorLevel% == 0 (
    echo ✅ Puerto 8083 configurado
) else (
    echo ❌ Error configurando puerto 8083
)

echo 🌐 Configurando puerto 7880 (LiveKit HTTP)...
netsh advfirewall firewall add rule name="Vincula LiveKit HTTP" dir=in action=allow protocol=TCP localport=7880
if %errorLevel% == 0 (
    echo ✅ Puerto 7880 configurado
) else (
    echo ❌ Error configurando puerto 7880
)

echo 🌐 Configurando puerto 7881 (LiveKit TCP)...
netsh advfirewall firewall add rule name="Vincula LiveKit TCP" dir=in action=allow protocol=TCP localport=7881
if %errorLevel% == 0 (
    echo ✅ Puerto 7881 configurado
) else (
    echo ❌ Error configurando puerto 7881
)

echo 🌐 Configurando puerto 7882 (LiveKit UDP)...
netsh advfirewall firewall add rule name="Vincula LiveKit UDP" dir=in action=allow protocol=UDP localport=7882
if %errorLevel% == 0 (
    echo ✅ Puerto 7882 configurado
) else (
    echo ❌ Error configurando puerto 7882
)

echo.
echo 🎉 ¡Configuración del firewall completada!
echo ==========================================
echo.
echo ✅ Puertos configurados para acceso externo:
echo    • 3000 (Frontend)
echo    • 8080 (API Gateway)
echo    • 8081 (User Service)
echo    • 8082 (Call Service)  
echo    • 8083 (Queue Service)
echo    • 7880 (LiveKit HTTP)
echo    • 7881 (LiveKit TCP)
echo    • 7882 (LiveKit UDP)
echo.
echo 💡 Ahora puedes ejecutar start-windows.bat y acceder desde otras PCs
echo.
echo 📋 Para ver las reglas creadas:
echo    netsh advfirewall firewall show rule name=all ^| findstr "Vincula"
echo.
echo 🗑️  Para eliminar las reglas en el futuro:
echo    Ejecuta 'remove-firewall-rules.bat'
echo.
pause

