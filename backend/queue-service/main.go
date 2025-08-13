package main

import (
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// Estructuras de datos simples
type QueueEntry struct {
	ID            string    `json:"id"`
	PatientID     string    `json:"patient_id"`
	Priority      string    `json:"priority"`
	WaitingSince  time.Time `json:"waiting_since"`
	Position      int       `json:"position"`
	EstimatedWait int       `json:"estimated_wait"`
	Status        string    `json:"status"`
}

type JoinQueueRequest struct {
	PatientID string `json:"patientId" binding:"required"`
	Priority  string `json:"priority"`
}

type JoinQueueResponse struct {
	Success           bool   `json:"success"`
	Position          int    `json:"position"`
	EstimatedWaitTime int    `json:"estimatedWaitTime"`
	QueueID           string `json:"queue_id"`
}

// Almacenamiento simple en memoria (en producción usar Redis)
var queue []QueueEntry
var nextID int = 1

func main() {
	// Configurar Gin
	r := gin.Default()

	// CORS manejado por API Gateway - no configurar aquí para evitar conflictos

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "queue-service",
		})
	})

	// API routes placeholder
	api := r.Group("/api/v1")
	{
		api.GET("/status", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"message": "Queue Service is running",
				"version": "1.0.0",
			})
		})
	}

	// Endpoints de la cola
	queueAPI := r.Group("/api/queue")
	{
		queueAPI.POST("/join", handleJoinQueue)
		queueAPI.POST("/leave", handleLeaveQueue)
		queueAPI.GET("/status", handleQueueStatus)
		queueAPI.GET("/", handleGetQueue)
		queueAPI.POST("/next", handleNextCall)
		queueAPI.POST("/:id/assign", handleAssignSpecificCall)
	}

	// Obtener puerto del entorno
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Queue Service iniciado en puerto %s", port)
	log.Fatal(r.Run(":" + port))
}

// Handlers de la API
func handleJoinQueue(c *gin.Context) {
	var req JoinQueueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verificar si el paciente ya está en la cola
	for _, entry := range queue {
		if entry.PatientID == req.PatientID && entry.Status == "waiting" {
			c.JSON(http.StatusConflict, gin.H{"error": "Patient already in queue"})
			return
		}
	}

	// Crear nueva entrada en la cola
	entry := QueueEntry{
		ID:           strconv.Itoa(nextID),
		PatientID:    req.PatientID,
		Priority:     req.Priority,
		WaitingSince: time.Now(),
		Status:       "waiting",
	}
	nextID++

	// Agregar a la cola
	queue = append(queue, entry)

	// Actualizar posiciones
	updatePositions()

	// Encontrar la posición del paciente
	position := 0
	for i, e := range queue {
		if e.ID == entry.ID {
			position = i + 1
			break
		}
	}

	response := JoinQueueResponse{
		Success:           true,
		Position:          position,
		EstimatedWaitTime: calculateEstimatedWait(position),
		QueueID:           entry.ID,
	}

	log.Printf("Patient %s joined queue at position %d", req.PatientID, position)
	c.JSON(http.StatusOK, response)
}

func handleLeaveQueue(c *gin.Context) {
	var req struct {
		PatientID string `json:"patientId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Buscar y remover al paciente de la cola
	for i, entry := range queue {
		if entry.PatientID == req.PatientID {
			queue = append(queue[:i], queue[i+1:]...)
			updatePositions()
			log.Printf("Patient %s left the queue", req.PatientID)
			c.JSON(http.StatusOK, gin.H{"success": true})
			return
		}
	}

	c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found in queue"})
}

func handleQueueStatus(c *gin.Context) {
	patientID := c.Query("patientId")
	if patientID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "patientId is required"})
		return
	}

	for _, entry := range queue {
		if entry.PatientID == patientID {
			c.JSON(http.StatusOK, gin.H{
				"inQueue":           true,
				"position":          entry.Position,
				"estimatedWaitTime": entry.EstimatedWait,
				"status":            entry.Status,
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"inQueue": false,
	})
}

func handleGetQueue(c *gin.Context) {
	updatePositions()
	c.JSON(http.StatusOK, gin.H{"queue": queue})
}

func handleNextCall(c *gin.Context) {
	if len(queue) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No patients in queue"})
		return
	}

	// Tomar el primer paciente de la cola
	nextPatient := queue[0]
	queue = queue[1:]
	updatePositions()

	// Generar ID de llamada simple
	callID := "call_" + strconv.FormatInt(time.Now().UnixNano(), 10)

	log.Printf("Assigned call %s to patient %s", callID, nextPatient.PatientID)

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"call_id":    callID,
		"patient_id": nextPatient.PatientID,
	})
}

func handleAssignSpecificCall(c *gin.Context) {
	entryID := c.Param("id")
	if entryID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Entry ID is required"})
		return
	}

	// Buscar el paciente específico en la cola
	var targetEntry QueueEntry
	var foundIndex = -1

	for i, entry := range queue {
		if entry.ID == entryID {
			targetEntry = entry
			foundIndex = i
			break
		}
	}

	if foundIndex == -1 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found in queue"})
		return
	}

	// Remover al paciente de la cola
	queue = append(queue[:foundIndex], queue[foundIndex+1:]...)
	updatePositions()

	// Generar ID de llamada simple
	callID := "call_" + strconv.FormatInt(time.Now().UnixNano(), 10)

	log.Printf("Assigned specific call %s to patient %s (entry %s)", callID, targetEntry.PatientID, entryID)

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"call_id":    callID,
		"patient_id": targetEntry.PatientID,
		"entry_id":   entryID,
	})
}

// Funciones auxiliares
func updatePositions() {
	for i := range queue {
		queue[i].Position = i + 1
		queue[i].EstimatedWait = calculateEstimatedWait(i + 1)
	}
}

func calculateEstimatedWait(position int) int {
	avgCallDuration := 15 // minutos
	return position * avgCallDuration
}
