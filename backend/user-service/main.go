package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"user-service/internal/domain"
	"user-service/internal/handlers"
	"user-service/internal/repository"
	"user-service/internal/websocket"
)

func main() {
	// Configurar base de datos
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://healthcare_user:healthcare_password_123@localhost:5432/healthcare_db?sslmode=disable"
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Auto-migrar las tablas
	err = db.AutoMigrate(&domain.User{}, &domain.QueueEntry{}, &domain.Call{}, &domain.CallParticipant{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// Configurar repositorios
	userRepo := repository.NewUserRepository(db)
	queueRepo := repository.NewQueueRepository(db)

	// Configurar WebSocket manager
	wsManager := websocket.NewWebSocketManager()
	go wsManager.Run()

	// Configurar handlers
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "your_super_secret_jwt_key_here_change_in_production"
	}

	authHandler := handlers.NewAuthHandler(userRepo, jwtSecret)
	queueHandler := handlers.NewQueueHandler(queueRepo, userRepo, wsManager)
	livekitHandler := handlers.NewLiveKitHandler()

	// Configurar router
	r := gin.Default()

	// CORS manejado por API Gateway - no configurar aquí para evitar conflictos

	// WebSocket endpoint
	r.GET("/ws", authHandler.WebSocketAuthMiddleware(), wsManager.HandleWebSocket)

	// Rutas de autenticación
	auth := r.Group("/api/auth")
	{
		auth.POST("/login", authHandler.Login)
		auth.POST("/register", authHandler.Register)
		auth.GET("/me", authHandler.AuthMiddleware(), authHandler.GetCurrentUser)
	}

	// Rutas de usuarios
	users := r.Group("/api/users")
	users.Use(authHandler.AuthMiddleware())
	{
		users.GET("/", authHandler.GetUsers)
		users.GET("/:id", authHandler.GetUser)
		users.PUT("/:id", authHandler.UpdateUser)
		users.DELETE("/:id", authHandler.DeleteUser)
	}

	// Rutas de cola
	queue := r.Group("/api/queue")
	queue.Use(authHandler.AuthMiddleware())
	{
		queue.POST("/join", queueHandler.JoinQueue)
		queue.GET("/", queueHandler.GetQueue)
		queue.POST("/next", queueHandler.AssignNextCall)
		queue.POST("/:id/assign", queueHandler.AssignSpecificCall)
	}

	// Rutas de llamadas
	calls := r.Group("/api/calls")
	calls.Use(authHandler.AuthMiddleware())
	{
		calls.GET("/active", queueHandler.GetActiveCalls)
		calls.GET("/:id", queueHandler.GetCall)
		calls.POST("/:id/end", queueHandler.EndCall)
		calls.POST("/token", livekitHandler.GenerateToken)
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("User service starting on port %s", port)
	log.Fatal(r.Run(":" + port))
}
