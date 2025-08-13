package domain

import (
	"time"

	"github.com/google/uuid"
)

type UserRole string

const (
	RolePatient  UserRole = "patient"
	RoleEmployee UserRole = "employee"
	RoleFamily   UserRole = "family"
	RoleAdmin    UserRole = "admin"
)

type User struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	Email        string    `json:"email" gorm:"uniqueIndex"`
	PasswordHash string    `json:"-"`
	FirstName    string    `json:"first_name"`
	LastName     string    `json:"last_name"`
	Role         UserRole  `json:"role"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
