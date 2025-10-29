# Guía Rápida de Despliegue - Vincula

## Resumen
Esta es una aplicación de videollamadas con grabación automática para atención médica. El frontend estará en https://grupovincula.com/ (Hostinger) y el backend en el VPS 72.60.48.118.

## Pasos para desplegar en Ubuntu

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd vincula
```

### 2. Ejecutar setup (solo la primera vez)
```bash
chmod +x setup.sh start.sh cleanup.sh
./setup.sh
```

Esto instalará Docker, creará el archivo `.env` con configuración de producción y configurará el firewall.

### 3. Iniciar la aplicación
```bash
./start.sh
```

La aplicación se construirá y se iniciará automáticamente.

### 4. Verificar que todo funcione
```bash
# Ver logs
docker-compose -f docker-compose.yaml -f docker-compose.prod.yml logs -f

# Verificar servicios
docker-compose -f docker-compose.yaml -f docker-compose.prod.yml ps
```

## Frontend en Hostinger

1. Construir el frontend localmente:
```bash
cd frontend
npm install
npm run build
```

2. Subir el contenido de `frontend/build/` a `public_html` en Hostinger

3. Subir el archivo `frontend/.htaccess` al mismo directorio

El `.htaccess` ya está configurado para hacer proxy de las peticiones API al VPS.

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
./start.sh
```

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


