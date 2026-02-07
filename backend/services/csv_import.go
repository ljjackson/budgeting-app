package services

import (
	"budgetting-app/backend/models"
	"encoding/csv"
	"fmt"
	"io"
	"math"
	"strconv"
	"strings"
)

// ParseCSV parses a CSV file and returns transactions.
// Expected columns: date, description, amount, type
// amount can be a decimal like "12.50" — it will be converted to cents (1250).
// type should be "income" or "expense". If omitted, it's inferred from the sign of the amount.
func ParseCSV(reader io.Reader, accountID string) ([]models.Transaction, error) {
	accID, err := strconv.ParseUint(accountID, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid account_id: %s", accountID)
	}

	r := csv.NewReader(reader)
	r.TrimLeadingSpace = true

	header, err := r.Read()
	if err != nil {
		return nil, fmt.Errorf("failed to read CSV header: %w", err)
	}

	colMap := map[string]int{}
	for i, col := range header {
		colMap[strings.ToLower(strings.TrimSpace(col))] = i
	}

	dateIdx, ok := colMap["date"]
	if !ok {
		return nil, fmt.Errorf("CSV missing required column: date")
	}
	descIdx, ok := colMap["description"]
	if !ok {
		return nil, fmt.Errorf("CSV missing required column: description")
	}
	amountIdx, ok := colMap["amount"]
	if !ok {
		return nil, fmt.Errorf("CSV missing required column: amount")
	}
	typeIdx, typeOK := colMap["type"]

	var transactions []models.Transaction
	lineNum := 1
	for {
		lineNum++
		record, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("error reading CSV line %d: %w", lineNum, err)
		}

		amountStr := strings.TrimSpace(record[amountIdx])
		amountFloat, err := strconv.ParseFloat(amountStr, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid amount on line %d: %s", lineNum, amountStr)
		}
		amountCents := int64(math.Round(amountFloat * 100))

		txnType := "expense"
		if typeOK && typeIdx < len(record) {
			t := strings.ToLower(strings.TrimSpace(record[typeIdx]))
			if t == "income" || t == "expense" {
				txnType = t
			}
		} else if amountCents > 0 {
			txnType = "income"
		}

		if amountCents < 0 {
			amountCents = -amountCents
		}

		txn := models.Transaction{
			AccountID:   uint(accID),
			Amount:      amountCents,
			Description: strings.TrimSpace(record[descIdx]),
			Date:        strings.TrimSpace(record[dateIdx]),
			Type:        txnType,
		}
		transactions = append(transactions, txn)
	}

	return transactions, nil
}
