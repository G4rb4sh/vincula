package livekit

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/livekit/protocol/auth"
	"github.com/livekit/protocol/livekit"
	lksdk "github.com/livekit/server-sdk-go/v2"
)

// UserRole representa los roles de usuario en el sistema
type UserRole string

const (
	RolePatient  UserRole = "patient"
	RoleEmployee UserRole = "employee"
	RoleFamily   UserRole = "family"
	RoleAdmin    UserRole = "admin"
)

type LiveKitManager struct {
	roomClient *lksdk.RoomServiceClient
	apiKey     string
	apiSecret  string
	serverURL  string
}

func NewLiveKitManager(serverURL, apiKey, apiSecret string) *LiveKitManager {
	return &LiveKitManager{
		roomClient: lksdk.NewRoomServiceClient(serverURL, apiKey, apiSecret),
		apiKey:     apiKey,
		apiSecret:  apiSecret,
		serverURL:  serverURL,
	}
}

func (lk *LiveKitManager) CreateCallRoom(callID string, patientID string) (*livekit.Room, error) {
	roomName := fmt.Sprintf("call_%s", callID)

	room, err := lk.roomClient.CreateRoom(context.Background(), &livekit.CreateRoomRequest{
		Name:            roomName,
		MaxParticipants: 10,
		EmptyTimeout:    300, // 5 minutos
		Metadata: fmt.Sprintf(`{
            "type": "healthcare_call",
            "call_id": "%s",
            "patient_id": "%s",
            "created_at": "%s"
        }`, callID, patientID, time.Now().Format(time.RFC3339)),
	})

	if err != nil {
		return nil, fmt.Errorf("failed to create room: %w", err)
	}

	// Iniciar grabación automática de forma asíncrona
	// Esperamos un momento para que la sala esté completamente creada
	go func() {
		time.Sleep(2 * time.Second)
		err := lk.startRecording(roomName)
		if err != nil {
			fmt.Printf("Error starting automatic recording for room %s: %v\n", roomName, err)
		} else {
			fmt.Printf("Automatic recording started successfully for room %s\n", roomName)
		}
	}()

	return room, nil
}

func (lk *LiveKitManager) GenerateAccessToken(roomName, participantID string, role UserRole) (string, error) {
	at := auth.NewAccessToken(lk.apiKey, lk.apiSecret)

	grant := &auth.VideoGrant{
		RoomJoin: true,
		Room:     roomName,
	}

	// Configurar permisos según rol
	switch role {
	case RolePatient, RoleEmployee:
		grant.CanPublish = true
		grant.CanSubscribe = true
		grant.CanPublishData = true

	case RoleFamily:
		// Observadores silenciosos
		grant.CanPublish = false
		grant.CanSubscribe = true
		grant.CanPublishData = false
		grant.Hidden = true // No aparecen en lista de participantes

	case RoleAdmin:
		grant.CanPublish = true
		grant.CanSubscribe = true
		grant.CanPublishData = true
		grant.RoomAdmin = true
		grant.RoomRecord = true
	}

	at.SetVideoGrant(grant).
		SetIdentity(participantID).
		SetValidFor(2 * time.Hour). // Token válido por 2 horas
		SetMetadata(fmt.Sprintf(`{"role":"%s","patient_access":true}`, role))

	return at.ToJWT()
}

func (lk *LiveKitManager) startRecording(roomName string) error {
	egressClient := lksdk.NewEgressClient(lk.serverURL, lk.apiKey, lk.apiSecret)

	// Determinar tipo de almacenamiento basado en configuración
	useS3 := getEnv("USE_S3_STORAGE", "false") == "true"
	var output *livekit.EncodedFileOutput

	// Almacenamiento local por ahora (S3 se puede configurar después)
	recordingsDir := getEnv("RECORDINGS_DIR", "/var/recordings")
	filePath := fmt.Sprintf("%s/%s/%d.mp4", recordingsDir, roomName, time.Now().Unix())
	output = &livekit.EncodedFileOutput{
		FileType: livekit.EncodedFileType_MP4,
		Filepath: filePath,
	}
	
	// Nota: Para S3, se necesita configurar el output con la estructura correcta según la API de LiveKit
	_ = useS3 // Ignorar por ahora

	// Usar la estructura correcta para RoomCompositeEgressRequest
	width := int32(1280)
	height := int32(720)
	framerate := int32(30)
	videoBitrate := int32(1500)
	audioBitrate := int32(128)
	
	egress, err := egressClient.StartRoomCompositeEgress(context.Background(), &livekit.RoomCompositeEgressRequest{
		RoomName: roomName,
		Layout:   "grid",
		Output:   &livekit.RoomCompositeEgressRequest_File{File: output},
		AudioOnly: false,
		VideoOnly: false,
		CustomBaseUrl: "",
		VideoCodec: livekit.VideoCodec_H264_MAIN,
		AudioCodec: livekit.AudioCodec_AAC,
		Width:     width,
		Height:    height,
		Framerate: framerate,
		VideoBitrate: videoBitrate,
		AudioBitrate: audioBitrate,
	})

	if err == nil && egress != nil {
		fmt.Printf("Recording started with egress ID: %s\n", egress.EgressId)
	}

	return err
}

// EndCall termina una sala de llamada
func (lk *LiveKitManager) EndCall(roomName string) error {
	_, err := lk.roomClient.DeleteRoom(context.Background(), &livekit.DeleteRoomRequest{
		Room: roomName,
	})
	return err
}

// GetRoomInfo obtiene información de una sala activa
func (lk *LiveKitManager) GetRoomInfo(roomName string) (*livekit.Room, error) {
	rooms, err := lk.roomClient.ListRooms(context.Background(), &livekit.ListRoomsRequest{
		Names: []string{roomName},
	})
	if err != nil {
		return nil, err
	}
	
	if len(rooms.Rooms) == 0 {
		return nil, fmt.Errorf("room not found")
	}
	
	return rooms.Rooms[0], nil
}

// GetParticipants obtiene los participantes de una sala
func (lk *LiveKitManager) GetParticipants(roomName string) ([]*livekit.ParticipantInfo, error) {
	participants, err := lk.roomClient.ListParticipants(context.Background(), &livekit.ListParticipantsRequest{
		Room: roomName,
	})
	if err != nil {
		return nil, err
	}
	
	return participants.Participants, nil
}

// GetActiveRooms obtiene todas las salas activas
func (lk *LiveKitManager) GetActiveRooms() ([]*livekit.Room, error) {
	rooms, err := lk.roomClient.ListRooms(context.Background(), &livekit.ListRoomsRequest{})
	if err != nil {
		return nil, err
	}
	return rooms.Rooms, nil
}

// StopRecording detiene la grabación de una sala
func (lk *LiveKitManager) StopRecording(egressID string) error {
	egressClient := lksdk.NewEgressClient(lk.serverURL, lk.apiKey, lk.apiSecret)
	_, err := egressClient.StopEgress(context.Background(), &livekit.StopEgressRequest{
		EgressId: egressID,
	})
	return err
}

// RemoveParticipant remueve un participante de la sala
func (lk *LiveKitManager) RemoveParticipant(roomName, participantID string) error {
	_, err := lk.roomClient.RemoveParticipant(context.Background(), &livekit.RoomParticipantIdentity{
		Room:     roomName,
		Identity: participantID,
	})
	return err
}

// getEnv obtiene una variable de entorno con valor por defecto
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
