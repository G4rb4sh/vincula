# Resumen de Scripts de Despliegue - Vincula

## Organización de Scripts

Los scripts han sido reorganizados para separar el despliegue del frontend y backend, ya que están alojados en diferentes plataformas.

### Nuevos Scripts Creados

```
build-frontend.sh      → Construye el frontend para Hostinger
setup-backend.sh       → Configura el VPS para el backend
start-backend.sh       → Inicia servicios del backend en VPS
cleanup.sh            → Limpia servicios del backend (actualizado)
```

### Scripts Anteriores (aún disponibles)

```
setup.sh              → Setup combinado (usar setup-backend.sh en su lugar)
start.sh              → Start combinado (usar start-backend.sh en su lugar)
```

## Uso Rápido

### Despliegue Inicial

**1. Backend (en VPS Ubuntu)**
```bash
git clone <repositorio>
cd vincula
chmod +x setup-backend.sh start-backend.sh
./setup-backend.sh
./start-backend.sh
```

**2. Frontend (en tu máquina local)**
```bash
chmod +x build-frontend.sh
./build-frontend.sh
# Sube frontend/build/ a Hostinger public_html/
```

### Actualizaciones

**Backend**
```bash
git pull
./start-backend.sh
```

**Frontend**
```bash
git pull
./build-frontend.sh
# Sube frontend/build/ a Hostinger
```

## Archivos Actualizados

- `GUIA_DESPLIEGUE.md` - Actualizada con instrucciones separadas
- `cleanup.sh` - Actualizado para reflejar que es solo para backend

## Archivos de Documentación Nuevos

- `SCRIPTS_README.md` - Documentación detallada de cada script
- `MIGRATION_NOTES.md` - Guía de migración desde scripts anteriores
- `DEPLOYMENT_SUMMARY.md` - Este archivo (resumen rápido)

## Flujo Visual

```
┌─────────────────────────────────────────────────────┐
│                    DESPLIEGUE                        │
└─────────────────────────────────────────────────────┘
                          │
            ┌─────────────┴─────────────┐
            │                           │
            ▼                           ▼
    ┌──────────────┐          ┌──────────────┐
    │   FRONTEND   │          │   BACKEND    │
    │  (Hostinger) │          │     (VPS)    │
    └──────────────┘          └──────────────┘
            │                           │
            │                           │
    ┌───────▼────────┐         ┌────────▼─────────┐
    │ Local Machine  │         │  VPS Ubuntu      │
    │ (con Node.js)  │         │ (72.60.48.118)   │
    └────────────────┘         └──────────────────┘
            │                           │
            │                           │
    ┌───────▼──────────┐      ┌─────────▼──────────┐
    │ build-frontend.sh│      │ setup-backend.sh   │
    │                  │      │ (solo 1ra vez)     │
    └──────────────────┘      └────────────────────┘
            │                           │
            │                           │
    ┌───────▼──────────┐      ┌─────────▼──────────┐
    │ frontend/build/  │      │ start-backend.sh   │
    │                  │      │                    │
    └──────────────────┘      └────────────────────┘
            │                           │
            │                           │
    ┌───────▼──────────┐      ┌─────────▼──────────┐
    │ Subir a          │      │ Docker containers  │
    │ Hostinger        │      │ corriendo          │
    │ (File Manager)   │      │                    │
    └──────────────────┘      └────────────────────┘
```

## Ventajas de la Nueva Organización

1. **Claridad**: Cada script tiene un propósito específico
2. **Separación**: Frontend y backend claramente separados
3. **Flexibilidad**: Actualiza frontend sin tocar backend y viceversa
4. **Documentación**: Scripts mejor documentados y fáciles de entender
5. **Mantenimiento**: Más fácil de mantener y depurar

## Próximos Pasos

1. Revisa `GUIA_DESPLIEGUE.md` para instrucciones detalladas
2. Revisa `SCRIPTS_README.md` para entender cada script
3. Si tienes instalación existente, revisa `MIGRATION_NOTES.md`

## Contacto

Para dudas o problemas, consulta la sección "Solución de problemas" en `GUIA_DESPLIEGUE.md`

