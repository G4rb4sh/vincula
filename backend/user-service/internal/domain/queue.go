package domain

import (
	"time"

	"github.com/google/uuid"
)

type QueueEntry struct {
	ID          uuid.UUID  `json:"id" gorm:"type:uuid;default:gen_random_uuid();primary_key"`
	PatientID   uuid.UUID  `json:"patient_id" gorm:"type:uuid;not null"`
	Priority    int        `json:"priority" gorm:"default:3"`       // 1=urgent, 2=high, 3=normal, 4=low
	Status      string     `json:"status" gorm:"default:'waiting'"` // waiting, assigned, completed, cancelled
	Reason      string     `json:"reason"`
	Notes       string     `json:"notes"`
	AssignedTo  *uuid.UUID `json:"assigned_to,omitempty" gorm:"type:uuid"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	AssignedAt  *time.Time `json:"assigned_at,omitempty"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`

	// Relaciones
	Patient  User  `json:"patient" gorm:"foreignKey:PatientID"`
	Employee *User `json:"employee,omitempty" gorm:"foreignKey:AssignedTo"`
}

type Call struct {
	ID            uuid.UUID  `json:"id" gorm:"type:uuid;default:gen_random_uuid();primary_key"`
	QueueEntryID  *uuid.UUID `json:"queue_entry_id,omitempty" gorm:"type:uuid"`
	PatientID     uuid.UUID  `json:"patient_id" gorm:"type:uuid;not null"`
	EmployeeID    uuid.UUID  `json:"employee_id" gorm:"type:uuid;not null"`
	Status        string     `json:"status" gorm:"default:'active'"` // active, ended, cancelled
	StartedAt     time.Time  `json:"started_at"`
	EndedAt       *time.Time `json:"ended_at,omitempty"`
	Duration      *int       `json:"duration,omitempty"` // in seconds
	LiveKitRoomID string     `json:"livekit_room_id" gorm:"column:room_id"`
	RecordingURL  string     `json:"recording_url,omitempty"`
	Notes         string     `json:"notes"`

	// Relaciones
	QueueEntry *QueueEntry `json:"queue_entry,omitempty" gorm:"foreignKey:QueueEntryID"`
	Patient    User        `json:"patient" gorm:"foreignKey:PatientID"`
	Employee   User        `json:"employee" gorm:"foreignKey:EmployeeID"`
}

type CallParticipant struct {
	ID         uuid.UUID  `json:"id" gorm:"type:uuid;default:gen_random_uuid();primary_key"`
	CallID     uuid.UUID  `json:"call_id" gorm:"type:uuid;not null"`
	UserID     uuid.UUID  `json:"user_id" gorm:"type:uuid;not null"`
	Role       string     `json:"role"` // participant, observer
	JoinedAt   time.Time  `json:"joined_at"`
	LeftAt     *time.Time `json:"left_at,omitempty"`
	IsObserver bool       `json:"is_observer" gorm:"default:false"`

	// Relaciones
	Call Call `json:"call" gorm:"foreignKey:CallID"`
	User User `json:"user" gorm:"foreignKey:UserID"`
}
