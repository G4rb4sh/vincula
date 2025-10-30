# Scripts de Despliegue - Vincula

Este documento explica la organización de los scripts de despliegue separados para frontend y backend.

## Arquitectura de Despliegue

- **Frontend**: Hostinger (https://grupovincula.com) - Archivos estáticos
- **Backend**: VPS Ubuntu (72.60.48.118) - Servicios Docker

## Scripts Frontend (ejecutar localmente)

### `build-frontend.sh`
Construye el frontend de React para producción.

**Cuándo usar**: Antes de subir archivos a Hostinger

**Dónde ejecutar**: En tu máquina local (Windows/Mac/Linux con Node.js)

**Resultado**: Crea archivos en `frontend/build/` listos para subir

```bash
chmod +x build-frontend.sh
./build-frontend.sh
```

## Scripts Backend (ejecutar en el VPS)

### `setup-backend.sh`
Configuración inicial del servidor VPS.

**Cuándo usar**: Solo la primera vez que despliegas en el VPS

**Dónde ejecutar**: En el VPS Ubuntu (72.60.48.118)

**Qué hace**:
- Instala Docker y Docker Compose
- Crea archivo `.env` con configuración de producción
- Configura firewall (puertos 8080, 7880, 7881, 7882)
- Crea directorio `/var/recordings`

```bash
chmod +x setup-backend.sh
./setup-backend.sh
```

### `start-backend.sh`
Inicia todos los servicios del backend.

**Cuándo usar**: Cada vez que quieres iniciar/reiniciar el backend

**Dónde ejecutar**: En el VPS Ubuntu

**Qué hace**:
- Construye las imágenes Docker de los servicios
- Inicia todos los contenedores
- Muestra el estado de los servicios

```bash
./start-backend.sh
```

### `cleanup.sh`
Detiene y limpia servicios del backend.

**Cuándo usar**: Para detener servicios o hacer limpieza

**Dónde ejecutar**: En el VPS Ubuntu

**Opciones**:
1. Detener servicios (mantener datos)
2. Eliminar contenedores (mantener volúmenes)
3. Limpieza completa (ELIMINA TODO)

```bash
./cleanup.sh
```

## Flujo de Trabajo Típico

### Primera vez - Setup completo

**En el VPS**:
```bash
git clone <repositorio>
cd vincula
chmod +x setup-backend.sh start-backend.sh cleanup.sh
./setup-backend.sh
./start-backend.sh
```

**En tu máquina local**:
```bash
chmod +x build-frontend.sh
./build-frontend.sh
# Luego sube el contenido de frontend/build/ a Hostinger
```

### Actualizaciones posteriores

**Actualizar Backend**:
```bash
# En el VPS
git pull
./start-backend.sh  # Esto reconstruirá y reiniciará los servicios
```

**Actualizar Frontend**:
```bash
# En tu máquina local
git pull
./build-frontend.sh
# Sube el nuevo contenido a Hostinger
```

## Migración desde scripts anteriores

Si antes usabas `setup.sh` y `start.sh`, ahora debes usar:

- `setup.sh` → `setup-backend.sh` (solo para backend en VPS)
- `start.sh` → `start-backend.sh` (solo para backend en VPS)
- Para el frontend, usa el nuevo `build-frontend.sh`

Los scripts antiguos manejaban todo junto. Los nuevos scripts están separados porque el frontend y backend se despliegan en diferentes lugares.

## Notas Importantes

1. **build-frontend.sh** requiere Node.js instalado localmente
2. **setup-backend.sh** y **start-backend.sh** solo funcionan en Linux/Ubuntu
3. El frontend se construye localmente y se sube manualmente a Hostinger
4. El backend se despliega automáticamente en el VPS con Docker
5. Asegúrate de que el archivo `.htaccess` se suba junto con el frontend a Hostinger

## Consulta la Guía Completa

Para más detalles, consulta `GUIA_DESPLIEGUE.md`

