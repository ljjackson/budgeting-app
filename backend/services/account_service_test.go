package services

import (
	"budgetting-app/backend/models"
	"budgetting-app/backend/testutil"
	"testing"
)

func TestAccountService_CreateWithStartingBalance(t *testing.T) {
	db := testutil.SetupTestDB(t)
	svc := NewAccountService(db)

	balance := int64(10000) // £100.00
	account, err := svc.Create(CreateAccountInput{
		Name:            "Test Account",
		Type:            "checking",
		StartingBalance: &balance,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if account.Name != "Test Account" {
		t.Errorf("expected name 'Test Account', got %s", account.Name)
	}

	// Verify starting balance transaction was created
	var txns []models.Transaction
	db.Where("account_id = ?", account.ID).Find(&txns)
	if len(txns) != 1 {
		t.Fatalf("expected 1 transaction, got %d", len(txns))
	}
	if txns[0].Amount != 10000 {
		t.Errorf("expected amount 10000, got %d", txns[0].Amount)
	}
	if txns[0].Type != "income" {
		t.Errorf("expected type income, got %s", txns[0].Type)
	}
}

func TestAccountService_CreateWithNegativeStartingBalance(t *testing.T) {
	db := testutil.SetupTestDB(t)
	svc := NewAccountService(db)

	balance := int64(-5000) // -£50.00
	account, err := svc.Create(CreateAccountInput{
		Name:            "Credit Card",
		Type:            "credit",
		StartingBalance: &balance,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	var txns []models.Transaction
	db.Where("account_id = ?", account.ID).Find(&txns)
	if len(txns) != 1 {
		t.Fatalf("expected 1 transaction, got %d", len(txns))
	}
	if txns[0].Amount != 5000 {
		t.Errorf("expected amount 5000, got %d", txns[0].Amount)
	}
	if txns[0].Type != "expense" {
		t.Errorf("expected type expense, got %s", txns[0].Type)
	}
}

func TestAccountService_ListWithHasTransactions(t *testing.T) {
	db := testutil.SetupTestDB(t)
	svc := NewAccountService(db)

	// Create two accounts
	a1, _ := svc.Create(CreateAccountInput{Name: "Account 1", Type: "checking"})
	a2, _ := svc.Create(CreateAccountInput{Name: "Account 2", Type: "savings"})

	// Add transaction to account 1 only
	db.Create(&models.Transaction{
		AccountID:   a1.ID,
		Amount:      1000,
		Type:        "expense",
		Description: "Test",
		Date:        "2024-01-01",
	})

	results, err := svc.List()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(results) != 2 {
		t.Fatalf("expected 2 accounts, got %d", len(results))
	}

	// Find each account in results (sorted by name)
	for _, r := range results {
		if r.ID == a1.ID && !r.HasTransactions {
			t.Error("Account 1 should have has_transactions=true")
		}
		if r.ID == a2.ID && r.HasTransactions {
			t.Error("Account 2 should have has_transactions=false")
		}
	}
}

func TestAccountService_DeleteProtection(t *testing.T) {
	db := testutil.SetupTestDB(t)
	svc := NewAccountService(db)

	account, _ := svc.Create(CreateAccountInput{Name: "Test", Type: "checking"})
	db.Create(&models.Transaction{
		AccountID:   account.ID,
		Amount:      1000,
		Type:        "expense",
		Description: "Test",
		Date:        "2024-01-01",
	})

	err := svc.Delete(account.ID)
	if err == nil {
		t.Fatal("expected error when deleting account with transactions")
	}
	if err.Error() != "cannot delete account with transactions" {
		t.Errorf("unexpected error message: %s", err.Error())
	}
}

func TestAccountService_DeleteSuccess(t *testing.T) {
	db := testutil.SetupTestDB(t)
	svc := NewAccountService(db)

	account, _ := svc.Create(CreateAccountInput{Name: "Empty", Type: "checking"})
	err := svc.Delete(account.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	var count int64
	db.Model(&models.Account{}).Count(&count)
	if count != 0 {
		t.Errorf("expected 0 accounts, got %d", count)
	}
}
