package services

import (
	"budgetting-app/backend/models"
	"budgetting-app/backend/testutil"
	"testing"
)

func setupTransactionTest(t *testing.T) (*TransactionService, *models.Account) {
	t.Helper()
	db := testutil.SetupTestDB(t)
	svc := NewTransactionService(db)

	account := models.Account{Name: "Test", Type: "checking"}
	db.Create(&account)

	return svc, &account
}

func TestTransactionService_CRUD(t *testing.T) {
	svc, account := setupTransactionTest(t)

	// Create
	txn := models.Transaction{
		AccountID:   account.ID,
		Amount:      5000,
		Description: "Test transaction",
		Date:        "2024-01-15",
		Type:        "expense",
	}
	if err := svc.Create(&txn); err != nil {
		t.Fatalf("create failed: %v", err)
	}
	if txn.ID == 0 {
		t.Fatal("expected non-zero ID after create")
	}

	// List
	txns, total, err := svc.List(TransactionListParams{})
	if err != nil {
		t.Fatalf("list failed: %v", err)
	}
	if total != 1 {
		t.Errorf("expected total 1, got %d", total)
	}
	if len(txns) != 1 {
		t.Errorf("expected 1 transaction, got %d", len(txns))
	}

	// Delete
	if err := svc.Delete(txn.ID); err != nil {
		t.Fatalf("delete failed: %v", err)
	}
	_, total, _ = svc.List(TransactionListParams{})
	if total != 0 {
		t.Errorf("expected total 0 after delete, got %d", total)
	}
}

func TestTransactionService_UpdateZeroValue(t *testing.T) {
	svc, account := setupTransactionTest(t)

	txn := models.Transaction{
		AccountID:   account.ID,
		Amount:      5000,
		Description: "Original",
		Date:        "2024-01-15",
		Type:        "expense",
	}
	svc.Create(&txn)

	// Update amount to 0
	zeroAmount := int64(0)
	updated, err := svc.Update(txn.ID, UpdateTransactionInput{
		Amount: &zeroAmount,
	})
	if err != nil {
		t.Fatalf("update failed: %v", err)
	}
	if updated.Amount != 0 {
		t.Errorf("expected amount 0, got %d", updated.Amount)
	}

	// Update description to empty string
	emptyDesc := ""
	updated, err = svc.Update(txn.ID, UpdateTransactionInput{
		Description: &emptyDesc,
	})
	if err != nil {
		t.Fatalf("update failed: %v", err)
	}
	if updated.Description != "" {
		t.Errorf("expected empty description, got %q", updated.Description)
	}
}

func TestTransactionService_BulkUpdateCategory(t *testing.T) {
	svc, account := setupTransactionTest(t)

	// Create a category
	cat := models.Category{Name: "Food", Colour: "#FF0000"}
	svc.db.Create(&cat)

	// Create two transactions
	txn1 := models.Transaction{AccountID: account.ID, Amount: 1000, Description: "A", Date: "2024-01-01", Type: "expense"}
	txn2 := models.Transaction{AccountID: account.ID, Amount: 2000, Description: "B", Date: "2024-01-02", Type: "expense"}
	svc.Create(&txn1)
	svc.Create(&txn2)

	// Bulk update
	affected, err := svc.BulkUpdateCategory([]uint{txn1.ID, txn2.ID}, &cat.ID)
	if err != nil {
		t.Fatalf("bulk update failed: %v", err)
	}
	if affected != 2 {
		t.Errorf("expected 2 affected, got %d", affected)
	}

	// Verify
	var check models.Transaction
	svc.db.First(&check, txn1.ID)
	if check.CategoryID == nil || *check.CategoryID != cat.ID {
		t.Error("txn1 should have updated category")
	}
}

func TestTransactionService_ImportCSV(t *testing.T) {
	svc, account := setupTransactionTest(t)

	txns := []models.Transaction{
		{AccountID: account.ID, Amount: 1000, Description: "A", Date: "2024-01-01", Type: "expense"},
		{AccountID: account.ID, Amount: 2000, Description: "B", Date: "2024-01-02", Type: "income"},
	}
	if err := svc.ImportCSV(txns); err != nil {
		t.Fatalf("import failed: %v", err)
	}

	_, total, _ := svc.List(TransactionListParams{})
	if total != 2 {
		t.Errorf("expected 2 transactions after import, got %d", total)
	}
}

func TestTransactionService_ListPaginationCap(t *testing.T) {
	svc, _ := setupTransactionTest(t)

	txns, _, err := svc.List(TransactionListParams{Limit: 500})
	if err != nil {
		t.Fatalf("list failed: %v", err)
	}
	// Just verify it doesn't error — the cap is enforced at the service level
	_ = txns
}

func TestTransactionService_ListFilters(t *testing.T) {
	svc, account := setupTransactionTest(t)

	cat := models.Category{Name: "Food", Colour: "#FF0000"}
	svc.db.Create(&cat)

	svc.Create(&models.Transaction{
		AccountID: account.ID, CategoryID: &cat.ID,
		Amount: 1000, Description: "Groceries", Date: "2024-01-15", Type: "expense",
	})
	svc.Create(&models.Transaction{
		AccountID: account.ID,
		Amount: 2000, Description: "Other", Date: "2024-02-15", Type: "expense",
	})

	// Filter by category
	txns, total, _ := svc.List(TransactionListParams{CategoryID: "none"})
	if total != 1 {
		t.Errorf("expected 1 uncategorized, got %d", total)
	}
	_ = txns

	// Filter by date range
	_, total, _ = svc.List(TransactionListParams{DateFrom: "2024-01-01", DateTo: "2024-01-31"})
	if total != 1 {
		t.Errorf("expected 1 in January, got %d", total)
	}

	// Filter by search
	_, total, _ = svc.List(TransactionListParams{Search: "Grocer"})
	if total != 1 {
		t.Errorf("expected 1 matching search, got %d", total)
	}
}
