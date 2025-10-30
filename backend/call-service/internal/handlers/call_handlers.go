package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

// CallInfo representa información de una llamada
type CallInfo struct {
	ID               string    `json:"id"`
	RoomID           string    `json:"room_id"`
	PatientID        string    `json:"patient_id"`
	PatientName      string    `json:"patient_name"`
	EmployeeID       string    `json:"employee_id,omitempty"`
	EmployeeName     string    `json:"employee_name,omitempty"`
	Status           string    `json:"status"`
	Priority         int       `json:"priority"`
	Reason           string    `json:"reason"`
	IsRecording      bool      `json:"is_recording"`
	IsLivestreaming  bool      `json:"is_livestreaming"`
	ParticipantCount int       `json:"participant_count"`
	StartedAt        *time.Time `json:"started_at"`
	CreatedAt        time.Time `json:"created_at"`
}

// RecordingInfo representa información de una grabación
type RecordingInfo struct {
	ID              string    `json:"id"`
	CallID          string    `json:"call_id"`
	RecordingURL    string    `json:"recording_url"`
	RecordingSizeBytes int64   `json:"recording_size_bytes"`
	DurationSeconds int       `json:"duration_seconds"`
	Status          string    `json:"status"`
	StorageType     string    `json:"storage_type"`
	CreatedAt       time.Time `json:"created_at"`
}

type CallHandlers struct {
	db             *sql.DB
	livekitManager interface{} // Usar interface para evitar importación circular
}

func NewCallHandlers(db *sql.DB, lkManager interface{}) *CallHandlers {
	return &CallHandlers{
		db:             db,
		livekitManager: lkManager,
	}
}

// GetActiveCalls obtiene todas las llamadas activas con permisos según el rol del usuario
func (h *CallHandlers) GetActiveCalls(c *gin.Context) {
	userID := c.GetHeader("X-User-ID")
	userRole := c.GetHeader("X-User-Role")

	if userID == "" || userRole == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}

	var query string
	var args []interface{}

	switch userRole {
	case "employee", "admin":
		// Empleados y admins pueden ver todas las llamadas activas
		query = `
			SELECT 
				c.id, c.room_id, c.patient_id, c.employee_id, c.status, 
				c.priority, c.reason, c.is_recording, c.is_livestreaming,
				c.started_at, c.created_at,
				p.first_name || ' ' || p.last_name as patient_name,
				COALESCE(e.first_name || ' ' || e.last_name, '') as employee_name
			FROM calls c
			LEFT JOIN users p ON c.patient_id = p.id
			LEFT JOIN users e ON c.employee_id = e.id
			WHERE c.status IN ('active', 'waiting')
			ORDER BY c.priority DESC, c.created_at ASC
		`
	case "family":
		// Familiares solo pueden ver llamadas de sus pacientes vinculados
		query = `
			SELECT DISTINCT
				c.id, c.room_id, c.patient_id, c.employee_id, c.status, 
				c.priority, c.reason, c.is_recording, c.is_livestreaming,
				c.started_at, c.created_at,
				p.first_name || ' ' || p.last_name as patient_name,
				COALESCE(e.first_name || ' ' || e.last_name, '') as employee_name
			FROM calls c
			LEFT JOIN users p ON c.patient_id = p.id
			LEFT JOIN users e ON c.employee_id = e.id
			INNER JOIN family_relationships fr ON c.patient_id = fr.patient_id
			WHERE fr.family_member_id = $1 
			AND c.status IN ('active', 'waiting')
			AND p.livestream_consent = true
			ORDER BY c.priority DESC, c.created_at ASC
		`
		args = append(args, userID)
	case "patient":
		// Pacientes solo ven sus propias llamadas
		query = `
			SELECT 
				c.id, c.room_id, c.patient_id, c.employee_id, c.status, 
				c.priority, c.reason, c.is_recording, c.is_livestreaming,
				c.started_at, c.created_at,
				p.first_name || ' ' || p.last_name as patient_name,
				COALESCE(e.first_name || ' ' || e.last_name, '') as employee_name
			FROM calls c
			LEFT JOIN users p ON c.patient_id = p.id
			LEFT JOIN users e ON c.employee_id = e.id
			WHERE c.patient_id = $1 
			AND c.status IN ('active', 'waiting')
			ORDER BY c.created_at DESC
		`
		args = append(args, userID)
	default:
		c.JSON(http.StatusForbidden, gin.H{"error": "Rol no autorizado"})
		return
	}

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener llamadas activas"})
		return
	}
	defer rows.Close()

	var calls []CallInfo
	for rows.Next() {
		var call CallInfo
		err := rows.Scan(
			&call.ID, &call.RoomID, &call.PatientID, &call.EmployeeID,
			&call.Status, &call.Priority, &call.Reason,
			&call.IsRecording, &call.IsLivestreaming,
			&call.StartedAt, &call.CreatedAt,
			&call.PatientName, &call.EmployeeName,
		)
		if err != nil {
			continue
		}

		// Obtener conteo de participantes de LiveKit si la llamada está activa
		if call.Status == "active" {
			// Aquí llamaríamos al LiveKit manager para obtener participantes
			// Por ahora lo simulamos
			call.ParticipantCount = 2
		}

		calls = append(calls, call)
	}

	c.JSON(http.StatusOK, gin.H{
		"calls": calls,
		"count": len(calls),
	})
}

// GetCallRecordings obtiene las grabaciones de una llamada o todas las grabaciones según permisos
func (h *CallHandlers) GetCallRecordings(c *gin.Context) {
	userID := c.GetHeader("X-User-ID")
	userRole := c.GetHeader("X-User-Role")
	callID := c.Param("callId")

	if userID == "" || userRole == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}

	var query string
	var args []interface{}

	if callID != "" {
		// Verificar permisos para ver grabaciones de una llamada específica
		hasAccess := h.checkRecordingAccess(userID, userRole, callID)
		if !hasAccess {
			c.JSON(http.StatusForbidden, gin.H{"error": "No autorizado para ver estas grabaciones"})
			return
		}

		query = `
			SELECT id, call_id, recording_url, recording_size_bytes, 
			       duration_seconds, status, storage_type, created_at
			FROM call_recordings
			WHERE call_id = $1 AND status = 'completed'
			ORDER BY created_at DESC
		`
		args = append(args, callID)
	} else {
		// Obtener todas las grabaciones según el rol
		switch userRole {
		case "employee", "admin":
			query = `
				SELECT r.id, r.call_id, r.recording_url, r.recording_size_bytes, 
				       r.duration_seconds, r.status, r.storage_type, r.created_at
				FROM call_recordings r
				WHERE r.status = 'completed'
				ORDER BY r.created_at DESC
				LIMIT 100
			`
		case "family":
			query = `
				SELECT DISTINCT r.id, r.call_id, r.recording_url, r.recording_size_bytes, 
				       r.duration_seconds, r.status, r.storage_type, r.created_at
				FROM call_recordings r
				INNER JOIN calls c ON r.call_id = c.id
				INNER JOIN family_relationships fr ON c.patient_id = fr.patient_id
				WHERE fr.family_member_id = $1 
				AND r.status = 'completed'
				ORDER BY r.created_at DESC
				LIMIT 100
			`
			args = append(args, userID)
		case "patient":
			query = `
				SELECT r.id, r.call_id, r.recording_url, r.recording_size_bytes, 
				       r.duration_seconds, r.status, r.storage_type, r.created_at
				FROM call_recordings r
				INNER JOIN calls c ON r.call_id = c.id
				WHERE c.patient_id = $1 
				AND r.status = 'completed'
				ORDER BY r.created_at DESC
				LIMIT 100
			`
			args = append(args, userID)
		default:
			c.JSON(http.StatusForbidden, gin.H{"error": "Rol no autorizado"})
			return
		}
	}

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener grabaciones"})
		return
	}
	defer rows.Close()

	var recordings []RecordingInfo
	for rows.Next() {
		var rec RecordingInfo
		err := rows.Scan(
			&rec.ID, &rec.CallID, &rec.RecordingURL,
			&rec.RecordingSizeBytes, &rec.DurationSeconds,
			&rec.Status, &rec.StorageType, &rec.CreatedAt,
		)
		if err != nil {
			continue
		}
		recordings = append(recordings, rec)
	}

	c.JSON(http.StatusOK, gin.H{
		"recordings": recordings,
		"count":      len(recordings),
	})
}

// GetLivestreamToken genera un token para ver una llamada en vivo (solo observador)
func (h *CallHandlers) GetLivestreamToken(c *gin.Context) {
	userID := c.GetHeader("X-User-ID")
	userRole := c.GetHeader("X-User-Role")
	callID := c.Param("callId")

	if userID == "" || userRole == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}

	// Verificar que la llamada existe y está activa
	var roomID string
	var isLivestreaming bool
	err := h.db.QueryRow(`
		SELECT room_id, is_livestreaming 
		FROM calls 
		WHERE id = $1 AND status = 'active'
	`, callID).Scan(&roomID, &isLivestreaming)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Llamada no encontrada o no activa"})
		return
	}

	if !isLivestreaming {
		c.JSON(http.StatusForbidden, gin.H{"error": "Esta llamada no permite livestreaming"})
		return
	}

	// Verificar permisos según rol
	hasAccess := h.checkLivestreamAccess(userID, userRole, callID)
	if !hasAccess {
		c.JSON(http.StatusForbidden, gin.H{"error": "No autorizado para ver esta llamada"})
		return
	}

	// Generar token de LiveKit para observador
	// Aquí llamaríamos al LiveKit manager
	// Por ahora devolvemos un token simulado
	token := fmt.Sprintf("livestream_token_%s_%s", callID, userID)

	c.JSON(http.StatusOK, gin.H{
		"token":     token,
		"roomId":    roomID,
		"serverUrl": "wss://livekit.vincula.com",
		"mode":      "observer",
	})
}

// StartCallRecording inicia la grabación de una llamada manualmente
func (h *CallHandlers) StartCallRecording(c *gin.Context) {
	userRole := c.GetHeader("X-User-Role")
	callID := c.Param("callId")

	// Solo empleados y admins pueden iniciar grabaciones manualmente
	if userRole != "employee" && userRole != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "No autorizado"})
		return
	}

	// Actualizar estado de grabación en la base de datos
	_, err := h.db.Exec(`
		UPDATE calls 
		SET is_recording = true, recording_started_at = NOW()
		WHERE id = $1
	`, callID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al iniciar grabación"})
		return
	}

	// Crear registro de grabación
	recordingID := uuid.New().String()
	_, err = h.db.Exec(`
		INSERT INTO call_recordings (id, call_id, status, storage_type, started_at)
		VALUES ($1, $2, 'recording', 'local', NOW())
	`, recordingID, callID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear registro de grabación"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Grabación iniciada",
		"recording_id": recordingID,
	})
}

// Funciones auxiliares para verificación de permisos

func (h *CallHandlers) checkRecordingAccess(userID, userRole, callID string) bool {
	switch userRole {
	case "employee", "admin":
		return true
	case "family":
		// Verificar si el familiar está vinculado al paciente de la llamada
		var count int
		h.db.QueryRow(`
			SELECT COUNT(*) FROM calls c
			INNER JOIN family_relationships fr ON c.patient_id = fr.patient_id
			WHERE c.id = $1 AND fr.family_member_id = $2
		`, callID, userID).Scan(&count)
		return count > 0
	case "patient":
		// Verificar si es el paciente de la llamada
		var count int
		h.db.QueryRow(`
			SELECT COUNT(*) FROM calls 
			WHERE id = $1 AND patient_id = $2
		`, callID, userID).Scan(&count)
		return count > 0
	default:
		return false
	}
}

func (h *CallHandlers) checkLivestreamAccess(userID, userRole, callID string) bool {
	switch userRole {
	case "employee", "admin":
		return true
	case "family":
		// Verificar si el familiar está vinculado al paciente y el paciente dio consentimiento
		var count int
		h.db.QueryRow(`
			SELECT COUNT(*) FROM calls c
			INNER JOIN family_relationships fr ON c.patient_id = fr.patient_id
			INNER JOIN users u ON c.patient_id = u.id
			WHERE c.id = $1 AND fr.family_member_id = $2 AND u.livestream_consent = true
		`, callID, userID).Scan(&count)
		return count > 0
	default:
		return false
	}
}

// NotifyCallStart notifica cuando inicia una llamada que puede ser vista en livestream
func (h *CallHandlers) NotifyCallStart(callID, patientID string) {
	// Obtener familiares vinculados al paciente
	rows, err := h.db.Query(`
		SELECT fr.family_member_id, u.email, u.first_name
		FROM family_relationships fr
		INNER JOIN users u ON fr.family_member_id = u.id
		WHERE fr.patient_id = $1
	`, patientID)
	
	if err != nil {
		return
	}
	defer rows.Close()

	var notifications []map[string]interface{}
	for rows.Next() {
		var familyID, email, firstName string
		if err := rows.Scan(&familyID, &email, &firstName); err != nil {
			continue
		}

		notification := map[string]interface{}{
			"type":       "call_livestream_available",
			"call_id":    callID,
			"patient_id": patientID,
			"message":    "Una videollamada de tu familiar está disponible para ver en vivo",
			"timestamp":  time.Now().Unix(),
		}
		notifications = append(notifications, notification)
	}

	// Aquí enviaríamos las notificaciones por WebSocket
	// Por ahora solo las imprimimos
	if len(notifications) > 0 {
		jsonData, _ := json.Marshal(notifications)
		fmt.Printf("Sending livestream notifications: %s\n", jsonData)
	}
}

