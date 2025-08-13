package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func main() {
	// Configurar Gin
	r := gin.Default()

	// CORS manejado por API Gateway - no configurar aquí para evitar conflictos

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "call-service",
		})
	})

	// API routes placeholder
	api := r.Group("/api/v1")
	{
		api.GET("/status", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"message": "Call Service is running",
				"version": "1.0.0",
			})
		})
	}

	// Obtener puerto del entorno
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Call Service iniciado en puerto %s", port)
	log.Fatal(r.Run(":" + port))
}
