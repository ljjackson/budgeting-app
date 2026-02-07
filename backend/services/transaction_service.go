package services

import (
	"budgetting-app/backend/models"
	"strconv"

	"gorm.io/gorm"
)

type TransactionService struct {
	db *gorm.DB
}

func NewTransactionService(db *gorm.DB) *TransactionService {
	return &TransactionService{db: db}
}

type UpdateTransactionInput struct {
	AccountID   *uint   `json:"account_id"`
	CategoryID  *uint   `json:"category_id"`
	Amount      *int64  `json:"amount"`
	Description *string `json:"description"`
	Date        *string `json:"date"`
	Type        *string `json:"type"`
}

type TransactionListParams struct {
	AccountID  string
	CategoryID string
	DateFrom   string
	DateTo     string
	Search     string
	Limit      int
	Offset     int
}

const MaxPageSize = 200

func (s *TransactionService) List(params TransactionListParams) ([]models.Transaction, int64, error) {
	query := s.db.Preload("Account").Preload("Category").Order("date DESC")

	if params.AccountID != "" {
		query = query.Where("account_id = ?", params.AccountID)
	}
	if params.CategoryID != "" {
		if params.CategoryID == "none" {
			query = query.Where("category_id IS NULL")
		} else {
			query = query.Where("category_id = ?", params.CategoryID)
		}
	}
	if params.DateFrom != "" {
		query = query.Where("date >= ?", params.DateFrom)
	}
	if params.DateTo != "" {
		query = query.Where("date <= ?", params.DateTo)
	}
	if params.Search != "" {
		query = query.Where("description LIKE ?", "%"+params.Search+"%")
	}

	var total int64
	query.Model(&models.Transaction{}).Count(&total)

	if params.Limit > 0 {
		limit := params.Limit
		if limit > MaxPageSize {
			limit = MaxPageSize
		}
		query = query.Limit(limit)
	}
	if params.Offset > 0 {
		query = query.Offset(params.Offset)
	}

	var transactions []models.Transaction
	err := query.Find(&transactions).Error
	return transactions, total, err
}

func (s *TransactionService) Create(txn *models.Transaction) error {
	if err := s.db.Create(txn).Error; err != nil {
		return err
	}
	return s.db.Preload("Account").Preload("Category").First(txn, txn.ID).Error
}

func (s *TransactionService) Update(id uint, input UpdateTransactionInput) (models.Transaction, error) {
	var txn models.Transaction
	if err := s.db.First(&txn, id).Error; err != nil {
		return txn, err
	}

	updates := map[string]interface{}{}
	if input.CategoryID != nil {
		updates["category_id"] = input.CategoryID
	}
	if input.AccountID != nil {
		updates["account_id"] = *input.AccountID
	}
	if input.Amount != nil {
		updates["amount"] = *input.Amount
	}
	if input.Description != nil {
		updates["description"] = *input.Description
	}
	if input.Date != nil {
		updates["date"] = *input.Date
	}
	if input.Type != nil {
		updates["type"] = *input.Type
	}

	if err := s.db.Model(&txn).Updates(updates).Error; err != nil {
		return txn, err
	}
	err := s.db.Preload("Account").Preload("Category").First(&txn, txn.ID).Error
	return txn, err
}

func (s *TransactionService) Delete(id uint) error {
	var txn models.Transaction
	if err := s.db.First(&txn, id).Error; err != nil {
		return err
	}
	return s.db.Delete(&txn).Error
}

func (s *TransactionService) BulkUpdateCategory(transactionIDs []uint, categoryID *uint) (int64, error) {
	result := s.db.Model(&models.Transaction{}).
		Where("id IN ?", transactionIDs).
		Update("category_id", categoryID)
	return result.RowsAffected, result.Error
}

func (s *TransactionService) ImportCSV(transactions []models.Transaction) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		batchSize := 100
		for i := 0; i < len(transactions); i += batchSize {
			end := i + batchSize
			if end > len(transactions) {
				end = len(transactions)
			}
			if err := tx.Create(transactions[i:end]).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func CreateTransactionFromInput(accountID uint, categoryID *uint, amount int64, description, date, txnType string) models.Transaction {
	return models.Transaction{
		AccountID:   accountID,
		CategoryID:  categoryID,
		Amount:      amount,
		Description: description,
		Date:        date,
		Type:        txnType,
	}
}

func ParseListParams(queryFn func(string) string) TransactionListParams {
	params := TransactionListParams{
		AccountID:  queryFn("account_id"),
		CategoryID: queryFn("category_id"),
		DateFrom:   queryFn("date_from"),
		DateTo:     queryFn("date_to"),
		Search:     queryFn("search"),
	}
	if limitStr := queryFn("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil && limit > 0 {
			params.Limit = limit
		}
	}
	if offsetStr := queryFn("offset"); offsetStr != "" {
		if offset, err := strconv.Atoi(offsetStr); err == nil && offset > 0 {
			params.Offset = offset
		}
	}
	return params
}
