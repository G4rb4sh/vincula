# 🚀 Guía de Comandos - Vincula

Esta guía te explica cómo ejecutar la aplicación Vincula de videollamadas médicas.

## 📋 Requisitos Previos

Antes de ejecutar la aplicación, asegúrate de tener instalado:

- **Docker Desktop** (con Docker Compose)
- **Node.js 18+** 
- **npm**
- **Git**

## 🎯 Opciones de Ejecución

### 1. Primera Vez / Configuración Completa

```bash
./run-app.sh
```

**¿Cuándo usarlo?**
- Primera vez que ejecutas la aplicación
- Después de cambios importantes en el código
- Cuando quieres una configuración completa desde cero

**¿Qué hace?**
- ✅ Verifica requisitos del sistema
- ✅ Crea archivo `.env` con variables de entorno
- ✅ Configura base de datos y migraciones
- ✅ Instala dependencias del frontend
- ✅ Inicia todos los servicios
- ✅ Abre nueva terminal para React
- ✅ Monitorea el estado de los servicios

### 2. Inicio Rápido (Uso Diario)

```bash
./start.sh
```

**¿Cuándo usarlo?**
- Para desarrollo diario
- Cuando ya tienes todo configurado
- Inicio rápido sin verificaciones extensas

**¿Qué hace?**
- ✅ Inicia servicios Docker
- ✅ Inicia frontend React
- ✅ Configuración mínima y rápida

### 3. Detener Todo

```bash
./stop.sh
```

**¿Cuándo usarlo?**
- Al finalizar el trabajo
- Antes de apagar la computadora
- Para liberar recursos del sistema

**¿Qué hace?**
- ✅ Detiene contenedores Docker
- ✅ Mata procesos Node.js
- ✅ Libera puertos ocupados

## 📚 Referencia Rápida

### Comandos Principales
```bash
# Primera ejecución o configuración completa
./run-app.sh

# Inicio rápido para desarrollo
./start.sh  

# Detener todos los servicios
./stop.sh
```

### URLs de la Aplicación
- **Frontend React**: http://localhost:3000
- **API Gateway**: http://localhost:8080  
- **Livekit (videollamadas)**: http://localhost:7880
- **Base de datos**: localhost:5432

### Usuarios de Prueba
```
Empleado: employee@test.com / password123
Paciente: patient@test.com  / password123
Familiar: family@test.com   / password123
Admin:    admin@test.com    / password123
```

## 🔧 Comandos de Desarrollo

Para comandos avanzados y troubleshooting, revisa:
- **`comandos-rapidos.md`** - Comandos detallados para desarrollo
- **`.env`** - Variables de entorno (se crea automáticamente)

### Comandos Docker Útiles
```bash
# Ver estado de servicios
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f user-service

# Reiniciar servicios
docker-compose restart

# Reconstruir servicios
docker-compose up -d --build
```

### Comandos Frontend
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
```

## 🚨 Troubleshooting

### Puerto Ocupado
```bash
# Ver qué proceso usa el puerto
lsof -i :3000
lsof -i :8080

# Matar proceso específico
kill -9 <PID>

# O usar el script de detener
./stop.sh
```

### Problemas con Docker
```bash
# Limpiar todo (¡CUIDADO! Elimina datos)
docker-compose down -v
docker system prune -a

# Reconstruir desde cero
./run-app.sh
```

### Frontend no Carga
```bash
cd frontend

# Limpiar caché y reinstalar
rm -rf node_modules package-lock.json
npm install
npm start
```

### Base de Datos
```bash
# Conectar a la base de datos
docker-compose exec postgres psql -U vincula_user -d vincula

# Ver tablas
\dt

# Salir
\q
```

## 📁 Estructura de Archivos

```
Vincula/
├── run-app.sh              # Script completo de configuración
├── start.sh                # Script de inicio rápido  
├── stop.sh                 # Script para detener servicios
├── comandos-rapidos.md     # Comandos detallados
├── .env                    # Variables de entorno (se crea automáticamente)
├── docker-compose.yaml     # Configuración Docker
├── frontend/               # Aplicación React
├── backend/                # Microservicios Go
└── database/               # Migraciones SQL
```

## 💡 Tips

1. **Primera vez**: Usa `./run-app.sh`
2. **Desarrollo diario**: Usa `./start.sh`
3. **Al terminar**: Usa `./stop.sh`
4. **Problemas**: Revisa `comandos-rapidos.md`
5. **Logs**: Usa `docker-compose logs -f`

## 🆘 Ayuda

Si tienes problemas:
1. Revisa los logs: `docker-compose logs -f`
2. Verifica puertos: `lsof -i :3000` y `lsof -i :8080`
3. Reinicia servicios: `./stop.sh` luego `./start.sh`
4. Configuración completa: `./run-app.sh`

---

**¡Happy Coding! 🎉** 