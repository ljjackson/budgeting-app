package models

import "time"

type BudgetAllocation struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	Month      string    `json:"month" gorm:"not null;uniqueIndex:idx_month_category"`
	CategoryID uint      `json:"category_id" gorm:"not null;uniqueIndex:idx_month_category"`
	Category   Category  `json:"category,omitempty" gorm:"foreignKey:CategoryID"`
	Amount     int64     `json:"amount" gorm:"not null"` // cents
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}
