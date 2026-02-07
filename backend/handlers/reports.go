package handlers

import (
	"budgetting-app/backend/database"
	"net/http"

	"github.com/gin-gonic/gin"
)

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

func ReportByCategory(c *gin.Context) {
	results := []CategoryReport{}
	query := database.DB.Table("transactions").
		Select("transactions.category_id, categories.name as category_name, categories.colour, SUM(transactions.amount) as total, COUNT(*) as count").
		Joins("LEFT JOIN categories ON categories.id = transactions.category_id").
		Group("transactions.category_id")

	if dateFrom := c.Query("date_from"); dateFrom != "" {
		query = query.Where("transactions.date >= ?", dateFrom)
	}
	if dateTo := c.Query("date_to"); dateTo != "" {
		query = query.Where("transactions.date <= ?", dateTo)
	}
	if txnType := c.Query("type"); txnType != "" {
		query = query.Where("transactions.type = ?", txnType)
	}

	query.Find(&results)
	c.JSON(http.StatusOK, results)
}

func ReportByAccount(c *gin.Context) {
	results := []AccountReport{}
	query := database.DB.Table("transactions").
		Select("transactions.account_id, accounts.name as account_name, accounts.type as account_type, SUM(transactions.amount) as total, COUNT(*) as count").
		Joins("LEFT JOIN accounts ON accounts.id = transactions.account_id").
		Group("transactions.account_id")

	if dateFrom := c.Query("date_from"); dateFrom != "" {
		query = query.Where("transactions.date >= ?", dateFrom)
	}
	if dateTo := c.Query("date_to"); dateTo != "" {
		query = query.Where("transactions.date <= ?", dateTo)
	}
	if txnType := c.Query("type"); txnType != "" {
		query = query.Where("transactions.type = ?", txnType)
	}

	query.Find(&results)
	c.JSON(http.StatusOK, results)
}
