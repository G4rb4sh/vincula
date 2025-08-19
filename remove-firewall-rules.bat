@echo off

echo 🗑️  Vincula - Eliminador de Reglas de Firewall
echo ===============================================
echo.
echo ⚠️  IMPORTANTE: Este script debe ejecutarse como ADMINISTRADOR
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
echo 📋 Eliminando reglas de firewall de Vincula...

netsh advfirewall firewall delete rule name="Vincula Frontend"
netsh advfirewall firewall delete rule name="Vincula API Gateway"
netsh advfirewall firewall delete rule name="Vincula User Service"
netsh advfirewall firewall delete rule name="Vincula Call Service"
netsh advfirewall firewall delete rule name="Vincula Queue Service"
netsh advfirewall firewall delete rule name="Vincula LiveKit HTTP"
netsh advfirewall firewall delete rule name="Vincula LiveKit TCP"
netsh advfirewall firewall delete rule name="Vincula LiveKit UDP"

echo.
echo ✅ Reglas de firewall de Vincula eliminadas
echo.
pause

