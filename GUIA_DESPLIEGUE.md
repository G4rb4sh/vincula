# Guía Rápida de Despliegue - Vincula

## Resumen
Esta es una aplicación de videollamadas con grabación automática para atención médica. El frontend estará en https://grupovincula.com/ (Hostinger) y el backend en el VPS 72.60.48.118.

## Arquitectura de Despliegue

- **Frontend**: Hostinger (grupovincula.com) - Archivos estáticos
- **Backend**: VPS Ubuntu (72.60.48.118) - Servicios Docker

---

## PARTE 1: Desplegar Backend en VPS (Ubuntu)

### 1. Clonar el repositorio en el VPS
```bash
git clone <tu-repositorio>
cd vincula
```

### 2. Ejecutar setup del backend (solo la primera vez)
```bash
chmod +x setup-backend.sh start-backend.sh cleanup.sh
./setup-backend.sh
```

Esto instalará Docker, creará el archivo `.env` con configuración de producción y configurará el firewall.

### 3. Iniciar los servicios del backend
```bash
./start-backend.sh
```

Los servicios del backend se construirán y se iniciarán automáticamente.

### 4. Verificar que los servicios funcionen
```bash
# Ver logs
docker-compose -f docker-compose.yaml -f docker-compose.prod.yml logs -f

# Verificar servicios
docker-compose -f docker-compose.yaml -f docker-compose.prod.yml ps
```

---

## PARTE 2: Desplegar Frontend en Hostinger

### 1. Construir el frontend (en tu máquina local o donde tengas Node.js)
```bash
chmod +x build-frontend.sh
./build-frontend.sh
```

Esto creará los archivos optimizados para producción en `frontend/build/`.

### 2. Crear un ZIP para subir fácilmente (opcional)
```bash
cd frontend/build
zip -r ../../vincula-frontend.zip .
cd ../..
```

### 3. Subir archivos a Hostinger

Opción A - Usando el File Manager de Hostinger:
1. Accede al panel de Hostinger
2. Ve a File Manager
3. Navega a `public_html`
4. Sube el contenido de `frontend/build/` (no la carpeta, sino su contenido)
5. Asegúrate de subir también el archivo `.htaccess`

Opción B - Usando FTP:
1. Conecta vía FTP a tu cuenta de Hostinger
2. Sube el contenido de `frontend/build/` a `public_html`
3. Verifica que `.htaccess` esté presente

### 4. Verificar configuración

El archivo `.htaccess` ya está configurado para:
- Routing de React (SPA)
- Proxy de peticiones API al VPS backend

## Puertos necesarios

Asegúrate de que estos puertos estén abiertos en el firewall del VPS:

- **8080** - API Gateway
- **7880** - LiveKit WebSocket
- **7881** - LiveKit TCP
- **7882** - LiveKit UDP

## Componentes esenciales

### Backend (VPS)
- `api-gateway` - Gateway principal
- `user-service` - Gestión de usuarios
- `call-service` - Gestión de videollamadas
- `queue-service` - Gestión de colas
- LiveKit - Servidor de videollamadas y grabación
- PostgreSQL - Base de datos
- Redis - Cache

### Frontend (Hostinger)
- Aplicación React (SPA)
- `.htaccess` para routing y proxy

## Grabación de videollamadas

Las videollamadas se graban automáticamente al iniciarse. Configuración en `.env`:

```bash
USE_S3_STORAGE=false          # false = local, true = S3
RECORDINGS_DIR=/var/recordings # Directorio local
```

Las grabaciones se guardan en formato MP4 (H.264 + AAC) a 720p.

## Comandos útiles

```bash
# Ver logs en tiempo real
docker-compose -f docker-compose.yaml -f docker-compose.prod.yml logs -f

# Reiniciar un servicio
docker-compose -f docker-compose.yaml -f docker-compose.prod.yml restart call-service

# Detener todo
./cleanup.sh

# Iniciar de nuevo
./start-backend.sh
```

## Scripts Disponibles

### Frontend (local o donde tengas Node.js)
- `build-frontend.sh` - Construir archivos para Hostinger

### Backend (en el VPS)
- `setup-backend.sh` - Configuración inicial del VPS (solo primera vez)
- `start-backend.sh` - Iniciar servicios del backend
- `cleanup.sh` - Detener/limpiar servicios del backend

---

## Solución de problemas

### Error de conexión al backend desde el frontend
- Verifica que el firewall permita los puertos 8080, 7880, 7881, 7882
- Verifica que el archivo `.htaccess` esté en `public_html`
- Verifica que los servicios estén corriendo: `docker-compose ps`

### Las videollamadas no funcionan
- Verifica que LiveKit esté corriendo: `docker-compose logs livekit`
- Verifica que el puerto UDP 7882 esté abierto
- Verifica la configuración STUN en `docker-compose.prod.yml`

### No se graban las llamadas
- Verifica que el directorio `/var/recordings` exista y tenga permisos
- Verifica los logs: `docker-compose logs call-service`
- Verifica la configuración de `USE_S3_STORAGE` en `.env`


