package handlers

import (
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/livekit/protocol/auth"
)

type LiveKitHandler struct {
	apiKey    string
	apiSecret string
	serverUrl string
}

type TokenRequest struct {
	CallID        string `json:"call_id" binding:"required"`
	ParticipantID string `json:"participant_id" binding:"required"`
	Role          string `json:"role" binding:"required"`
	IsObserver    bool   `json:"is_observer"`
}

func NewLiveKitHandler() *LiveKitHandler {
	apiKey := os.Getenv("LIVEKIT_API_KEY")
	if apiKey == "" {
		apiKey = "devkey" // Local development key matching docker-compose
	}

	apiSecret := os.Getenv("LIVEKIT_API_SECRET")
	if apiSecret == "" {
		apiSecret = "secret" // Local development secret matching docker-compose
	}

	serverUrl := os.Getenv("LIVEKIT_URL")
	if serverUrl == "" {
		// Try to use LAN IP if provided via LIVEKIT_LAN_IP
		lan := os.Getenv("LIVEKIT_LAN_IP")
		if lan != "" {
			serverUrl = "ws://" + lan + ":7880"
		} else {
			serverUrl = "ws://localhost:7880" // Local fallback
		}
	}

	return &LiveKitHandler{
		apiKey:    apiKey,
		apiSecret: apiSecret,
		serverUrl: serverUrl,
	}
}

// GenerateToken - Generar token de acceso para LiveKit
func (h *LiveKitHandler) GenerateToken(c *gin.Context) {
	var req TokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verificar que el usuario está autenticado
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Validar que el participant_id coincida con el usuario autenticado
	if req.ParticipantID != userID.(uuid.UUID).String() {
		c.JSON(http.StatusForbidden, gin.H{"error": "Participant ID mismatch"})
		return
	}

	// Crear el token
	at := auth.NewAccessToken(h.apiKey, h.apiSecret)

	// Configurar el participante
	participantName := req.ParticipantID
	if req.Role == "employee" {
		participantName = "Dr. " + participantName[:8] // Nombre corto para doctores
	} else if req.Role == "patient" {
		participantName = "Patient " + participantName[:8] // Nombre corto para pacientes
	} else if req.IsObserver {
		participantName = "Observer " + participantName[:8] // Nombre corto para observadores
	}

	// Configurar permisos basados en el rol
	grant := &auth.VideoGrant{
		RoomJoin: true,
		Room:     "call_" + req.CallID,
	}

	if req.IsObserver {
		// Los observadores solo pueden ver y escuchar, no publicar
		grant.CanPublish = &[]bool{false}[0]
		grant.CanSubscribe = &[]bool{true}[0]
	} else {
		// Participantes normales pueden publicar y suscribirse
		grant.CanPublish = &[]bool{true}[0]
		grant.CanSubscribe = &[]bool{true}[0]
	}

	at.SetVideoGrant(grant).
		SetIdentity(req.ParticipantID).
		SetName(participantName).
		SetValidFor(time.Hour * 2) // Token válido por 2 horas

	// Generar el token
	token, err := at.ToJWT()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":      token,
		"server_url": h.serverUrl,
		"room_name":  "call_" + req.CallID,
		"identity":   req.ParticipantID,
		"name":       participantName,
	})
}
