package database

import (
	"budgetting-app/backend/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func Connect(dbPath string) (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	err = db.AutoMigrate(&models.Account{}, &models.Category{}, &models.Transaction{}, &models.BudgetAllocation{})
	if err != nil {
		return nil, err
	}

	seedCategories(db)
	return db, nil
}

func seedCategories(db *gorm.DB) {
	var count int64
	db.Model(&models.Category{}).Count(&count)
	if count > 0 {
		return
	}

	defaults := []models.Category{
		{Name: "Housing", Colour: "#6366F1"},
		{Name: "Bills & Utilities", Colour: "#EC4899"},
		{Name: "Food & Drink", Colour: "#F59E0B"},
		{Name: "Transport", Colour: "#3B82F6"},
		{Name: "Shopping", Colour: "#8B5CF6"},
		{Name: "Entertainment", Colour: "#EF4444"},
		{Name: "Health", Colour: "#10B981"},
		{Name: "Personal Care", Colour: "#F97316"},
		{Name: "Education", Colour: "#06B6D4"},
		{Name: "Savings", Colour: "#22C55E"},
		{Name: "Salary", Colour: "#14B8A6"},
		{Name: "Subscriptions", Colour: "#A855F7"},
		{Name: "Eating Out", Colour: "#D946EF"},
		{Name: "General", Colour: "#6B7280"},
	}

	db.Create(&defaults)
}
