# Etapa de construcción
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./

# Instalar dependencias
RUN npm ci && npm install @mui/material @mui/icons-material @emotion/react @emotion/styled

# Copiar código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Etapa de producción con nginx
FROM nginx:alpine

# Copiar archivos construidos
COPY --from=builder /app/build /usr/share/nginx/html

# Crear configuración de nginx
RUN echo 'server {' > /etc/nginx/conf.d/default.conf && \
    echo '    listen 3000;' >> /etc/nginx/conf.d/default.conf && \
    echo '    server_name localhost;' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    location / {' >> /etc/nginx/conf.d/default.conf && \
    echo '        root /usr/share/nginx/html;' >> /etc/nginx/conf.d/default.conf && \
    echo '        index index.html index.htm;' >> /etc/nginx/conf.d/default.conf && \
    echo '        try_files $uri $uri/ /index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    # Configuración para APIs (incluye CORS)' >> /etc/nginx/conf.d/default.conf && \
    echo '    location /api/ {' >> /etc/nginx/conf.d/default.conf && \
    echo '        add_header Access-Control-Allow-Origin "$http_origin" always;' >> /etc/nginx/conf.d/default.conf && \
    echo '        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;' >> /etc/nginx/conf.d/default.conf && \
    echo '        add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept, Authorization" always;' >> /etc/nginx/conf.d/default.conf && \
    echo '        if ($request_method = OPTIONS) { return 204; }' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_pass http://api-gateway:8080;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header Host $host;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header X-Real-IP $remote_addr;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header X-Forwarded-Proto $scheme;' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    # Configuración para WebSocket' >> /etc/nginx/conf.d/default.conf && \
    echo '    location /ws {' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_pass http://api-gateway:8080;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_http_version 1.1;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header Upgrade $http_upgrade;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header Connection "upgrade";' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_set_header Host $host;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_read_timeout 600s;' >> /etc/nginx/conf.d/default.conf && \
    echo '        proxy_send_timeout 600s;' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '}' >> /etc/nginx/conf.d/default.conf

# Exponer puerto
EXPOSE 3000

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"] 