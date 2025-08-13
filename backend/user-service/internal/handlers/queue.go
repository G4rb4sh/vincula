package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"user-service/internal/domain"
	"user-service/internal/repository"
	"user-service/internal/websocket"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type QueueHandler struct {
	queueRepo repository.QueueRepository
	userRepo  repository.UserRepository
	wsManager *websocket.WebSocketManager
}

type JoinQueueRequest struct {
	Reason   string `json:"reason" binding:"required"`
	Priority int    `json:"priority"`
	Notes    string `json:"notes"`
}

type AssignCallRequest struct {
	QueueEntryID uuid.UUID `json:"queue_entry_id" binding:"required"`
}

func NewQueueHandler(queueRepo repository.QueueRepository, userRepo repository.UserRepository, wsManager *websocket.WebSocketManager) *QueueHandler {
	return &QueueHandler{
		queueRepo: queueRepo,
		userRepo:  userRepo,
		wsManager: wsManager,
	}
}

// JoinQueue - Paciente se une a la cola
func (h *QueueHandler) JoinQueue(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req JoinQueueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verificar que el usuario es un paciente
	user, err := h.userRepo.GetByID(userID.(uuid.UUID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if user.Role != domain.RolePatient {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only patients can join the queue"})
		return
	}

	// Establecer prioridad por defecto si no se especifica
	priority := req.Priority
	if priority == 0 {
		priority = 3 // Normal priority
	}

	// Crear entrada en la cola
	queueEntry := &domain.QueueEntry{
		PatientID: userID.(uuid.UUID),
		Priority:  priority,
		Status:    "waiting",
		Reason:    req.Reason,
		Notes:     req.Notes,
	}

	if err := h.queueRepo.CreateQueueEntry(queueEntry); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to join queue"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":        "Successfully joined queue",
		"queue_entry":    queueEntry,
		"position":       h.getQueuePosition(queueEntry.ID),
		"estimated_wait": h.getEstimatedWaitTime(),
	})
}

// GetQueue - Obtener la cola de pacientes
func (h *QueueHandler) GetQueue(c *gin.Context) {
	entries, err := h.queueRepo.GetQueueEntries()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get queue"})
		return
	}

	// Calcular estadísticas
	stats := h.calculateQueueStats(entries)

	c.JSON(http.StatusOK, gin.H{
		"queue": entries,
		"stats": stats,
	})
}

// AssignNextCall - Asignar la siguiente llamada en la cola
func (h *QueueHandler) AssignNextCall(c *gin.Context) {
	employeeID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Verificar que el usuario es un empleado
	user, err := h.userRepo.GetByID(employeeID.(uuid.UUID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if user.Role != domain.RoleEmployee {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only employees can assign calls"})
		return
	}

	// Obtener la siguiente entrada en la cola
	queueEntry, err := h.queueRepo.GetNextQueueEntry()
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No patients in queue"})
		return
	}

	// Asignar la entrada al empleado
	if err := h.queueRepo.AssignQueueEntry(queueEntry.ID, employeeID.(uuid.UUID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign call"})
		return
	}

	// Crear la llamada
	call := &domain.Call{
		QueueEntryID:  &queueEntry.ID,
		PatientID:     queueEntry.PatientID,
		EmployeeID:    employeeID.(uuid.UUID),
		Status:        "active",
		LiveKitRoomID: "call_" + uuid.New().String(),
	}

	if err := h.queueRepo.CreateCall(call); err != nil {
		log.Printf("Error creating call: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create call", "details": err.Error()})
		return
	}

	// Notificar al paciente via WebSocket
	h.notifyPatientCallStarted(call)

	c.JSON(http.StatusOK, gin.H{
		"message": "Call assigned successfully",
		"call_id": call.ID,
		"call":    call,
	})
}

// AssignSpecificCall - Asignar una entrada específica de la cola
func (h *QueueHandler) AssignSpecificCall(c *gin.Context) {
	employeeID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Verificar que el usuario es un empleado
	user, err := h.userRepo.GetByID(employeeID.(uuid.UUID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if user.Role != domain.RoleEmployee {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only employees can assign calls"})
		return
	}

	// Obtener el ID de la entrada de la cola
	queueEntryIDStr := c.Param("id")
	queueEntryID, err := uuid.Parse(queueEntryIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid queue entry ID"})
		return
	}

	// Obtener la entrada específica de la cola
	queueEntry, err := h.queueRepo.GetQueueEntryByID(queueEntryID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Queue entry not found"})
		return
	}

	// Verificar que la entrada esté en estado "waiting"
	if queueEntry.Status != "waiting" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Queue entry is not available for assignment"})
		return
	}

	// Asignar la entrada al empleado
	if err := h.queueRepo.AssignQueueEntry(queueEntry.ID, employeeID.(uuid.UUID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign call"})
		return
	}

	// Crear la llamada
	call := &domain.Call{
		QueueEntryID:  &queueEntry.ID,
		PatientID:     queueEntry.PatientID,
		EmployeeID:    employeeID.(uuid.UUID),
		Status:        "active",
		LiveKitRoomID: "call_" + uuid.New().String(),
	}

	if err := h.queueRepo.CreateCall(call); err != nil {
		log.Printf("Error creating call: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create call", "details": err.Error()})
		return
	}

	// Notificar al paciente via WebSocket
	h.notifyPatientCallStarted(call)

	c.JSON(http.StatusOK, gin.H{
		"message": "Call assigned successfully",
		"call_id": call.ID,
		"call":    call,
	})
}

// GetActiveCalls - Obtener llamadas activas
func (h *QueueHandler) GetActiveCalls(c *gin.Context) {
	calls, err := h.queueRepo.GetActiveCalls()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get active calls"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"calls": calls,
		"count": len(calls),
	})
}

// GetCall - Obtener detalles de una llamada específica
func (h *QueueHandler) GetCall(c *gin.Context) {
	callIDStr := c.Param("id")
	callID, err := uuid.Parse(callIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid call ID"})
		return
	}

	call, err := h.queueRepo.GetCallByID(callID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Call not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"call": call,
	})
}

// EndCall - Terminar una llamada
func (h *QueueHandler) EndCall(c *gin.Context) {
	callIDStr := c.Param("id")
	callID, err := uuid.Parse(callIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid call ID"})
		return
	}

	if err := h.queueRepo.EndCall(callID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to end call"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Call ended successfully",
	})
}

// Helper functions
func (h *QueueHandler) getQueuePosition(entryID uuid.UUID) int {
	entries, err := h.queueRepo.GetQueueEntries()
	if err != nil {
		return -1
	}

	for i, entry := range entries {
		if entry.ID == entryID {
			return i + 1
		}
	}
	return -1
}

func (h *QueueHandler) getEstimatedWaitTime() int {
	// Estimación simple: 15 minutos por paciente en la cola
	entries, err := h.queueRepo.GetQueueEntries()
	if err != nil {
		return 0
	}
	return len(entries) * 15 // minutos
}

func (h *QueueHandler) calculateQueueStats(entries []domain.QueueEntry) map[string]interface{} {
	stats := map[string]interface{}{
		"total":  len(entries),
		"urgent": 0,
		"high":   0,
		"normal": 0,
		"low":    0,
	}

	for _, entry := range entries {
		switch entry.Priority {
		case 1:
			stats["urgent"] = stats["urgent"].(int) + 1
		case 2:
			stats["high"] = stats["high"].(int) + 1
		case 3:
			stats["normal"] = stats["normal"].(int) + 1
		case 4:
			stats["low"] = stats["low"].(int) + 1
		}
	}

	return stats
}

// notifyPatientCallStarted - Notificar al paciente que la llamada ha comenzado
func (h *QueueHandler) notifyPatientCallStarted(call *domain.Call) {
	// Obtener información del paciente
	patient, err := h.userRepo.GetByID(call.PatientID)
	if err != nil {
		log.Printf("Error getting patient info for notification: %v", err)
		return
	}

	// Crear el mensaje de notificación
	notification := map[string]interface{}{
		"type":         "call_started",
		"call_id":      call.ID,
		"message":      "Su consulta médica está comenzando",
		"redirect_url": "/video-call/" + call.ID.String(),
	}

	// Convertir a JSON
	notificationJSON, err := json.Marshal(notification)
	if err != nil {
		log.Printf("Error marshaling notification: %v", err)
		return
	}

	// Enviar notificación via WebSocket
	h.wsManager.SendToUser(patient.ID.String(), notificationJSON)
	log.Printf("Sent call started notification to patient %s", patient.ID)
}
