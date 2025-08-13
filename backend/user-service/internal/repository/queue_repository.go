package repository

import (
	"time"
	"user-service/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type QueueRepository interface {
	CreateQueueEntry(entry *domain.QueueEntry) error
	GetQueueEntries() ([]domain.QueueEntry, error)
	GetQueueEntryByID(id uuid.UUID) (*domain.QueueEntry, error)
	UpdateQueueEntry(entry *domain.QueueEntry) error
	DeleteQueueEntry(id uuid.UUID) error
	GetQueueByStatus(status string) ([]domain.QueueEntry, error)
	AssignQueueEntry(entryID, employeeID uuid.UUID) error
	GetNextQueueEntry() (*domain.QueueEntry, error)

	// Call operations
	CreateCall(call *domain.Call) error
	GetActiveCalls() ([]domain.Call, error)
	GetCallByID(id uuid.UUID) (*domain.Call, error)
	UpdateCall(call *domain.Call) error
	EndCall(callID uuid.UUID) error
}

type queueRepository struct {
	db *gorm.DB
}

func NewQueueRepository(db *gorm.DB) QueueRepository {
	return &queueRepository{db: db}
}

// Queue Entry operations
func (r *queueRepository) CreateQueueEntry(entry *domain.QueueEntry) error {
	entry.CreatedAt = time.Now()
	entry.UpdatedAt = time.Now()
	return r.db.Create(entry).Error
}

func (r *queueRepository) GetQueueEntries() ([]domain.QueueEntry, error) {
	var entries []domain.QueueEntry
	err := r.db.Preload("Patient").Preload("Employee").
		Where("status = ?", "waiting").
		Order("priority ASC, created_at ASC").
		Find(&entries).Error
	return entries, err
}

func (r *queueRepository) GetQueueEntryByID(id uuid.UUID) (*domain.QueueEntry, error) {
	var entry domain.QueueEntry
	err := r.db.Preload("Patient").Preload("Employee").
		First(&entry, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &entry, nil
}

func (r *queueRepository) UpdateQueueEntry(entry *domain.QueueEntry) error {
	entry.UpdatedAt = time.Now()
	return r.db.Save(entry).Error
}

func (r *queueRepository) DeleteQueueEntry(id uuid.UUID) error {
	return r.db.Delete(&domain.QueueEntry{}, "id = ?", id).Error
}

func (r *queueRepository) GetQueueByStatus(status string) ([]domain.QueueEntry, error) {
	var entries []domain.QueueEntry
	err := r.db.Preload("Patient").Preload("Employee").
		Where("status = ?", status).
		Order("priority ASC, created_at ASC").
		Find(&entries).Error
	return entries, err
}

func (r *queueRepository) AssignQueueEntry(entryID, employeeID uuid.UUID) error {
	now := time.Now()
	return r.db.Model(&domain.QueueEntry{}).
		Where("id = ?", entryID).
		Updates(map[string]interface{}{
			"assigned_to": employeeID,
			"assigned_at": now,
			"status":      "assigned",
			"updated_at":  now,
		}).Error
}

func (r *queueRepository) GetNextQueueEntry() (*domain.QueueEntry, error) {
	var entry domain.QueueEntry
	err := r.db.Preload("Patient").
		Where("status = ?", "waiting").
		Order("priority ASC, created_at ASC").
		First(&entry).Error
	if err != nil {
		return nil, err
	}
	return &entry, nil
}

// Call operations
func (r *queueRepository) CreateCall(call *domain.Call) error {
	call.StartedAt = time.Now()
	if err := r.db.Create(call).Error; err != nil {
		return err
	}
	// Cargar las relaciones después de crear
	return r.db.Preload("Patient").Preload("Employee").Preload("QueueEntry").First(call, call.ID).Error
}

func (r *queueRepository) GetActiveCalls() ([]domain.Call, error) {
	var calls []domain.Call
	err := r.db.Preload("Patient").Preload("Employee").Preload("QueueEntry").
		Where("status = ?", "active").
		Order("started_at DESC").
		Find(&calls).Error
	return calls, err
}

func (r *queueRepository) GetCallByID(id uuid.UUID) (*domain.Call, error) {
	var call domain.Call
	err := r.db.Preload("Patient").Preload("Employee").Preload("QueueEntry").
		First(&call, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &call, nil
}

func (r *queueRepository) UpdateCall(call *domain.Call) error {
	return r.db.Save(call).Error
}

func (r *queueRepository) EndCall(callID uuid.UUID) error {
	now := time.Now()
	return r.db.Model(&domain.Call{}).
		Where("id = ?", callID).
		Updates(map[string]interface{}{
			"status":   "ended",
			"ended_at": now,
		}).Error
}
