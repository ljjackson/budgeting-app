package services

import (
	"budgetting-app/backend/models"
	"budgetting-app/backend/testutil"
	"testing"
)

func setupReportTest(t *testing.T) (*ReportService, *models.Account, *models.Category) {
	t.Helper()
	db := testutil.SetupTestDB(t)
	svc := NewReportService(db)

	account := models.Account{Name: "Checking", Type: "checking"}
	db.Create(&account)
	category := models.Category{Name: "Food", Colour: "#FF0000"}
	db.Create(&category)

	return svc, &account, &category
}

func TestReportService_ByCategory_Empty(t *testing.T) {
	svc, _, _ := setupReportTest(t)

	results, err := svc.ByCategory(ReportParams{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(results) != 0 {
		t.Errorf("expected 0 results, got %d", len(results))
	}
}

func TestReportService_ByCategory_Aggregation(t *testing.T) {
	svc, account, category := setupReportTest(t)

	// Create transactions
	svc.db.Create(&models.Transaction{
		AccountID: account.ID, CategoryID: &category.ID,
		Amount: 5000, Description: "Groceries",
		Date: "2024-01-15", Type: "expense",
	})
	svc.db.Create(&models.Transaction{
		AccountID: account.ID, CategoryID: &category.ID,
		Amount: 3000, Description: "Snacks",
		Date: "2024-01-20", Type: "expense",
	})

	results, err := svc.ByCategory(ReportParams{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(results) != 1 {
		t.Fatalf("expected 1 category group, got %d", len(results))
	}
	if results[0].Total != 8000 {
		t.Errorf("expected total 8000, got %d", results[0].Total)
	}
	if results[0].Count != 2 {
		t.Errorf("expected count 2, got %d", results[0].Count)
	}
	if results[0].CategoryName == nil || *results[0].CategoryName != "Food" {
		t.Error("expected category name Food")
	}
}

func TestReportService_ByCategory_DateFilter(t *testing.T) {
	svc, account, category := setupReportTest(t)

	svc.db.Create(&models.Transaction{
		AccountID: account.ID, CategoryID: &category.ID,
		Amount: 5000, Description: "January",
		Date: "2024-01-15", Type: "expense",
	})
	svc.db.Create(&models.Transaction{
		AccountID: account.ID, CategoryID: &category.ID,
		Amount: 3000, Description: "February",
		Date: "2024-02-15", Type: "expense",
	})

	results, err := svc.ByCategory(ReportParams{
		DateFrom: "2024-02-01",
		DateTo:   "2024-02-28",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(results) != 1 {
		t.Fatalf("expected 1 result, got %d", len(results))
	}
	if results[0].Total != 3000 {
		t.Errorf("expected total 3000, got %d", results[0].Total)
	}
}

func TestReportService_ByCategory_TypeFilter(t *testing.T) {
	svc, account, category := setupReportTest(t)

	svc.db.Create(&models.Transaction{
		AccountID: account.ID, CategoryID: &category.ID,
		Amount: 100000, Description: "Salary",
		Date: "2024-01-15", Type: "income",
	})
	svc.db.Create(&models.Transaction{
		AccountID: account.ID, CategoryID: &category.ID,
		Amount: 5000, Description: "Groceries",
		Date: "2024-01-20", Type: "expense",
	})

	results, err := svc.ByCategory(ReportParams{Type: "expense"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(results) != 1 {
		t.Fatalf("expected 1 result, got %d", len(results))
	}
	if results[0].Total != 5000 {
		t.Errorf("expected total 5000, got %d", results[0].Total)
	}
}

func TestReportService_ByAccount_Empty(t *testing.T) {
	svc, _, _ := setupReportTest(t)

	results, err := svc.ByAccount(ReportParams{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(results) != 0 {
		t.Errorf("expected 0 results, got %d", len(results))
	}
}

func TestReportService_ByAccount_Aggregation(t *testing.T) {
	svc, account, category := setupReportTest(t)

	svc.db.Create(&models.Transaction{
		AccountID: account.ID, CategoryID: &category.ID,
		Amount: 5000, Description: "Groceries",
		Date: "2024-01-15", Type: "expense",
	})
	svc.db.Create(&models.Transaction{
		AccountID: account.ID, CategoryID: &category.ID,
		Amount: 3000, Description: "Snacks",
		Date: "2024-01-20", Type: "expense",
	})

	results, err := svc.ByAccount(ReportParams{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(results) != 1 {
		t.Fatalf("expected 1 account group, got %d", len(results))
	}
	if results[0].Total != 8000 {
		t.Errorf("expected total 8000, got %d", results[0].Total)
	}
	if results[0].Count != 2 {
		t.Errorf("expected count 2, got %d", results[0].Count)
	}
	if results[0].AccountName != "Checking" {
		t.Errorf("expected account name Checking, got %s", results[0].AccountName)
	}
}

func TestReportService_ByAccount_DateFilter(t *testing.T) {
	svc, account, category := setupReportTest(t)

	svc.db.Create(&models.Transaction{
		AccountID: account.ID, CategoryID: &category.ID,
		Amount: 5000, Description: "January",
		Date: "2024-01-15", Type: "expense",
	})
	svc.db.Create(&models.Transaction{
		AccountID: account.ID, CategoryID: &category.ID,
		Amount: 3000, Description: "March",
		Date: "2024-03-15", Type: "expense",
	})

	results, err := svc.ByAccount(ReportParams{
		DateFrom: "2024-03-01",
		DateTo:   "2024-03-31",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(results) != 1 {
		t.Fatalf("expected 1 result, got %d", len(results))
	}
	if results[0].Total != 3000 {
		t.Errorf("expected total 3000, got %d", results[0].Total)
	}
}

func TestReportService_UncategorizedTransactions(t *testing.T) {
	svc, account, _ := setupReportTest(t)

	// Transaction with no category
	svc.db.Create(&models.Transaction{
		AccountID:   account.ID,
		Amount:      2000,
		Description: "Uncategorized",
		Date:        "2024-01-15",
		Type:        "expense",
	})

	results, err := svc.ByCategory(ReportParams{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(results) != 1 {
		t.Fatalf("expected 1 result, got %d", len(results))
	}
	if results[0].CategoryID != nil {
		t.Errorf("expected nil category_id for uncategorized, got %v", results[0].CategoryID)
	}
	if results[0].Total != 2000 {
		t.Errorf("expected total 2000, got %d", results[0].Total)
	}
}
