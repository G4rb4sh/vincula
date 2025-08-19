# 🚀 Vincula - Configuración para Windows con Acceso de Red

Este documento explica cómo ejecutar Vincula en Windows para que sea accesible desde otras computadoras en la misma red.

## 📋 Requisitos Previos

1. **Docker Desktop para Windows** instalado y corriendo
2. **Permisos de Administrador** (para configurar el firewall)
3. **Conexión a red local** (Wi-Fi o Ethernet)

## 🎯 Inicio Rápido

### 1. Configurar el Firewall (Solo una vez)

```batch
# Ejecutar como Administrador
configure-firewall.bat
```

> ⚠️ **IMPORTANTE**: Haz clic derecho sobre el archivo y selecciona "Ejecutar como administrador"

### 2. Iniciar la Aplicación

```batch
# Ejecutar normalmente
start-windows.bat
```

### 3. Acceso desde Otras PCs

Una vez iniciado, el script mostrará las URLs para acceder desde otras computadoras:

```
🌐 URLs para OTRAS PCs en la red:
   • Frontend:    http://192.168.1.100:3000
   • API Gateway: http://192.168.1.100:8080
   • LiveKit:     ws://192.168.1.100:7880
```

## 📝 Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `start-windows.bat` | Script principal para iniciar en Windows |
| `configure-firewall.bat` | Configura automáticamente el firewall |
| `remove-firewall-rules.bat` | Elimina las reglas del firewall |
| `docker-compose.override.yml` | Configuración específica para acceso de red |

## 🔧 Configuración Detallada

### Variables de Entorno

El script `start-windows.bat` detecta automáticamente la IP del host y configura:

- `LIVEKIT_RTC_NODE_IP`: IP del host para conexiones externas
- `REACT_APP_API_URL`: URL del API Gateway para el frontend
- `REACT_APP_LIVEKIT_URL`: URL de LiveKit para videollamadas

### Puertos Configurados

| Puerto | Servicio | Protocolo |
|--------|----------|-----------|
| 3000 | Frontend | TCP |
| 8080 | API Gateway | TCP |
| 8081 | User Service | TCP |
| 8082 | Call Service | TCP |
| 8083 | Queue Service | TCP |
| 7880 | LiveKit HTTP | TCP |
| 7881 | LiveKit TCP | TCP |
| 7882 | LiveKit UDP | UDP |

## 👥 Usuarios de Prueba

| Email | Contraseña | Rol |
|-------|------------|-----|
| `patient@vincula.com` | `123456` | Paciente |
| `doctor@vincula.com` | `123456` | Doctor |
| `family@vincula.com` | `123456` | Familiar |
| `admin@vincula.com` | `123456` | Administrador |

## 🔍 Resolución de Problemas

### La aplicación no es accesible desde otras PCs

1. **Verificar el firewall**:
   ```batch
   netsh advfirewall firewall show rule name=all | findstr "Vincula"
   ```

2. **Verificar que Docker está corriendo**:
   ```batch
   docker ps
   ```

3. **Verificar la IP detectada**:
   ```batch
   ipconfig
   ```

### Error "Docker no está corriendo"

1. Abrir Docker Desktop
2. Esperar a que esté completamente iniciado
3. Ejecutar nuevamente `start-windows.bat`

### Problemas de conectividad de video

1. Verificar que el puerto UDP 7882 esté abierto
2. Revisar la configuración del router si hay problemas con NAT
3. Verificar que no haya otros servicios usando los puertos de LiveKit

## 🛠️ Comandos Útiles

### Ver logs de los servicios
```batch
docker compose logs -f
```

### Ver logs de un servicio específico
```batch
docker compose logs -f frontend
docker compose logs -f api-gateway
docker compose logs -f livekit
```

### Detener todos los servicios
```batch
docker compose down
```

### Reiniciar los servicios
```batch
docker compose down && start-windows.bat
```

### Eliminar reglas del firewall
```batch
# Ejecutar como Administrador
remove-firewall-rules.bat
```

## 📊 Monitoreo

### Estado de los contenedores
```batch
docker compose ps
```

### Uso de recursos
```batch
docker stats
```

### Verificar conectividad de red
Desde otra PC en la red:
```batch
# Verificar conectividad básica
ping [IP_DEL_HOST]

# Verificar puerto específico (requiere telnet)
telnet [IP_DEL_HOST] 3000
```

## 🔒 Consideraciones de Seguridad

- **Solo redes locales**: Esta configuración está diseñada para redes locales confiables
- **Firewall**: Solo abre los puertos necesarios para Vincula
- **Contraseñas**: Cambia las contraseñas de prueba en un entorno de producción
- **HTTPS**: Para acceso externo desde Internet, considera implementar HTTPS y certificados SSL

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs con `docker compose logs -f`
2. Verifica que todos los puertos estén abiertos en el firewall
3. Confirma que la IP detectada sea correcta
4. Asegúrate de que Docker Desktop esté funcionando correctamente

---

**¡Listo!** Ahora puedes acceder a Vincula desde cualquier PC en tu red local.

