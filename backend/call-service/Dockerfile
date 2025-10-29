FROM golang:1.24-alpine AS builder

WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache git

# Copiar archivos de módulo
COPY go.mod go.sum ./

# Descargar dependencias
RUN go mod download

# Copiar código fuente completo
COPY . .

# Verificar estructura y ejecutar go mod tidy
RUN echo "=== Directory structure ===" && \
    find . -type f -name "*.go" && \
    echo "=== Running go mod tidy ===" && \
    go mod tidy && \
    echo "=== Building application ===" 

# Compilar la aplicación
RUN CGO_ENABLED=0 GOOS=linux go build -v -o main .

# Imagen final
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

# Copiar el binario desde el builder
COPY --from=builder /app/main .

# Exponer puerto
EXPOSE 8080

# Comando para ejecutar
CMD ["./main"] 