package models

import "time"

type Transaction struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	AccountID   uint      `json:"account_id" gorm:"not null"`
	Account     Account   `json:"account,omitempty" gorm:"foreignKey:AccountID"`
	CategoryID  *uint     `json:"category_id"` // nullable
	Category    *Category `json:"category,omitempty" gorm:"foreignKey:CategoryID"`
	Amount      int64     `json:"amount" gorm:"not null"`    // cents
	Description string    `json:"description" gorm:"not null"`
	Date        string    `json:"date" gorm:"not null"`      // YYYY-MM-DD
	Type        string    `json:"type" gorm:"not null"`      // income, expense
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
