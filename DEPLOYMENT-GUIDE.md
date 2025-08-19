# Guía de Deployment para Producción

Esta guía te ayudará a desplegar Vincula en producción con:
- **Frontend**: Hostinger (https://grupovincula.com)
- **Backend**: VPS Ubuntu 24.04 LTS (IP: 72.60.48.118)

## 📋 Prerrequisitos

### Para el Frontend (Local)
- Node.js 18+
- npm

### Para el Backend (VPS)
- VPS Ubuntu 24.04 LTS
- Acceso root/sudo al VPS
- Docker y Docker Compose (se instalan automáticamente)

## 🚀 Deployment del Frontend

### Paso 1: Build Local
En tu máquina local, ejecuta:

```bash
# En Windows
.\build-frontend-production.sh

# En Linux/Mac
./build-frontend-production.sh
```

Este script:
- Configura las variables de entorno para producción
- Hace build optimizado del frontend
- Genera la carpeta `frontend/build/`

### Paso 2: Subir a Hostinger
1. Comprimir la carpeta `frontend/build/` en un ZIP
2. Acceder al panel de Hostinger
3. Ir a File Manager
4. Subir y extraer el ZIP en `public_html/`
5. El sitio estará disponible en https://grupovincula.com

## 🖥️ Deployment del Backend

### Paso 1: Preparar el VPS
Copia los archivos al VPS:

```bash
# Conectar al VPS
ssh root@72.60.48.118

# Clonar o copiar el proyecto
git clone [tu-repositorio] /opt/vincula
cd /opt/vincula

# O si subes manualmente, copia estos archivos:
# - docker-compose.prod.yml
# - backend/ (toda la carpeta)
# - production.env.example
# - deploy-backend-production.sh
# - start-production.sh
```

### Paso 2: Configurar el Sistema
```bash
# Hacer ejecutable y ejecutar el script de configuración
chmod +x deploy-backend-production.sh
sudo ./deploy-backend-production.sh
```

Este script instala:
- Docker y Docker Compose
- Configuración de firewall
- Estructura de directorios

### Paso 3: Configurar Variables de Entorno
```bash
# Copiar archivo de ejemplo
cp production.env.example .env

# Editar con valores seguros
nano .env
```

**Variables importantes a cambiar:**
- `POSTGRES_PASSWORD`: Password seguro para la base de datos
- `JWT_SECRET`: Clave secreta para JWT (mínimo 32 caracteres)
- `LIVEKIT_SECRET_KEY`: Clave secreta para LiveKit

### Paso 4: Ejecutar en Producción
```bash
# Hacer ejecutable y ejecutar
chmod +x start-production.sh
./start-production.sh
```

## 🔍 Verificación

### Backend (VPS)
Verifica que todo funcione:

```bash
# Health check
curl http://72.60.48.118:8080/health

# Estado de contenedores
docker-compose -f docker-compose.prod.yml ps

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Frontend (Hostinger)
- Accede a https://grupovincula.com
- Verifica que se conecte al backend
- Prueba login/registro

## 🌐 URLs de Producción

- **Frontend**: https://grupovincula.com
- **API Gateway**: http://72.60.48.118:8080
- **Health Check**: http://72.60.48.118:8080/health
- **LiveKit**: ws://72.60.48.118:7880

## 🛠️ Comandos Útiles

### En el VPS
```bash
# Ver logs en tiempo real
docker-compose -f docker-compose.prod.yml logs -f

# Reiniciar servicios
docker-compose -f docker-compose.prod.yml restart

# Detener todo
docker-compose -f docker-compose.prod.yml down

# Actualizar y reconstruir
docker-compose -f docker-compose.prod.yml up --build -d

# Ver uso de recursos
docker stats

# Acceder a la base de datos
docker-compose -f docker-compose.prod.yml exec postgres psql -U vincula_user -d vincula
```

## 🔧 Troubleshooting

### Frontend no se conecta al backend
1. Verificar que el backend esté ejecutándose: `curl http://72.60.48.118:8080/health`
2. Verificar CORS en `backend/api-gateway/main.go`
3. Verificar firewall en el VPS: `sudo ufw status`

### Problemas con LiveKit
1. Verificar puertos UDP: `sudo ufw allow 7882/udp`
2. Verificar configuración de IP externa en docker-compose.prod.yml
3. Comprobar logs: `docker-compose -f docker-compose.prod.yml logs livekit`

### Base de datos no funciona
1. Verificar que PostgreSQL esté ejecutándose: `docker-compose -f docker-compose.prod.yml ps`
2. Verificar logs: `docker-compose -f docker-compose.prod.yml logs postgres`
3. Verificar variables de entorno en `.env`

## 🔐 Seguridad

### Variables Sensibles
Asegúrate de usar valores seguros para:
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `LIVEKIT_SECRET_KEY`

### Firewall
El script configura automáticamente ufw con los puertos necesarios.

### SSL/HTTPS
Para el backend con HTTPS:
1. Obtener certificados SSL (Let's Encrypt)
2. Configurar nginx como reverse proxy
3. Actualizar URLs del frontend

## 📞 Soporte

Si tienes problemas:
1. Revisar logs de Docker
2. Verificar conectividad de red
3. Comprobar variables de entorno
4. Verificar estado de servicios
