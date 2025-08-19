package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Configurar Gin
	r := gin.Default()

	// Configurar CORS (incluye dominios de desarrollo y producción)
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:3000", 
			"http://192.168.1.15:3000", 
			"http://127.0.0.1:3000", 
			"http://26.92.110.41:3000",
			"https://grupovincula.com",
			"http://grupovincula.com",
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
		AllowWildcard:    true,
	}))

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "api-gateway",
		})
	})

	// API routes placeholder
	api := r.Group("/api/v1")
	{
		api.GET("/status", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"message": "API Gateway is running",
				"version": "1.0.0",
			})
		})
	}

	// Configurar proxies para microservicios
	userServiceHost := os.Getenv("USER_SERVICE_URL")
	if userServiceHost == "" {
		userServiceHost = "http://user-service:8080"
	}
	userServiceURL, _ := url.Parse(userServiceHost)

	userProxy := httputil.NewSingleHostReverseProxy(userServiceURL)

	// Rutas de autenticación → user-service
	r.Any("/api/auth/*path", func(c *gin.Context) {
		userProxy.ServeHTTP(c.Writer, c.Request)
	})

	// Rutas de usuarios → user-service
	r.Any("/api/users/*path", func(c *gin.Context) {
		userProxy.ServeHTTP(c.Writer, c.Request)
	})

	// Rutas de cola → user-service (sistema unificado con WebSocket)
	r.Any("/api/queue/*path", func(c *gin.Context) {
		userProxy.ServeHTTP(c.Writer, c.Request)
	})

	// Rutas de llamadas → user-service (unified system)
	r.Any("/api/calls/*path", func(c *gin.Context) {
		// All call endpoints are handled by user-service
		userProxy.ServeHTTP(c.Writer, c.Request)
	})

	// WebSocket → user-service
	r.GET("/ws", func(c *gin.Context) {
		userProxy.ServeHTTP(c.Writer, c.Request)
	})

	// Obtener puerto del entorno
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("API Gateway iniciado en puerto %s", port)
	log.Printf("Proxying:")
	log.Printf("  /api/auth/* → user-service:8080")
	log.Printf("  /api/users/* → user-service:8080")
	log.Printf("  /api/queue/* → user-service:8080 (unified system)")
	log.Printf("  /api/calls/* → user-service:8080 (unified system)")
	log.Printf("  /ws → user-service:8080")

	log.Fatal(r.Run(":" + port))
}
