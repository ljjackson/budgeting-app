package services

import (
	"strings"
	"testing"
)

func TestParseCSV_Basic(t *testing.T) {
	csv := `date,description,amount,type
2024-01-15,Grocery Store,-45.50,expense
2024-01-16,Salary,3000.00,income`

	txns, err := ParseCSV(strings.NewReader(csv), "1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(txns) != 2 {
		t.Fatalf("expected 2 transactions, got %d", len(txns))
	}

	// First transaction
	if txns[0].Date != "2024-01-15" {
		t.Errorf("expected date 2024-01-15, got %s", txns[0].Date)
	}
	if txns[0].Description != "Grocery Store" {
		t.Errorf("expected description 'Grocery Store', got %s", txns[0].Description)
	}
	if txns[0].Amount != 4550 {
		t.Errorf("expected amount 4550, got %d", txns[0].Amount)
	}
	if txns[0].Type != "expense" {
		t.Errorf("expected type expense, got %s", txns[0].Type)
	}
	if txns[0].AccountID != 1 {
		t.Errorf("expected account_id 1, got %d", txns[0].AccountID)
	}

	// Second transaction
	if txns[1].Amount != 300000 {
		t.Errorf("expected amount 300000, got %d", txns[1].Amount)
	}
	if txns[1].Type != "income" {
		t.Errorf("expected type income, got %s", txns[1].Type)
	}
}

func TestParseCSV_InferType(t *testing.T) {
	csv := `date,description,amount
2024-01-15,Payment,-25.00
2024-01-16,Refund,10.00`

	txns, err := ParseCSV(strings.NewReader(csv), "2")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if txns[0].Type != "expense" {
		t.Errorf("expected expense for negative amount, got %s", txns[0].Type)
	}
	if txns[0].Amount != 2500 {
		t.Errorf("expected 2500 (absolute), got %d", txns[0].Amount)
	}
	if txns[1].Type != "income" {
		t.Errorf("expected income for positive amount, got %s", txns[1].Type)
	}
}

func TestParseCSV_MissingColumn(t *testing.T) {
	csv := `date,amount
2024-01-15,25.00`

	_, err := ParseCSV(strings.NewReader(csv), "1")
	if err == nil {
		t.Fatal("expected error for missing description column")
	}
}

func TestParseCSV_InvalidAccountID(t *testing.T) {
	csv := `date,description,amount
2024-01-15,Test,10.00`

	_, err := ParseCSV(strings.NewReader(csv), "abc")
	if err == nil {
		t.Fatal("expected error for invalid account_id")
	}
}
