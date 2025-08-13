# 🚀 Vincula - Comandos Rápidos

## Ejecutar la Aplicación Completa

```bash
# Ejecutar todo automáticamente
./run-app.sh
```

## Comandos de Desarrollo

### Inicio Rápido
```bash
# Solo backend
docker-compose up -d

# Solo frontend  
cd frontend && npm start

# Ver estado
docker-compose ps
```

### Base de Datos
```bash
# Conectar a PostgreSQL
docker-compose exec postgres psql -U vincula_user -d vincula

# Ejecutar migración específica
docker-compose exec postgres psql -U vincula_user -d vincula -f /docker-entrypoint-initdb.d/migrations/001_create_users_table.sql

# Ver tablas
docker-compose exec postgres psql -U vincula_user -d vincula -c "\dt"

# Backup de base de datos
docker-compose exec postgres pg_dump -U vincula_user vincula > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U vincula_user -d vincula < backup.sql
```

### Docker
```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f user-service
docker-compose logs -f postgres
docker-compose logs -f livekit

# Reiniciar servicios
docker-compose restart
docker-compose restart user-service

# Detener todo
docker-compose down

# Limpiar todo (¡CUIDADO!)
docker-compose down -v
docker system prune -a
```

### Frontend
```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar desarrollo
npm start

# Build para producción
npm run build

# Ejecutar tests
npm test

# Linter
npm run lint

# Ver dependencias desactualizadas
npm outdated
```

### Logs y Debugging
```bash
# Ver logs en tiempo real
docker-compose logs -f --tail=100

# Ver recursos del sistema
docker stats

# Ver espacios en disco
docker system df

# Inspeccionar red
docker network ls
docker network inspect vincula_default

# Ver variables de entorno
docker-compose exec user-service env
```

## URLs Importantes

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Livekit UI**: http://localhost:7880
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Usuarios de Prueba

```
Empleado:  employee@test.com / password123
Paciente:  patient@test.com  / password123  
Familiar:  family@test.com   / password123
Admin:     admin@test.com    / password123
```

## Troubleshooting

### Puerto ocupado
```bash
# Ver qué proceso usa el puerto
lsof -i :3000
lsof -i :8080

# Matar proceso
kill -9 <PID>
```

### Problemas con Docker
```bash
# Reiniciar Docker Desktop
# Limpiar caché
docker system prune -a

# Reconstruir imágenes
docker-compose build --no-cache
```

### Problemas con Node.js
```bash
cd frontend

# Limpiar caché npm
npm cache clean --force

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Base de datos corrupta
```bash
# Resetear base de datos
docker-compose down -v
docker-compose up -d
# Ejecutar migraciones nuevamente
```

## Variables de Entorno Importantes

```bash
# Archivo .env (se crea automáticamente)
POSTGRES_DB=vincula
POSTGRES_USER=vincula_user
POSTGRES_PASSWORD=vincula_password
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
REACT_APP_API_URL=http://localhost:8080
REACT_APP_LIVEKIT_URL=ws://localhost:7880
```

## Desarrollo Backend (Go)

```bash
# Si necesitas desarrollar servicios en Go
cd backend/user-service

# Ejecutar localmente (requiere Go instalado)
go mod tidy
go run main.go

# Construir binario
go build -o user-service

# Tests
go test ./...
```

## Comandos de Producción

```bash
# Build para producción
docker-compose -f docker-compose.prod.yml up -d --build

# Ver logs de producción
docker-compose -f docker-compose.prod.yml logs -f

# Actualizar sin downtime
docker-compose -f docker-compose.prod.yml up -d --no-deps --build user-service
```

## Backups y Mantenimiento

```bash
# Backup automático diario
0 2 * * * docker-compose exec postgres pg_dump -U vincula_user vincula > /backups/vincula_$(date +\%Y\%m\%d).sql

# Limpiar logs viejos
docker system prune -f

# Actualizar imágenes
docker-compose pull
docker-compose up -d
```

---

**💡 Tip**: Guarda este archivo como referencia rápida para desarrollo diario. 