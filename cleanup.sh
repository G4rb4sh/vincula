#!/bin/bash

# Vincula - Script de Limpieza del Backend
# Este script detiene y limpia todos los servicios del backend en el VPS

echo "==================================="
echo "   Vincula - Limpieza Backend"
echo "==================================="

# Preguntar qué tipo de limpieza
echo ""
echo "Selecciona el tipo de limpieza:"
echo "  1) Detener servicios (mantener datos)"
echo "  2) Detener y eliminar contenedores (mantener volúmenes/datos)"
echo "  3) Limpieza completa (ELIMINAR TODO incluyendo base de datos y grabaciones)"
echo ""
read -p "Opción (1-3): " option

case $option in
    1)
        echo ""
        echo "Deteniendo servicios..."
        docker-compose -f docker-compose.yaml -f docker-compose.prod.yml stop
        echo "Servicios detenidos. Los datos se mantienen intactos."
        ;;
    2)
        echo ""
        echo "Deteniendo y eliminando contenedores..."
        docker-compose -f docker-compose.yaml -f docker-compose.prod.yml down
        echo "Contenedores eliminados. Los volúmenes de datos se mantienen."
        ;;
    3)
        echo ""
        read -p "¿Estás seguro? Esto eliminará TODA la base de datos y grabaciones (s/n): " confirm
        if [ "$confirm" = "s" ] || [ "$confirm" = "S" ]; then
            echo ""
            echo "Realizando limpieza completa..."
            
            # Detener y eliminar contenedores y volúmenes
            docker-compose -f docker-compose.yaml -f docker-compose.prod.yml down -v
            
            # Eliminar grabaciones locales
            if [ -d "/var/recordings" ]; then
                echo "Eliminando grabaciones..."
                sudo rm -rf /var/recordings/*
            fi
            
            # Eliminar imágenes no utilizadas
            echo "Limpiando imágenes Docker no utilizadas..."
            docker image prune -f
            
            echo ""
            echo "Limpieza completa finalizada."
        else
            echo "Limpieza completa cancelada."
        fi
        ;;
    *)
        echo "Opción inválida"
        exit 1
        ;;
esac

echo ""
echo "==================================="
echo "   Limpieza Completada"
echo "==================================="
echo ""


