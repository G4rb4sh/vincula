# Guía Rápida de Despliegue - Vincula

## 1 Minuto: Lo Que Necesitas Saber

- **Frontend**: Se construye localmente y se sube a Hostinger
- **Backend**: Se ejecuta en VPS Ubuntu con Docker

## Scripts Nuevos

```
build-frontend.sh    ← Construir frontend (local)
setup-backend.sh     ← Configurar VPS (1ra vez)
start-backend.sh     ← Iniciar backend (VPS)
cleanup.sh           ← Limpiar backend (VPS)
```

## Despliegue Paso a Paso

### FRONTEND (en tu máquina)

```bash
# 1. Construir
./build-frontend.sh

# 2. Subir a Hostinger
# - Ve a File Manager en Hostinger
# - Navega a public_html
# - Sube todo el contenido de frontend/build/
# - Asegúrate de subir .htaccess también
```

### BACKEND (en el VPS)

```bash
# 1. Conectarse al VPS
ssh usuario@72.60.48.118

# 2. Clonar repositorio (primera vez)
git clone <repositorio>
cd vincula

# 3. Setup (solo primera vez)
chmod +x setup-backend.sh start-backend.sh cleanup.sh
./setup-backend.sh

# 4. Iniciar servicios
./start-backend.sh

# 5. Verificar
docker-compose ps
```

## Actualizaciones Futuras

### Actualizar Frontend
```bash
git pull
./build-frontend.sh
# Sube a Hostinger
```

### Actualizar Backend
```bash
ssh usuario@72.60.48.118
cd vincula
git pull
./start-backend.sh
```

## Solución Rápida de Problemas

### Frontend no se conecta al backend
```bash
# En el VPS, verificar que los servicios estén corriendo
docker-compose ps

# Verificar firewall
sudo ufw status
```

### Backend no inicia
```bash
# Ver logs
docker-compose logs -f

# Reintentar
./cleanup.sh  # Opción 1 o 2
./start-backend.sh
```

## Archivos Importantes

- `GUIA_DESPLIEGUE.md` - Guía completa y detallada
- `SCRIPTS_README.md` - Documentación de cada script
- `DEPLOYMENT_SUMMARY.md` - Resumen con diagramas
- `MIGRATION_NOTES.md` - Si migras desde scripts antiguos

## URLs Importantes

- Frontend: https://grupovincula.com
- Backend API: http://72.60.48.118:8080
- LiveKit WS: ws://72.60.48.118:7880

## Puertos del VPS

- 8080 - API Gateway
- 7880 - LiveKit WebSocket
- 7881 - LiveKit TCP
- 7882 - LiveKit UDP (importante para video)

## Comandos Útiles

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f call-service

# Reiniciar un servicio
docker-compose restart call-service

# Ver estado de servicios
docker-compose ps

# Detener todo
./cleanup.sh
```

## Necesitas Ayuda?

Consulta la documentación completa en `GUIA_DESPLIEGUE.md`

