package testutil

import (
	"budgetting-app/backend/models"
	"testing"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func SetupTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open test database: %v", err)
	}
	err = db.AutoMigrate(&models.Account{}, &models.Category{}, &models.Transaction{}, &models.BudgetAllocation{})
	if err != nil {
		t.Fatalf("failed to migrate test database: %v", err)
	}
	return db
}
