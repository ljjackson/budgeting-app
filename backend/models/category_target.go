package models

import "time"

type CategoryTarget struct {
	ID            uint      `json:"id" gorm:"primaryKey"`
	CategoryID    uint      `json:"category_id" gorm:"index;not null"`
	Category      Category  `json:"-" gorm:"foreignKey:CategoryID"`
	TargetType    string    `json:"target_type" gorm:"not null"` // monthly_savings | savings_balance | spending_by_date
	TargetAmount  int64     `json:"target_amount" gorm:"not null"` // cents
	TargetDate    *string   `json:"target_date"`                   // YYYY-MM, nullable
	EffectiveFrom string    `json:"effective_from" gorm:"not null"` // YYYY-MM
	EffectiveTo   *string   `json:"effective_to"`                   // YYYY-MM, nullable (null = still active)
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
