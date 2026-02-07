package models

import "time"

type Transaction struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	AccountID   uint      `json:"account_id" gorm:"not null;index"`
	Account     Account   `json:"account,omitempty" gorm:"foreignKey:AccountID"`
	CategoryID  *uint     `json:"category_id" gorm:"index"`
	Category    *Category `json:"category,omitempty" gorm:"foreignKey:CategoryID"`
	Amount      int64     `json:"amount" gorm:"not null"`
	Description string    `json:"description" gorm:"not null"`
	Date        string    `json:"date" gorm:"not null;index;index:idx_type_date"`
	Type        string    `json:"type" gorm:"not null;index:idx_type_date"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
