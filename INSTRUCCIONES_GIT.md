# Instrucciones para subir a Git

Este proyecto ya está limpio y listo para ser commiteado a Git.

## Archivos eliminados

Se han eliminado todos los archivos innecesarios:
- Todos los archivos `.zip` de builds antiguos
- Scripts de Windows (`.bat`, `.ps1`)
- Carpetas de build (`prod/`, `frontend/build/`)
- Documentación duplicada o temporal
- Scripts duplicados

## Archivos esenciales que quedan

### Scripts principales (3 archivos)
1. `setup.sh` - Instala Docker y prepara el entorno
2. `start.sh` - Inicia la aplicación
3. `cleanup.sh` - Detiene y limpia

### Configuración
- `docker-compose.yaml` - Configuración base de Docker
- `docker-compose.prod.yml` - Configuración de producción
- `env.template` - Plantilla de variables de entorno
- `.gitignore` - Archivos a ignorar en Git

### Código fuente
- `backend/` - Microservicios en Go
- `frontend/` - Aplicación React
- `database/` - Migraciones SQL

### Documentación
- `README.md` - Documentación principal
- `GUIA_DESPLIEGUE.md` - Guía rápida de despliegue

## Comandos para subir a Git

```bash
# Ver el estado actual
git status

# Agregar todos los cambios
git add .

# Ver qué se va a commitear
git status

# Hacer commit
git commit -m "Limpieza del proyecto: eliminados archivos innecesarios, agregados scripts de despliegue para Ubuntu"

# Subir a Git
git push origin main
```

## Estructura final del proyecto

```
vincula/
├── backend/              # Microservicios
│   ├── api-gateway/
│   ├── call-service/    # Maneja videollamadas y grabación
│   ├── user-service/
│   └── queue-service/
├── frontend/            # Aplicación React
│   ├── src/
│   ├── public/
│   └── .htaccess        # Para Hostinger
├── database/
│   └── migrations/      # Migraciones SQL
├── setup.sh            # 1. Instalación
├── start.sh            # 2. Iniciar
├── cleanup.sh          # 3. Limpiar
├── docker-compose.yaml
├── docker-compose.prod.yml
├── env.template
├── .gitignore
├── README.md
└── GUIA_DESPLIEGUE.md
```

## Verificación antes de hacer push

Verifica que estos archivos NO se suban (están en .gitignore):
- `.env` (archivo con secrets)
- `node_modules/`
- `build/` y `prod/`
- Archivos `.log`
- Archivos `.zip`

Puedes verificar con:
```bash
git status
```

Si ves alguno de estos archivos listados para ser commiteados, significa que hay un problema con el `.gitignore`.


