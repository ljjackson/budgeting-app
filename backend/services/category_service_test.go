package services

import (
	"budgetting-app/backend/models"
	"budgetting-app/backend/testutil"
	"errors"
	"testing"

	"gorm.io/gorm"
)

func setupCategoryTest(t *testing.T) (*CategoryService, *gorm.DB) {
	t.Helper()
	db := testutil.SetupTestDB(t)
	svc := NewCategoryService(db)
	return svc, db
}

func TestCategoryService_CRUD(t *testing.T) {
	svc, _ := setupCategoryTest(t)

	// Create
	cat := &models.Category{Name: "Food", Colour: "#FF0000"}
	if err := svc.Create(cat); err != nil {
		t.Fatalf("create failed: %v", err)
	}
	if cat.ID == 0 {
		t.Fatal("expected non-zero ID after create")
	}

	// List
	cats, err := svc.List()
	if err != nil {
		t.Fatalf("list failed: %v", err)
	}
	if len(cats) != 1 {
		t.Fatalf("expected 1 category, got %d", len(cats))
	}
	if cats[0].Name != "Food" {
		t.Errorf("expected name Food, got %s", cats[0].Name)
	}

	// Update
	updated, err := svc.Update(cat.ID, "Groceries", "#00FF00")
	if err != nil {
		t.Fatalf("update failed: %v", err)
	}
	if updated.Name != "Groceries" {
		t.Errorf("expected name Groceries, got %s", updated.Name)
	}
	if updated.Colour != "#00FF00" {
		t.Errorf("expected colour #00FF00, got %s", updated.Colour)
	}

	// Delete
	if err := svc.Delete(cat.ID); err != nil {
		t.Fatalf("delete failed: %v", err)
	}
	cats, _ = svc.List()
	if len(cats) != 0 {
		t.Errorf("expected 0 categories after delete, got %d", len(cats))
	}
}

func TestCategoryService_DeleteWithTransactions(t *testing.T) {
	svc, db := setupCategoryTest(t)

	cat := &models.Category{Name: "Food", Colour: "#FF0000"}
	svc.Create(cat)

	account := models.Account{Name: "Test", Type: "checking"}
	db.Create(&account)
	db.Create(&models.Transaction{
		AccountID:   account.ID,
		CategoryID:  &cat.ID,
		Amount:      1000,
		Description: "Groceries",
		Date:        "2024-01-15",
		Type:        "expense",
	})

	err := svc.Delete(cat.ID)
	if !errors.Is(err, ErrCategoryHasTransactions) {
		t.Errorf("expected ErrCategoryHasTransactions, got %v", err)
	}
}

func TestCategoryService_DeleteWithBudgetAllocations(t *testing.T) {
	svc, db := setupCategoryTest(t)

	cat := &models.Category{Name: "Food", Colour: "#FF0000"}
	svc.Create(cat)

	db.Create(&models.BudgetAllocation{
		Month:      "2024-01",
		CategoryID: cat.ID,
		Amount:     5000,
	})

	err := svc.Delete(cat.ID)
	if !errors.Is(err, ErrCategoryHasTransactions) {
		t.Errorf("expected ErrCategoryHasTransactions, got %v", err)
	}
}

func TestCategoryService_DeleteWithTargets(t *testing.T) {
	svc, db := setupCategoryTest(t)

	cat := &models.Category{Name: "Food", Colour: "#FF0000"}
	svc.Create(cat)

	db.Create(&models.CategoryTarget{
		CategoryID:    cat.ID,
		TargetType:    "monthly_savings",
		TargetAmount:  10000,
		EffectiveFrom: "2024-01",
	})

	err := svc.Delete(cat.ID)
	if !errors.Is(err, ErrCategoryHasTransactions) {
		t.Errorf("expected ErrCategoryHasTransactions, got %v", err)
	}
}

func TestCategoryService_DeleteNotFound(t *testing.T) {
	svc, _ := setupCategoryTest(t)

	err := svc.Delete(999)
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Errorf("expected ErrRecordNotFound, got %v", err)
	}
}

func TestCategoryService_UpdateNotFound(t *testing.T) {
	svc, _ := setupCategoryTest(t)

	_, err := svc.Update(999, "Nope", "#000000")
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Errorf("expected ErrRecordNotFound, got %v", err)
	}
}

func TestCategoryService_ListOrdering(t *testing.T) {
	svc, _ := setupCategoryTest(t)

	svc.Create(&models.Category{Name: "Zebra", Colour: "#000000"})
	svc.Create(&models.Category{Name: "Apple", Colour: "#000000"})
	svc.Create(&models.Category{Name: "Mango", Colour: "#000000"})

	cats, err := svc.List()
	if err != nil {
		t.Fatalf("list failed: %v", err)
	}
	if len(cats) != 3 {
		t.Fatalf("expected 3 categories, got %d", len(cats))
	}
	if cats[0].Name != "Apple" || cats[1].Name != "Mango" || cats[2].Name != "Zebra" {
		t.Errorf("expected alphabetical order, got %s, %s, %s", cats[0].Name, cats[1].Name, cats[2].Name)
	}
}
