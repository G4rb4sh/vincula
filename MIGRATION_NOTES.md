# Notas de Migración - Scripts de Despliegue

## Cambios en los Scripts

Los scripts de despliegue se han reorganizado para reflejar mejor la arquitectura de despliegue separada (frontend en Hostinger, backend en VPS).

### Scripts Anteriores (DEPRECATED)

- `setup.sh` - Configuraba todo junto
- `start.sh` - Iniciaba todo junto

### Scripts Nuevos

**Frontend** (ejecutar localmente):
- `build-frontend.sh` - Construye archivos para subir a Hostinger

**Backend** (ejecutar en VPS):
- `setup-backend.sh` - Setup del backend en VPS (reemplaza `setup.sh`)
- `start-backend.sh` - Inicia backend en VPS (reemplaza `start.sh`)
- `cleanup.sh` - Limpia servicios del backend (sin cambios)

## Por Qué Este Cambio

El frontend y backend se despliegan en diferentes lugares:
- **Frontend**: Hostinger - Archivos estáticos HTML/CSS/JS
- **Backend**: VPS Ubuntu - Contenedores Docker

Los scripts anteriores intentaban manejar ambos, lo cual era confuso y no necesario.

## Qué Hacer Si Ya Tienes una Instalación

### Si ya tienes el backend corriendo en el VPS
No necesitas hacer nada. Los scripts `setup-backend.sh` y `start-backend.sh` funcionan igual que los anteriores para el backend.

### Si construiste el frontend antes
Usa el nuevo `build-frontend.sh` para futuras actualizaciones. El proceso es el mismo:
1. Ejecuta `./build-frontend.sh`
2. Sube `frontend/build/` a Hostinger

## Migración Paso a Paso

1. Haz un pull del repositorio con los nuevos scripts:
```bash
git pull
```

2. Dale permisos de ejecución a los nuevos scripts:
```bash
chmod +x build-frontend.sh setup-backend.sh start-backend.sh
```

3. Usa los nuevos scripts según tu necesidad:
```bash
# Para backend (en el VPS)
./setup-backend.sh  # Solo si es primera vez
./start-backend.sh  # Para iniciar/reiniciar

# Para frontend (localmente)
./build-frontend.sh  # Para construir archivos a subir
```

## Preguntas Frecuentes

**P: ¿Puedo seguir usando setup.sh y start.sh?**
R: Sí, por ahora funcionarán, pero se recomienda migrar a los nuevos scripts que son más claros.

**P: ¿Los scripts antiguos se eliminarán?**
R: Podrían marcarse como deprecated en futuras versiones. Se recomienda usar los nuevos.

**P: ¿Cambia algo en el proceso de despliegue?**
R: No, el proceso es el mismo. Solo los nombres de los scripts son más descriptivos.

**P: ¿Necesito reconfigurar algo?**
R: No, tu archivo `.env` y configuraciones existentes siguen siendo válidos.

