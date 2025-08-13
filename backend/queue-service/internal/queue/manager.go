package queue

import (
	"context"
	"fmt"
	"time"
)

// Simulando una estructura simple para redis
type RedisClient struct {
	data map[string]interface{}
}

type QueueManager struct {
	client *RedisClient
	ctx    context.Context
}

type QueueEntry struct {
	ID               string      `json:"id"`
	PatientID        string      `json:"patient_id"`
	PatientInfo      PatientInfo `json:"patient_info"`
	Priority         int         `json:"priority"` // 1=Urgent, 2=Normal, 3=Routine
	Reason           string      `json:"reason"`
	WaitingSince     time.Time   `json:"waiting_since"`
	EstimatedWait    int         `json:"estimated_wait"` // minutes
	Position         int         `json:"position"`
	Status           string      `json:"status"` // waiting, assigned, active, completed
	AssignedEmployee string      `json:"assigned_employee,omitempty"`
}

type PatientInfo struct {
	FirstName           string `json:"first_name"`
	LastName            string `json:"last_name"`
	MedicalRecordNumber string `json:"medical_record_number"`
	Age                 int    `json:"age"`
	EmergencyContact    string `json:"emergency_contact,omitempty"`
}

type ActiveCall struct {
	ID           string      `json:"id"`
	RoomID       string      `json:"room_id"`
	PatientID    string      `json:"patient_id"`
	EmployeeID   string      `json:"employee_id"`
	StartedAt    time.Time   `json:"started_at"`
	PatientInfo  PatientInfo `json:"patient_info"`
	EmployeeName string      `json:"employee_name"`
}

const (
	QUEUE_KEY        = "healthcare:queue"
	ACTIVE_CALLS_KEY = "healthcare:active_calls"
)

func NewQueueManager() (*QueueManager, error) {
	client := &RedisClient{
		data: make(map[string]interface{}),
	}

	return &QueueManager{
		client: client,
		ctx:    context.Background(),
	}, nil
}

// AddToQueue agrega un paciente a la cola de espera
func (qm *QueueManager) AddToQueue(entry QueueEntry) error {
	// Generar ID único simple
	entry.ID = fmt.Sprintf("entry_%d", time.Now().UnixNano())
	entry.WaitingSince = time.Now()
	entry.Status = "waiting"

	// Obtener cola actual
	queue := qm.getQueueFromStorage()

	// Calcular posición y tiempo estimado
	entry.Position = len(queue) + 1
	entry.EstimatedWait = qm.calculateEstimatedWait(entry.Priority, entry.Position)

	// Agregar a la cola
	queue = append(queue, entry)

	// Ordenar por prioridad y tiempo
	qm.sortQueue(queue)

	// Guardar cola actualizada
	return qm.saveQueueToStorage(queue)
}

// GetQueue obtiene toda la cola ordenada
func (qm *QueueManager) GetQueue() ([]QueueEntry, error) {
	queue := qm.getQueueFromStorage()
	qm.updatePositions(queue)
	return queue, nil
}

// AssignNextCall asigna el siguiente paciente en cola a un empleado
func (qm *QueueManager) AssignNextCall(employeeID string) (*QueueEntry, error) {
	queue := qm.getQueueFromStorage()

	if len(queue) == 0 {
		return nil, fmt.Errorf("no patients in queue")
	}

	// Tomar el primero en la cola
	entry := queue[0]
	entry.Status = "assigned"
	entry.AssignedEmployee = employeeID

	// Remover de la cola
	queue = queue[1:]
	qm.updatePositions(queue)
	qm.saveQueueToStorage(queue)

	return &entry, nil
}

// AssignSpecificCall asigna un paciente específico a un empleado
func (qm *QueueManager) AssignSpecificCall(entryID, employeeID string) (*QueueEntry, error) {
	queue := qm.getQueueFromStorage()

	for i, entry := range queue {
		if entry.ID == entryID {
			entry.Status = "assigned"
			entry.AssignedEmployee = employeeID

			// Remover de la cola
			queue = append(queue[:i], queue[i+1:]...)
			qm.updatePositions(queue)
			qm.saveQueueToStorage(queue)

			return &entry, nil
		}
	}

	return nil, fmt.Errorf("entry not found")
}

// StartCall mueve una llamada asignada a activa
func (qm *QueueManager) StartCall(callID, roomID string, entry QueueEntry, employeeName string) error {
	activeCall := ActiveCall{
		ID:           callID,
		RoomID:       roomID,
		PatientID:    entry.PatientID,
		EmployeeID:   entry.AssignedEmployee,
		StartedAt:    time.Now(),
		PatientInfo:  entry.PatientInfo,
		EmployeeName: employeeName,
	}

	activeCalls := qm.getActiveCallsFromStorage()
	activeCalls = append(activeCalls, activeCall)

	return qm.saveActiveCallsToStorage(activeCalls)
}

// EndCall termina una llamada activa
func (qm *QueueManager) EndCall(callID string) error {
	activeCalls := qm.getActiveCallsFromStorage()

	for i, call := range activeCalls {
		if call.ID == callID {
			activeCalls = append(activeCalls[:i], activeCalls[i+1:]...)
			break
		}
	}

	return qm.saveActiveCallsToStorage(activeCalls)
}

// GetActiveCalls obtiene todas las llamadas activas
func (qm *QueueManager) GetActiveCalls() ([]ActiveCall, error) {
	return qm.getActiveCallsFromStorage(), nil
}

// RemoveFromQueue remueve un paciente específico de la cola
func (qm *QueueManager) RemoveFromQueue(entryID string) error {
	queue := qm.getQueueFromStorage()

	for i, entry := range queue {
		if entry.ID == entryID {
			queue = append(queue[:i], queue[i+1:]...)
			break
		}
	}

	qm.updatePositions(queue)
	return qm.saveQueueToStorage(queue)
}

// GetQueuePosition obtiene la posición actual de un paciente en la cola
func (qm *QueueManager) GetQueuePosition(patientID string) (int, error) {
	queue := qm.getQueueFromStorage()

	for _, entry := range queue {
		if entry.PatientID == patientID {
			return entry.Position, nil
		}
	}

	return 0, fmt.Errorf("patient not found in queue")
}

// GetPatientQueueStatus obtiene el estado completo de un paciente en la cola
func (qm *QueueManager) GetPatientQueueStatus(patientID string) (*QueueEntry, error) {
	queue := qm.getQueueFromStorage()

	for _, entry := range queue {
		if entry.PatientID == patientID {
			return &entry, nil
		}
	}

	return nil, fmt.Errorf("patient not found in queue")
}

// Helper functions
func (qm *QueueManager) getQueueFromStorage() []QueueEntry {
	if data, exists := qm.client.data[QUEUE_KEY]; exists {
		if queue, ok := data.([]QueueEntry); ok {
			return queue
		}
	}
	return []QueueEntry{}
}

func (qm *QueueManager) saveQueueToStorage(queue []QueueEntry) error {
	qm.client.data[QUEUE_KEY] = queue
	return nil
}

func (qm *QueueManager) getActiveCallsFromStorage() []ActiveCall {
	if data, exists := qm.client.data[ACTIVE_CALLS_KEY]; exists {
		if calls, ok := data.([]ActiveCall); ok {
			return calls
		}
	}
	return []ActiveCall{}
}

func (qm *QueueManager) saveActiveCallsToStorage(calls []ActiveCall) error {
	qm.client.data[ACTIVE_CALLS_KEY] = calls
	return nil
}

func (qm *QueueManager) calculateEstimatedWait(priority, position int) int {
	avgCallDuration := 15

	priorityFactor := 1.0
	switch priority {
	case 1: // Urgente
		priorityFactor = 0.5
	case 2: // Normal
		priorityFactor = 1.0
	case 3: // Rutina
		priorityFactor = 1.5
	}

	estimatedMinutes := float64(position*avgCallDuration) * priorityFactor
	return int(estimatedMinutes)
}

func (qm *QueueManager) sortQueue(queue []QueueEntry) {
	// Implementación simple de ordenamiento por prioridad y tiempo
	for i := 0; i < len(queue)-1; i++ {
		for j := i + 1; j < len(queue); j++ {
			// Prioridad más baja = mayor urgencia (1 es más urgente que 3)
			if queue[i].Priority > queue[j].Priority {
				queue[i], queue[j] = queue[j], queue[i]
			} else if queue[i].Priority == queue[j].Priority {
				// Si tienen la misma prioridad, ordenar por tiempo de espera
				if queue[i].WaitingSince.After(queue[j].WaitingSince) {
					queue[i], queue[j] = queue[j], queue[i]
				}
			}
		}
	}
}

func (qm *QueueManager) updatePositions(queue []QueueEntry) {
	for i := range queue {
		queue[i].Position = i + 1
		queue[i].EstimatedWait = qm.calculateEstimatedWait(queue[i].Priority, queue[i].Position)
	}
}
