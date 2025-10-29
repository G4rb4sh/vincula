# Resumen de Configuración - Vincula

## Configuración completa para Hostinger

### Frontend (grupovincula.com)
El frontend está configurado en `frontend/.htaccess` para hacer proxy al backend:

```apache
# API requests → VPS
RewriteRule ^api/(.*)$ http://72.60.48.118:8080/api/$1 [P,L]

# WebSocket → VPS
RewriteRule ^ws(.*)$ ws://72.60.48.118:8080/ws$1 [P,L]
```

**CORS habilitado** con `Access-Control-Allow-Origin: *`

### Backend (72.60.48.118 / srv965471.hstgr.cloud)

#### CORS configurado en API Gateway
Acepta peticiones desde:
- ✅ `https://grupovincula.com`
- ✅ `http://grupovincula.com`
- ✅ `https://www.grupovincula.com`
- ✅ `http://www.grupovincula.com`
- ✅ `http://72.60.48.118` (IP directa)
- ✅ `http://srv965471.hstgr.cloud` (hostname)
- ✅ `localhost` (desarrollo)

Ver archivo: `backend/api-gateway/main.go` líneas 20-37

#### LiveKit (Videollamadas)
Configurado en `docker-compose.prod.yml`:
```yaml
LIVEKIT_RTC_NODE_IP=72.60.48.118
LIVEKIT_RTC_USE_EXTERNAL_IP=true
```

Esto permite que las videollamadas funcionen correctamente con NAT/firewall.

### Puertos necesarios

Asegúrate de que estos puertos estén **abiertos en el firewall** del VPS:

| Puerto | Protocolo | Servicio | Descripción |
|--------|-----------|----------|-------------|
| 8080 | TCP | API Gateway | HTTP/WebSocket |
| 7880 | TCP | LiveKit | WebSocket |
| 7881 | TCP | LiveKit | TCP fallback |
| 7882 | UDP | LiveKit | Media (RTP/SRTP) |

### Variables de entorno (.env)

Las URLs críticas en el archivo `.env`:

```bash
# URLs del backend para el frontend
REACT_APP_API_URL=http://72.60.48.118:8080
REACT_APP_WS_URL=ws://72.60.48.118:8080
REACT_APP_LIVEKIT_URL=ws://72.60.48.118:7880
```

**O usando el hostname:**
```bash
REACT_APP_API_URL=http://srv965471.hstgr.cloud:8080
REACT_APP_WS_URL=ws://srv965471.hstgr.cloud:8080
REACT_APP_LIVEKIT_URL=ws://srv965471.hstgr.cloud:7880
```

Ambas opciones funcionan. El script `setup.sh` usa la IP por defecto.

## Flujo de peticiones

### Petición API desde el navegador
```
Browser (grupovincula.com)
  → Frontend (.htaccess rewrite)
    → http://72.60.48.118:8080/api/...
      → Docker: api-gateway:8080
        → CORS check ✅
          → Proxy → user-service:8080
```

### Videollamada
```
Browser (grupovincula.com)
  → LiveKit client
    → ws://72.60.48.118:7880
      → Docker: livekit:7880
        → RTC connection via UDP 7882
```

### WebSocket (notificaciones en tiempo real)
```
Browser (grupovincula.com)
  → WebSocket connection
    → ws://72.60.48.118:8080/ws
      → Docker: api-gateway:8080
        → Proxy → user-service:8080/ws
          → WebSocket Manager
```

## Grabación automática

Las videollamadas se graban automáticamente al iniciarse.

**Código:** `backend/call-service/internal/livekit/manager.go` líneas 59-70

**Configuración en .env:**
```bash
USE_S3_STORAGE=false          # Local storage
RECORDINGS_DIR=/var/recordings
```

**Formato de grabación:**
- Codec de video: H.264 (Main profile)
- Codec de audio: AAC
- Resolución: 1280x720 @ 30fps
- Bitrate video: 1500 kbps
- Bitrate audio: 128 kbps
- Formato de salida: MP4

**Ubicación de archivos:**
```
/var/recordings/
  └── call_<call_id>/
      └── <timestamp>.mp4
```

## Verificación después del despliegue

### 1. Verificar servicios
```bash
docker-compose -f docker-compose.yaml -f docker-compose.prod.yml ps
```

Todos deberían estar "Up".

### 2. Verificar CORS
```bash
curl -H "Origin: https://grupovincula.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     http://72.60.48.118:8080/api/auth/login -v
```

Debería retornar headers de CORS.

### 3. Verificar LiveKit
```bash
curl http://72.60.48.118:7880/
```

Debería retornar información de LiveKit.

### 4. Verificar grabaciones
```bash
ls -la /var/recordings/
```

Después de una llamada, deberías ver carpetas con grabaciones.

## Solución de problemas comunes

### Error: "CORS policy has blocked"
- Verifica que el dominio esté en la lista de CORS en `backend/api-gateway/main.go`
- Reinicia el servicio: `docker-compose restart api-gateway`

### Error: "Failed to connect to LiveKit"
- Verifica que el puerto 7880 TCP esté abierto
- Verifica que el puerto 7882 UDP esté abierto
- Revisa logs: `docker-compose logs livekit`

### Error: "No se graba la videollamada"
- Verifica que `/var/recordings` exista y tenga permisos
- Revisa logs: `docker-compose logs call-service`
- Verifica la variable `USE_S3_STORAGE=false` en `.env`

### Frontend no conecta con backend
- Verifica que el `.htaccess` esté en `public_html`
- Verifica que el módulo `mod_proxy` esté habilitado en Apache
- Revisa logs de Apache en Hostinger

## Resumen

**Todo está configurado correctamente para:**
1. ✅ Frontend en `grupovincula.com`
2. ✅ Backend en `72.60.48.118` (o `srv965471.hstgr.cloud`)
3. ✅ CORS configurado para aceptar ambas direcciones
4. ✅ LiveKit con IP externa para videollamadas
5. ✅ Grabación automática de videollamadas
6. ✅ WebSocket para notificaciones en tiempo real

**Solo necesitas:**
1. Ejecutar `./setup.sh` en el VPS
2. Ejecutar `./start.sh` para iniciar
3. Subir el frontend buildado a Hostinger con el `.htaccess`



