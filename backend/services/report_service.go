package services

import "gorm.io/gorm"

type ReportService struct {
	db *gorm.DB
}

func NewReportService(db *gorm.DB) *ReportService {
	return &ReportService{db: db}
}

type CategoryReport struct {
	CategoryID   *uint   `json:"category_id"`
	CategoryName *string `json:"category_name"`
	Colour       *string `json:"colour"`
	Total        int64   `json:"total"`
	Count        int64   `json:"count"`
}

type AccountReport struct {
	AccountID   uint   `json:"account_id"`
	AccountName string `json:"account_name"`
	AccountType string `json:"account_type"`
	Total       int64  `json:"total"`
	Count       int64  `json:"count"`
}

type ReportParams struct {
	DateFrom string
	DateTo   string
	Type     string
}

func (s *ReportService) ByCategory(params ReportParams) ([]CategoryReport, error) {
	var results []CategoryReport
	query := s.db.Table("transactions").
		Select("transactions.category_id, categories.name as category_name, categories.colour, SUM(transactions.amount) as total, COUNT(*) as count").
		Joins("LEFT JOIN categories ON categories.id = transactions.category_id").
		Group("transactions.category_id")

	if params.DateFrom != "" {
		query = query.Where("transactions.date >= ?", params.DateFrom)
	}
	if params.DateTo != "" {
		query = query.Where("transactions.date <= ?", params.DateTo)
	}
	if params.Type != "" {
		query = query.Where("transactions.type = ?", params.Type)
	}

	err := query.Find(&results).Error
	return results, err
}

func (s *ReportService) ByAccount(params ReportParams) ([]AccountReport, error) {
	var results []AccountReport
	query := s.db.Table("transactions").
		Select("transactions.account_id, accounts.name as account_name, accounts.type as account_type, SUM(transactions.amount) as total, COUNT(*) as count").
		Joins("LEFT JOIN accounts ON accounts.id = transactions.account_id").
		Group("transactions.account_id")

	if params.DateFrom != "" {
		query = query.Where("transactions.date >= ?", params.DateFrom)
	}
	if params.DateTo != "" {
		query = query.Where("transactions.date <= ?", params.DateTo)
	}
	if params.Type != "" {
		query = query.Where("transactions.type = ?", params.Type)
	}

	err := query.Find(&results).Error
	return results, err
}
