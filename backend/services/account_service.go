package services

import (
	"budgetting-app/backend/models"
	"errors"
	"time"

	"gorm.io/gorm"
)

type AccountService struct {
	db *gorm.DB
}

func NewAccountService(db *gorm.DB) *AccountService {
	return &AccountService{db: db}
}

type AccountResponse struct {
	models.Account
	HasTransactions bool `json:"has_transactions"`
}

type CreateAccountInput struct {
	Name            string `json:"name" binding:"required"`
	Type            string `json:"type" binding:"required"`
	StartingBalance *int64 `json:"starting_balance"`
}

func (s *AccountService) List() ([]AccountResponse, error) {
	var accounts []models.Account
	if err := s.db.Order("name").Find(&accounts).Error; err != nil {
		return nil, err
	}

	// Batch query for has_transactions to avoid N+1
	accountIDs := make([]uint, len(accounts))
	for i, a := range accounts {
		accountIDs[i] = a.ID
	}
	var idsWithTxns []uint
	if len(accountIDs) > 0 {
		s.db.Raw("SELECT DISTINCT account_id FROM transactions WHERE account_id IN ?", accountIDs).Scan(&idsWithTxns)
	}
	hasTxnMap := make(map[uint]bool)
	for _, id := range idsWithTxns {
		hasTxnMap[id] = true
	}

	results := make([]AccountResponse, len(accounts))
	for i, a := range accounts {
		results[i] = AccountResponse{Account: a, HasTransactions: hasTxnMap[a.ID]}
	}
	return results, nil
}

func (s *AccountService) Create(input CreateAccountInput) (models.Account, error) {
	account := models.Account{Name: input.Name, Type: input.Type}

	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&account).Error; err != nil {
			return err
		}
		if input.StartingBalance != nil && *input.StartingBalance != 0 {
			amount := *input.StartingBalance
			txType := "income"
			if amount < 0 {
				amount = -amount
				txType = "expense"
			}
			txn := models.Transaction{
				AccountID:   account.ID,
				Amount:      amount,
				Type:        txType,
				Description: "Starting balance",
				Date:        time.Now().Format("2006-01-02"),
			}
			if err := tx.Create(&txn).Error; err != nil {
				return err
			}
		}
		return nil
	})
	return account, err
}

func (s *AccountService) Update(id uint, name string, accountType string) (models.Account, error) {
	var account models.Account
	if err := s.db.First(&account, id).Error; err != nil {
		return account, err
	}
	if err := s.db.Model(&account).Updates(models.Account{Name: name, Type: accountType}).Error; err != nil {
		return account, err
	}
	return account, nil
}

func (s *AccountService) Delete(id uint) error {
	var account models.Account
	if err := s.db.First(&account, id).Error; err != nil {
		return err
	}
	var count int64
	s.db.Model(&models.Transaction{}).Where("account_id = ?", account.ID).Count(&count)
	if count > 0 {
		return errors.New("cannot delete account with transactions")
	}
	return s.db.Delete(&account).Error
}
