package handlers

import (
	"budgetting-app/backend/database"
	"budgetting-app/backend/models"
	"budgetting-app/backend/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

func ListTransactions(c *gin.Context) {
	transactions := []models.Transaction{}
	query := database.DB.Preload("Account").Preload("Category").Order("date DESC")

	if accountID := c.Query("account_id"); accountID != "" {
		query = query.Where("account_id = ?", accountID)
	}
	if categoryID := c.Query("category_id"); categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}
	if dateFrom := c.Query("date_from"); dateFrom != "" {
		query = query.Where("date >= ?", dateFrom)
	}
	if dateTo := c.Query("date_to"); dateTo != "" {
		query = query.Where("date <= ?", dateTo)
	}

	query.Find(&transactions)
	c.JSON(http.StatusOK, transactions)
}

func CreateTransaction(c *gin.Context) {
	var txn models.Transaction
	if err := c.ShouldBindJSON(&txn); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if !validateTxnType(txn.Type) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction type. Must be one of: income, expense"})
		return
	}
	if !validateDate(txn.Date) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Must be YYYY-MM-DD"})
		return
	}
	if err := database.DB.Create(&txn).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create transaction"})
		return
	}
	database.DB.Preload("Account").Preload("Category").First(&txn, txn.ID)
	c.JSON(http.StatusCreated, txn)
}

func UpdateTransaction(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	var txn models.Transaction
	if err := database.DB.First(&txn, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}
	var input models.Transaction
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := map[string]interface{}{
		"category_id": input.CategoryID, // always included (nullable)
	}
	if input.AccountID != 0 {
		updates["account_id"] = input.AccountID
	}
	if input.Amount != 0 {
		updates["amount"] = input.Amount
	}
	if input.Description != "" {
		updates["description"] = input.Description
	}
	if input.Date != "" {
		if !validateDate(input.Date) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Must be YYYY-MM-DD"})
			return
		}
		updates["date"] = input.Date
	}
	if input.Type != "" {
		if !validateTxnType(input.Type) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction type. Must be one of: income, expense"})
			return
		}
		updates["type"] = input.Type
	}

	if err := database.DB.Model(&txn).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update transaction"})
		return
	}
	database.DB.Preload("Account").Preload("Category").First(&txn, txn.ID)
	c.JSON(http.StatusOK, txn)
}

func DeleteTransaction(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	var txn models.Transaction
	if err := database.DB.First(&txn, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}
	if err := database.DB.Delete(&txn).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete transaction"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Transaction deleted"})
}

func ImportCSV(c *gin.Context) {
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File required"})
		return
	}
	defer file.Close()

	accountID := c.PostForm("account_id")
	if accountID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "account_id required"})
		return
	}

	transactions, err := services.ParseCSV(file, accountID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Create(&transactions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to import transactions"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"imported": len(transactions), "transactions": transactions})
}
