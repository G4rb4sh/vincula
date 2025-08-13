# Variables de Entorno - Vincula Healthcare App

Este documento describe todas las variables de entorno necesarias para ejecutar la aplicación de videollamadas médicas.

## 🗄️ Base de Datos

```bash
# PostgreSQL
POSTGRES_PASSWORD=tu_password_seguro
DATABASE_URL=postgres://healthcare_user:tu_password_seguro@localhost:5432/healthcare_db

# Redis para cola y cache
REDIS_URL=redis://localhost:6379
```

## 🔐 Autenticación y Seguridad

```bash
# JWT para autenticación
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui

# Configuración de sesiones
SESSION_SECRET=tu_session_secret_muy_seguro

# Configuración de webhooks
WEBHOOK_SECRET=tu_webhook_secret
```

## 📹 Livekit (Videollamadas)

```bash
# Livekit para videollamadas
LIVEKIT_API_KEY=tu_livekit_api_key
LIVEKIT_SECRET_KEY=tu_livekit_secret_key
LIVEKIT_SERVER_URL=ws://localhost:7880
```

## ☁️ AWS S3 (Grabaciones)

```bash
# AWS S3 para almacenar grabaciones
AWS_ACCESS_KEY=tu_aws_access_key
AWS_SECRET_KEY=tu_aws_secret_key
AWS_REGION=us-west-2
AWS_BUCKET=healthcare-call-recordings
```

## 🌐 Conectividad

```bash
# TURN server para conectividad NAT/Firewall
TURN_DOMAIN=turn.tu-dominio.com
TURN_USERNAME=tu_turn_username
TURN_PASSWORD=tu_turn_password
```

## 🖥️ Frontend

```bash
# URLs del frontend React
REACT_APP_API_URL=http://localhost:8080
REACT_APP_WS_URL=ws://localhost:8080
REACT_APP_LIVEKIT_URL=ws://localhost:7880
```

## ⚙️ Configuración del Servidor

```bash
# Configuración general
NODE_ENV=development
PORT=8080

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📧 Notificaciones por Email

```bash
# SMTP para notificaciones
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=tu_password_email
```

## 📊 Logs y Monitoreo

```bash
# Configuración de logs
LOG_LEVEL=info
```

## 💾 Backup

```bash
# Configuración de backup automático
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
```

## 🚀 Ejemplo de archivo .env

Crea un archivo `.env` en la raíz del proyecto con estas variables:

```bash
# Base de datos
POSTGRES_PASSWORD=healthcare2024!
DATABASE_URL=postgres://healthcare_user:healthcare2024!@localhost:5432/healthcare_db
REDIS_URL=redis://localhost:6379

# Seguridad
JWT_SECRET=tu_jwt_secret_super_seguro_aqui_2024
SESSION_SECRET=tu_session_secret_super_seguro_2024
WEBHOOK_SECRET=webhook_secret_2024

# Livekit
LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxx
LIVEKIT_SECRET_KEY=SECRETxxxxxxxxxxxxxxx
LIVEKIT_SERVER_URL=ws://localhost:7880

# AWS (opcional)
AWS_ACCESS_KEY=AKIAXXXXXXXXXXXXXXX
AWS_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-west-2
AWS_BUCKET=healthcare-recordings-bucket

# Frontend
REACT_APP_API_URL=http://localhost:8080
REACT_APP_WS_URL=ws://localhost:8080
REACT_APP_LIVEKIT_URL=ws://localhost:7880

# Servidor
NODE_ENV=development
PORT=8080
LOG_LEVEL=info

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notificaciones@tu-clinica.com
SMTP_PASSWORD=tu_app_password

# Backup
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
```

## 📋 Notas Importantes

1. **Nunca** commitees el archivo `.env` real al repositorio
2. Usa contraseñas seguras para producción
3. Para Livekit, necesitas registrarte en [LiveKit Cloud](https://cloud.livekit.io/) o instalar tu propio servidor
4. Para AWS S3, necesitas una cuenta de AWS y un bucket configurado
5. Los TURN servers son necesarios solo si hay problemas de conectividad con NAT/Firewall
6. Las configuraciones de email son opcionales para notificaciones

## 🔧 Configuración por Entorno

### Desarrollo Local
- Usa `NODE_ENV=development`
- URLs locales (localhost)
- Logs verbosos (`LOG_LEVEL=debug`)

### Producción
- Usa `NODE_ENV=production`
- URLs de dominio real
- Logs de nivel info o warning
- Configuración de TURN servers
- Backup automático habilitado 