# Vincula

Sistema de videollamadas para atención médica con grabación automática.

## Características

- Videollamadas en tiempo real usando LiveKit
- Grabación automática de todas las llamadas
- Gestión de usuarios (pacientes, empleados, familiares)
- Notificaciones en tiempo real
- Arquitectura de microservicios

## Tecnologías

- **Backend**: Go (microservicios)
- **Frontend**: React
- **Base de datos**: PostgreSQL
- **Cache**: Redis
- **Videollamadas**: LiveKit
- **Contenedores**: Docker

## Despliegue en Hostinger

### Información del servidor

- **Frontend**: https://grupovincula.com/
- **Backend IP**: 72.60.48.118
- **Backend Host**: srv965471.hstgr.cloud

### Configuración de CORS

La aplicación está configurada para aceptar peticiones desde:
- `https://grupovincula.com` y `http://grupovincula.com` (con y sin www)
- `http://72.60.48.118` (IP directa del VPS)
- `http://srv965471.hstgr.cloud` (hostname del VPS)
- `localhost` (para desarrollo local)

### Instalación en Ubuntu (3 pasos)

#### 1. Setup (primera vez solamente)

```bash
./setup.sh
```

Este script:
- Instala Docker y Docker Compose si no están instalados
- Crea el archivo `.env` con configuración de producción
- Configura el firewall
- Crea el directorio para grabaciones

#### 2. Iniciar la aplicación

```bash
./start.sh
```

Este script:
- Construye las imágenes Docker
- Inicia todos los servicios
- Muestra el estado de los contenedores

#### 3. Detener/Limpiar

```bash
./cleanup.sh
```

Opciones disponibles:
1. **Detener servicios**: Solo detiene, mantiene todos los datos
2. **Eliminar contenedores**: Elimina contenedores pero mantiene volúmenes
3. **Limpieza completa**: Elimina TODO (base de datos, grabaciones, etc.)

## Servicios

Una vez iniciado, los siguientes servicios estarán disponibles:

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| API Gateway | 8080 | Gateway principal de la API |
| User Service | 8081 | Gestión de usuarios y autenticación |
| Call Service | 8082 | Gestión de llamadas |
| Queue Service | 8083 | Gestión de colas |
| LiveKit | 7880 | Servidor de videollamadas |
| PostgreSQL | 5432 | Base de datos |
| Redis | 6379 | Cache y mensajería |

## Puertos requeridos en el firewall

Asegúrate de que estos puertos estén abiertos:

- **8080/tcp** - API Gateway
- **7880/tcp** - LiveKit WebSocket
- **7881/tcp** - LiveKit TCP fallback
- **7882/udp** - LiveKit UDP media

## Grabación de videollamadas

Las videollamadas se graban automáticamente:

- **Formato**: MP4 (H.264 + AAC)
- **Resolución**: 1280x720 @ 30fps
- **Almacenamiento**: Local en `/var/recordings/` o S3 (configurable)

### Configurar almacenamiento S3

Edita el archivo `.env`:

```bash
USE_S3_STORAGE=true
AWS_ACCESS_KEY=tu_access_key
AWS_SECRET_KEY=tu_secret_key
AWS_REGION=us-west-2
AWS_BUCKET=tu-bucket
```

## Estructura del proyecto

```
vincula/
├── backend/              # Microservicios en Go
│   ├── api-gateway/     # Gateway principal
│   ├── user-service/    # Gestión de usuarios
│   ├── call-service/    # Gestión de llamadas
│   └── queue-service/   # Gestión de colas
├── frontend/            # Aplicación React
├── database/            # Migraciones SQL
│   └── migrations/
├── deployment/          # Configuración de despliegue
├── setup.sh            # Script de instalación
├── start.sh            # Script de inicio
├── cleanup.sh          # Script de limpieza
├── docker-compose.yaml # Configuración Docker base
└── docker-compose.prod.yml # Configuración producción
```

## Comandos útiles

### Ver logs en tiempo real

```bash
docker-compose -f docker-compose.yaml -f docker-compose.prod.yml logs -f
```

### Ver logs de un servicio específico

```bash
docker-compose -f docker-compose.yaml -f docker-compose.prod.yml logs -f call-service
```

### Reiniciar un servicio

```bash
docker-compose -f docker-compose.yaml -f docker-compose.prod.yml restart call-service
```

### Ver estado de los servicios

```bash
docker-compose -f docker-compose.yaml -f docker-compose.prod.yml ps
```

### Ejecutar migraciones manualmente

```bash
docker-compose -f docker-compose.yaml -f docker-compose.prod.yml exec postgres psql -U vincula_user -d vincula
```

## Solución de problemas

### Los servicios no inician

```bash
# Ver logs de todos los servicios
docker-compose -f docker-compose.yaml -f docker-compose.prod.yml logs

# Verificar que los puertos no estén ocupados
sudo netstat -tlnp | grep -E '(8080|7880)'
```

### Error de conexión a la base de datos

```bash
# Verificar que PostgreSQL esté ejecutándose
docker-compose -f docker-compose.yaml -f docker-compose.prod.yml ps postgres

# Ver logs de PostgreSQL
docker-compose -f docker-compose.yaml -f docker-compose.prod.yml logs postgres
```

### Problemas con videollamadas

```bash
# Verificar que LiveKit esté ejecutándose
docker-compose -f docker-compose.yaml -f docker-compose.prod.yml logs livekit

# Verificar puertos UDP/TCP
sudo ufw status
```

## Desarrollo local

Si quieres ejecutar en modo desarrollo (con hot-reload):

```bash
docker-compose -f docker-compose.yaml up
```

## Licencia

Copyright © 2025 Grupo Vincula

