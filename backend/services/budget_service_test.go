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

func TestBudgetService_SetCategoryTarget(t *testing.T) {
	svc, _, category := setupBudgetTest(t)

	// Create target
	target, err := svc.SetCategoryTarget(category.ID, "2024-01", "monthly_savings", 50000, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if target.TargetType != "monthly_savings" {
		t.Errorf("expected target_type monthly_savings, got %s", target.TargetType)
	}
	if target.TargetAmount != 50000 {
		t.Errorf("expected target_amount 50000, got %d", target.TargetAmount)
	}
	if target.EffectiveFrom != "2024-01" {
		t.Errorf("expected effective_from 2024-01, got %s", target.EffectiveFrom)
	}

	// Set new target in same month — replaces the old one
	date := "2027-01"
	target2, err := svc.SetCategoryTarget(category.ID, "2024-01", "savings_balance", 400000, &date)
	if err != nil {
		t.Fatalf("unexpected error on replace: %v", err)
	}
	if target2.TargetType != "savings_balance" {
		t.Errorf("expected target_type savings_balance after replace, got %s", target2.TargetType)
	}

	// Verify only one target exists (old one was deleted since same effective_from)
	var targets []models.CategoryTarget
	svc.db.Find(&targets)
	if len(targets) != 1 {
		t.Errorf("expected 1 target after same-month replace, got %d", len(targets))
	}
}

func TestBudgetService_SetCategoryTarget_Versioning(t *testing.T) {
	svc, _, category := setupBudgetTest(t)

	// Set target in January
	svc.SetCategoryTarget(category.ID, "2024-01", "monthly_savings", 50000, nil)

	// Change target in March — should close the January target
	date := "2025-01"
	svc.SetCategoryTarget(category.ID, "2024-03", "savings_balance", 200000, &date)

	var targets []models.CategoryTarget
	svc.db.Order("id").Find(&targets)
	if len(targets) != 2 {
		t.Fatalf("expected 2 targets (versioned), got %d", len(targets))
	}

	// First target: closed at 2024-03
	if targets[0].EffectiveTo == nil || *targets[0].EffectiveTo != "2024-03" {
		t.Errorf("expected first target effective_to 2024-03, got %v", targets[0].EffectiveTo)
	}
	// Second target: open from 2024-03
	if targets[1].EffectiveFrom != "2024-03" {
		t.Errorf("expected second target effective_from 2024-03, got %s", targets[1].EffectiveFrom)
	}
	if targets[1].EffectiveTo != nil {
		t.Errorf("expected second target effective_to nil, got %v", *targets[1].EffectiveTo)
	}

	// January should still see the old target
	resp, _ := svc.GetBudget("2024-01")
	for _, row := range resp.Categories {
		if row.CategoryID == category.ID {
			if row.TargetType == nil || *row.TargetType != "monthly_savings" {
				t.Errorf("expected monthly_savings target in Jan, got %v", row.TargetType)
			}
		}
	}

	// March should see the new target
	resp, _ = svc.GetBudget("2024-03")
	for _, row := range resp.Categories {
		if row.CategoryID == category.ID {
			if row.TargetType == nil || *row.TargetType != "savings_balance" {
				t.Errorf("expected savings_balance target in Mar, got %v", row.TargetType)
			}
		}
	}
}

func TestBudgetService_DeleteCategoryTarget(t *testing.T) {
	svc, _, category := setupBudgetTest(t)

	// Delete non-existent should error
	err := svc.DeleteCategoryTarget(category.ID, "2024-01")
	if err == nil {
		t.Error("expected error when deleting non-existent target")
	}

	// Create target in January and delete in January — should fully delete
	svc.SetCategoryTarget(category.ID, "2024-01", "monthly_savings", 50000, nil)
	err = svc.DeleteCategoryTarget(category.ID, "2024-01")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	var targets []models.CategoryTarget
	svc.db.Find(&targets)
	if len(targets) != 0 {
		t.Errorf("expected 0 targets after same-month delete, got %d", len(targets))
	}
}

func TestBudgetService_DeleteCategoryTarget_ClosesHistory(t *testing.T) {
	svc, _, category := setupBudgetTest(t)

	// Create target in January, delete in March — should close, not delete
	svc.SetCategoryTarget(category.ID, "2024-01", "monthly_savings", 50000, nil)
	err := svc.DeleteCategoryTarget(category.ID, "2024-03")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	var targets []models.CategoryTarget
	svc.db.Find(&targets)
	if len(targets) != 1 {
		t.Fatalf("expected 1 target (closed, not deleted), got %d", len(targets))
	}
	if targets[0].EffectiveTo == nil || *targets[0].EffectiveTo != "2024-03" {
		t.Errorf("expected effective_to 2024-03, got %v", targets[0].EffectiveTo)
	}

	// January should still see the target
	resp, _ := svc.GetBudget("2024-01")
	for _, row := range resp.Categories {
		if row.CategoryID == category.ID {
			if row.TargetType == nil {
				t.Error("expected target visible in January after close")
			}
		}
	}

	// March should NOT see the target
	resp, _ = svc.GetBudget("2024-03")
	for _, row := range resp.Categories {
		if row.CategoryID == category.ID {
			if row.TargetType != nil {
				t.Error("expected no target visible in March after close")
			}
		}
	}
}

func TestBudgetService_GetBudget_MonthlySavingsTarget(t *testing.T) {
	svc, account, category := setupBudgetTest(t)

	svc.db.Create(&models.Transaction{
		AccountID: account.ID, Amount: 300000, Description: "Salary",
		Date: "2024-01-15", Type: "income",
	})

	// Set monthly savings target of 10000 starting Jan
	svc.SetCategoryTarget(category.ID, "2024-01", "monthly_savings", 10000, nil)

	// Partially funded: assigned 6000 of 10000
	svc.AllocateBudget("2024-01", category.ID, 6000)
	resp, _ := svc.GetBudget("2024-01")
	for _, row := range resp.Categories {
		if row.CategoryID == category.ID {
			if row.Underfunded == nil {
				t.Fatal("expected underfunded to be set")
			}
			if *row.Underfunded != 4000 {
				t.Errorf("expected underfunded 4000, got %d", *row.Underfunded)
			}
		}
	}

	// Fully funded: assigned 10000
	svc.AllocateBudget("2024-01", category.ID, 10000)
	resp, _ = svc.GetBudget("2024-01")
	for _, row := range resp.Categories {
		if row.CategoryID == category.ID {
			if *row.Underfunded != 0 {
				t.Errorf("expected underfunded 0 when fully funded, got %d", *row.Underfunded)
			}
		}
	}
}

func TestBudgetService_GetBudget_SavingsBalanceTarget(t *testing.T) {
	svc, account, category := setupBudgetTest(t)

	svc.db.Create(&models.Transaction{
		AccountID: account.ID, Amount: 500000, Description: "Salary",
		Date: "2024-01-15", Type: "income",
	})

	// Target: save 120000 by 2024-04, set in Jan
	date := "2024-04"
	svc.SetCategoryTarget(category.ID, "2024-01", "savings_balance", 120000, &date)

	// Assign 30000 in Jan
	svc.AllocateBudget("2024-01", category.ID, 30000)
	resp, _ := svc.GetBudget("2024-01")
	for _, row := range resp.Categories {
		if row.CategoryID == category.ID {
			if row.Underfunded == nil {
				t.Fatal("expected underfunded to be set")
			}
			// available = 30000, shortfall = 120000-30000 = 90000
			// months remaining from 2024-01 to 2024-04 = 3
			// monthly needed = ceil(90000/3) = 30000
			// underfunded = 30000 - 30000 = 0
			if *row.Underfunded != 0 {
				t.Errorf("expected underfunded 0, got %d", *row.Underfunded)
			}
		}
	}

	// Assign only 20000 instead
	svc.AllocateBudget("2024-01", category.ID, 20000)
	resp, _ = svc.GetBudget("2024-01")
	for _, row := range resp.Categories {
		if row.CategoryID == category.ID {
			// available = 20000, shortfall = 120000-20000 = 100000
			// months remaining = 3, monthly needed = ceil(100000/3) = 33334
			// underfunded = 33334 - 20000 = 13334
			if *row.Underfunded != 13334 {
				t.Errorf("expected underfunded 13334, got %d", *row.Underfunded)
			}
		}
	}
}

func TestBudgetService_GetBudget_SavingsBalanceAlreadyMet(t *testing.T) {
	svc, account, category := setupBudgetTest(t)

	svc.db.Create(&models.Transaction{
		AccountID: account.ID, Amount: 500000, Description: "Salary",
		Date: "2024-01-15", Type: "income",
	})

	date := "2024-06"
	svc.SetCategoryTarget(category.ID, "2024-01", "savings_balance", 10000, &date)

	// Assign more than target
	svc.AllocateBudget("2024-01", category.ID, 15000)
	resp, _ := svc.GetBudget("2024-01")
	for _, row := range resp.Categories {
		if row.CategoryID == category.ID {
			if *row.Underfunded != 0 {
				t.Errorf("expected underfunded 0 when target met, got %d", *row.Underfunded)
			}
		}
	}
}

func TestBudgetService_GetBudget_NoTarget(t *testing.T) {
	svc, account, category := setupBudgetTest(t)

	svc.db.Create(&models.Transaction{
		AccountID: account.ID, Amount: 300000, Description: "Salary",
		Date: "2024-01-15", Type: "income",
	})

	resp, _ := svc.GetBudget("2024-01")
	for _, row := range resp.Categories {
		if row.CategoryID == category.ID {
			if row.TargetType != nil {
				t.Errorf("expected target_type nil, got %v", *row.TargetType)
			}
			if row.TargetAmount != nil {
				t.Errorf("expected target_amount nil, got %v", *row.TargetAmount)
			}
			if row.Underfunded != nil {
				t.Errorf("expected underfunded nil, got %v", *row.Underfunded)
			}
		}
	}
}

func TestBudgetService_GetBudget_TotalUnderfunded(t *testing.T) {
	db := testutil.SetupTestDB(t)
	svc := NewBudgetService(db)

	account := models.Account{Name: "Test", Type: "checking"}
	db.Create(&account)

	cat1 := models.Category{Name: "Food", Colour: "#FF0000"}
	cat2 := models.Category{Name: "Rent", Colour: "#00FF00"}
	db.Create(&cat1)
	db.Create(&cat2)

	db.Create(&models.Transaction{
		AccountID: account.ID, Amount: 500000, Description: "Salary",
		Date: "2024-01-15", Type: "income",
	})

	// cat1: monthly_savings 10000, assigned 3000 → underfunded 7000
	svc.SetCategoryTarget(cat1.ID, "2024-01", "monthly_savings", 10000, nil)
	svc.AllocateBudget("2024-01", cat1.ID, 3000)

	// cat2: monthly_savings 5000, assigned 2000 → underfunded 3000
	svc.SetCategoryTarget(cat2.ID, "2024-01", "monthly_savings", 5000, nil)
	svc.AllocateBudget("2024-01", cat2.ID, 2000)

	resp, _ := svc.GetBudget("2024-01")
	if resp.TotalUnderfunded != 10000 {
		t.Errorf("expected total_underfunded 10000, got %d", resp.TotalUnderfunded)
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
