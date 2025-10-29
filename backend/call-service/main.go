package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	
	"call-service/internal/handlers"
	"call-service/internal/livekit"
)

func main() {
	// Configurar base de datos
	dbHost := getEnv("DB_HOST", "postgres")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "vincula_user")
	dbPassword := getEnv("DB_PASSWORD", "")
	dbName := getEnv("DB_NAME", "vincula")

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPassword, dbName)
	
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Error connecting to database:", err)
	}
	defer db.Close()

	// Verificar conexión
	if err := db.Ping(); err != nil {
		log.Fatal("Database connection failed:", err)
	}

	// Configurar LiveKit Manager
	livekitURL := getEnv("LIVEKIT_URL", "http://livekit:7880")
	livekitAPIKey := getEnv("LIVEKIT_API_KEY", "devkey")
	livekitAPISecret := getEnv("LIVEKIT_API_SECRET", "vincula_livekit_secret_key_2024_development_secure")
	
	lkManager := livekit.NewLiveKitManager(livekitURL, livekitAPIKey, livekitAPISecret)

	// Configurar handlers
	callHandlers := handlers.NewCallHandlers(db, lkManager)

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

	// API routes
	api := r.Group("/api/v1")
	{
		// Status endpoint
		api.GET("/status", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"message": "Call Service is running",
				"version": "2.0.0",
			})
		})

		// Call management endpoints
		calls := api.Group("/calls")
		{
			// Obtener llamadas activas (con permisos según rol)
			calls.GET("/active", callHandlers.GetActiveCalls)
			
			// Obtener grabaciones de llamadas
			calls.GET("/recordings", callHandlers.GetCallRecordings)
			calls.GET("/:callId/recordings", callHandlers.GetCallRecordings)
			
			// Obtener token para livestream de una llamada
			calls.GET("/:callId/livestream-token", callHandlers.GetLivestreamToken)
			
			// Control de grabación manual (solo para empleados/admins)
			calls.POST("/:callId/start-recording", callHandlers.StartCallRecording)
			
			// Endpoint existente para crear llamadas
			calls.POST("/create", handleCreateCall(db, lkManager))
			
			// Endpoint existente para obtener token de participante
			calls.POST("/token", handleGetToken(db, lkManager))
		}

		// LiveKit webhook endpoint para eventos
		api.POST("/livekit/webhook", handleLiveKitWebhook(db))
	}

	// Obtener puerto del entorno
	port := getEnv("PORT", "8080")
	
	log.Printf("Call Service iniciado en puerto %s", port)
	log.Printf("Conectado a base de datos: %s", dbName)
	log.Printf("LiveKit URL: %s", livekitURL)
	log.Printf("Grabación automática: ACTIVADA")
	log.Printf("Livestreaming: ACTIVADO")
	
	log.Fatal(r.Run(":" + port))
}

// handleCreateCall maneja la creación de nuevas llamadas
func handleCreateCall(db *sql.DB, lkManager *livekit.LiveKitManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			PatientID  string `json:"patient_id" binding:"required"`
			EmployeeID string `json:"employee_id"`
			Reason     string `json:"reason"`
			Priority   int    `json:"priority"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
			return
		}

		// Verificar consentimientos del paciente
		var recordingConsent, livestreamConsent bool
		err := db.QueryRow(`
			SELECT recording_consent, livestream_consent 
			FROM users 
			WHERE id = $1
		`, req.PatientID).Scan(&recordingConsent, &livestreamConsent)

		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Paciente no encontrado"})
			return
		}

		if !recordingConsent || !livestreamConsent {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "El paciente no ha dado consentimiento para grabación/livestreaming",
			})
			return
		}

		// Crear llamada en LiveKit
		callID := generateCallID()
		room, err := lkManager.CreateCallRoom(callID, req.PatientID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear sala de videollamada"})
			return
		}

		// Insertar llamada en la base de datos
		_, err = db.Exec(`
			INSERT INTO calls (id, room_id, patient_id, employee_id, status, priority, reason, 
			                  is_recording, is_livestreaming, created_at)
			VALUES ($1, $2, $3, $4, 'waiting', $5, $6, true, $7, NOW())
		`, callID, room.Name, req.PatientID, req.EmployeeID, req.Priority, req.Reason, livestreamConsent)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al registrar llamada"})
			return
		}

		// Notificar a familiares si el livestreaming está habilitado
		if livestreamConsent {
			h := &handlers.CallHandlers{}
			go h.NotifyCallStart(callID, req.PatientID)
		}

		c.JSON(http.StatusOK, gin.H{
			"call_id": callID,
			"room_id": room.Name,
			"message": "Llamada creada exitosamente",
			"recording": true,
			"livestreaming": livestreamConsent,
		})
	}
}

// handleGetToken genera tokens de acceso para LiveKit
func handleGetToken(db *sql.DB, lkManager *livekit.LiveKitManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			CallID        string `json:"call_id" binding:"required"`
			ParticipantID string `json:"participant_id" binding:"required"`
			Role          string `json:"role" binding:"required"`
			IsObserver    bool   `json:"is_observer"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
			return
		}

		// Obtener room_id de la base de datos
		var roomID string
		err := db.QueryRow("SELECT room_id FROM calls WHERE id = $1", req.CallID).Scan(&roomID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Llamada no encontrada"})
			return
		}

		// Si es observador (livestream), usar permisos restringidos
		role := livekit.UserRole(req.Role)
		if req.IsObserver {
			role = livekit.RoleFamily // Forzar modo observador
		}

		// Generar token
		token, err := lkManager.GenerateAccessToken(roomID, req.ParticipantID, role)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al generar token"})
			return
		}

		serverURL := getEnv("LIVEKIT_PUBLIC_URL", "ws://localhost:7880")
		
		c.JSON(http.StatusOK, gin.H{
			"token":      token,
			"server_url": serverURL,
		})
	}
}

// handleLiveKitWebhook procesa eventos de LiveKit
func handleLiveKitWebhook(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var event struct {
			Event string                 `json:"event"`
			Room  map[string]interface{} `json:"room"`
			Participant map[string]interface{} `json:"participant"`
			EgressInfo map[string]interface{} `json:"egress_info"`
		}

		if err := c.ShouldBindJSON(&event); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid webhook data"})
			return
		}

		// Procesar diferentes tipos de eventos
		switch event.Event {
		case "room_started":
			// Actualizar estado de la llamada a activa
			roomName := event.Room["name"].(string)
			db.Exec(`
				UPDATE calls SET status = 'active', started_at = NOW() 
				WHERE room_id = $1
			`, roomName)
			
		case "room_finished":
			// Actualizar estado de la llamada a completada
			roomName := event.Room["name"].(string)
			db.Exec(`
				UPDATE calls 
				SET status = 'completed', ended_at = NOW(), 
				    duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))
				WHERE room_id = $1
			`, roomName)
			
		case "recording_started":
			// Actualizar estado de grabación
			egressID := event.EgressInfo["egress_id"].(string)
			roomName := event.EgressInfo["room_name"].(string)
			db.Exec(`
				UPDATE calls SET egress_id = $1, is_recording = true 
				WHERE room_id = $2
			`, egressID, roomName)
			
		case "recording_ended":
			// Actualizar información de grabación
			egressID := event.EgressInfo["egress_id"].(string)
			if fileInfo, ok := event.EgressInfo["file"].(map[string]interface{}); ok {
				filePath := fileInfo["filepath"].(string)
				fileSize := int64(fileInfo["size"].(float64))
				duration := int(fileInfo["duration"].(float64))
				
				// Actualizar registro de grabación
				db.Exec(`
					UPDATE call_recordings 
					SET recording_url = $1, recording_size_bytes = $2, 
					    duration_seconds = $3, status = 'completed', ended_at = NOW()
					WHERE egress_id = $4
				`, filePath, fileSize, duration, egressID)
				
				// Actualizar llamada
				db.Exec(`
					UPDATE calls 
					SET is_recording = false, recording_url = $1, 
					    recording_size_bytes = $2
					WHERE egress_id = $3
				`, filePath, fileSize, egressID)
			}
		}

		c.JSON(http.StatusOK, gin.H{"status": "processed"})
	}
}

// Funciones auxiliares
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func generateCallID() string {
	return fmt.Sprintf("call_%d", generateTimestamp())
}

func generateTimestamp() int64 {
	return time.Now().UnixNano() / 1000000
}