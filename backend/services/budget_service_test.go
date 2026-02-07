package services

import (
	"budgetting-app/backend/models"
	"budgetting-app/backend/testutil"
	"testing"
)

func setupBudgetTest(t *testing.T) (*BudgetService, *models.Account, *models.Category) {
	t.Helper()
	db := testutil.SetupTestDB(t)
	svc := NewBudgetService(db)

	account := models.Account{Name: "Test", Type: "checking"}
	db.Create(&account)
	category := models.Category{Name: "Food", Colour: "#FF0000"}
	db.Create(&category)

	return svc, &account, &category
}

func TestBudgetService_GetBudget(t *testing.T) {
	svc, account, category := setupBudgetTest(t)

	// Add income
	svc.db.Create(&models.Transaction{
		AccountID: account.ID, Amount: 300000, Description: "Salary",
		Date: "2024-01-15", Type: "income",
	})

	// Add expense
	svc.db.Create(&models.Transaction{
		AccountID: account.ID, CategoryID: &category.ID,
		Amount: 5000, Description: "Groceries",
		Date: "2024-01-20", Type: "expense",
	})

	// Allocate budget
	svc.AllocateBudget("2024-01", category.ID, 10000)

	resp, err := svc.GetBudget("2024-01")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Income != 300000 {
		t.Errorf("expected income 300000, got %d", resp.Income)
	}
	if resp.TotalAssigned != 10000 {
		t.Errorf("expected total assigned 10000, got %d", resp.TotalAssigned)
	}
	if resp.ReadyToAssign != 290000 {
		t.Errorf("expected ready to assign 290000, got %d", resp.ReadyToAssign)
	}

	// Find the category row
	var found bool
	for _, row := range resp.Categories {
		if row.CategoryID == category.ID {
			found = true
			if row.Assigned != 10000 {
				t.Errorf("expected assigned 10000, got %d", row.Assigned)
			}
			if row.Activity != 5000 {
				t.Errorf("expected activity 5000, got %d", row.Activity)
			}
			if row.Available != 5000 {
				t.Errorf("expected available 5000, got %d", row.Available)
			}
		}
	}
	if !found {
		t.Error("category not found in budget response")
	}
}

func TestBudgetService_Rollover(t *testing.T) {
	svc, account, category := setupBudgetTest(t)

	// January: assign 10000, spend 3000
	svc.AllocateBudget("2024-01", category.ID, 10000)
	svc.db.Create(&models.Transaction{
		AccountID: account.ID, CategoryID: &category.ID,
		Amount: 3000, Description: "Jan expense",
		Date: "2024-01-15", Type: "expense",
	})

	// February: assign 5000, spend 2000
	svc.AllocateBudget("2024-02", category.ID, 5000)
	svc.db.Create(&models.Transaction{
		AccountID: account.ID, CategoryID: &category.ID,
		Amount: 2000, Description: "Feb expense",
		Date: "2024-02-15", Type: "expense",
	})

	resp, _ := svc.GetBudget("2024-02")
	for _, row := range resp.Categories {
		if row.CategoryID == category.ID {
			// Cumulative assigned: 10000 + 5000 = 15000
			// Cumulative spent: 3000 + 2000 = 5000
			// Available: 15000 - 5000 = 10000
			if row.Available != 10000 {
				t.Errorf("expected available 10000 (with rollover), got %d", row.Available)
			}
			if row.Assigned != 5000 {
				t.Errorf("expected this month's assigned 5000, got %d", row.Assigned)
			}
			if row.Activity != 2000 {
				t.Errorf("expected this month's activity 2000, got %d", row.Activity)
			}
		}
	}
}

func TestBudgetService_UncategorizedExpenses(t *testing.T) {
	svc, account, _ := setupBudgetTest(t)

	svc.db.Create(&models.Transaction{
		AccountID: account.ID, Amount: 1000, Description: "Uncategorized",
		Date: "2024-01-15", Type: "expense",
	})

	resp, _ := svc.GetBudget("2024-01")
	if resp.UncategorizedExpenses != 1 {
		t.Errorf("expected 1 uncategorized expense, got %d", resp.UncategorizedExpenses)
	}
}

func TestBudgetService_AllocateUpsert(t *testing.T) {
	svc, _, category := setupBudgetTest(t)

	// First allocation
	svc.AllocateBudget("2024-01", category.ID, 10000)

	// Upsert same month/category
	svc.AllocateBudget("2024-01", category.ID, 15000)

	var allocs []models.BudgetAllocation
	svc.db.Find(&allocs)
	if len(allocs) != 1 {
		t.Fatalf("expected 1 allocation (upsert), got %d", len(allocs))
	}
	if allocs[0].Amount != 15000 {
		t.Errorf("expected amount 15000 after upsert, got %d", allocs[0].Amount)
	}
}

func TestBudgetService_AverageRounding(t *testing.T) {
	svc, account, category := setupBudgetTest(t)

	// Create expenses over 3 months with total that doesn't divide evenly
	// Total: 100 cents. 100/3 = 33.33... should round to 33
	svc.db.Create(&models.Transaction{
		AccountID: account.ID, CategoryID: &category.ID,
		Amount: 40, Description: "Oct", Date: "2024-10-15", Type: "expense",
	})
	svc.db.Create(&models.Transaction{
		AccountID: account.ID, CategoryID: &category.ID,
		Amount: 30, Description: "Nov", Date: "2024-11-15", Type: "expense",
	})
	svc.db.Create(&models.Transaction{
		AccountID: account.ID, CategoryID: &category.ID,
		Amount: 30, Description: "Dec", Date: "2024-12-15", Type: "expense",
	})

	avg, err := svc.GetCategoryAverage(category.ID, "2025-01")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// 100 / 3 = 33.33 → rounds to 33
	if avg != 33 {
		t.Errorf("expected average 33, got %d", avg)
	}

	// Test rounding up: total 200. 200/3 = 66.67 → rounds to 67
	svc.db.Create(&models.Transaction{
		AccountID: account.ID, CategoryID: &category.ID,
		Amount: 100, Description: "Oct2", Date: "2024-10-16", Type: "expense",
	})
	avg, _ = svc.GetCategoryAverage(category.ID, "2025-01")
	// Now total is 200. 200/3 = 66.67 → rounds to 67
	if avg != 67 {
		t.Errorf("expected average 67, got %d", avg)
	}
}
