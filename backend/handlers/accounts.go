package handlers

import (
	"budgetting-app/backend/database"
	"budgetting-app/backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type CreateAccountInput struct {
	Name            string `json:"name" binding:"required"`
	Type            string `json:"type" binding:"required"`
	StartingBalance *int64 `json:"starting_balance"`
}

func ListAccounts(c *gin.Context) {
	accounts := []models.Account{}
	database.DB.Order("name").Find(&accounts)
	c.JSON(http.StatusOK, accounts)
}

func CreateAccount(c *gin.Context) {
	var input CreateAccountInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if !validateAccountType(input.Type) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account type. Must be one of: checking, savings, credit, cash"})
		return
	}
	account := models.Account{Name: input.Name, Type: input.Type}
	if err := database.DB.Create(&account).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create account"})
		return
	}
	if input.StartingBalance != nil && *input.StartingBalance != 0 {
		tx := models.Transaction{
			AccountID:   account.ID,
			Amount:      *input.StartingBalance,
			Type:        "income",
			Description: "Starting balance",
			Date:        time.Now().Format("2006-01-02"),
		}
		if err := database.DB.Create(&tx).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Account created but failed to create starting balance transaction"})
			return
		}
	}
	c.JSON(http.StatusCreated, account)
}

func UpdateAccount(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	var account models.Account
	if err := database.DB.First(&account, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		return
	}
	var input models.Account
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if !validateAccountType(input.Type) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account type. Must be one of: checking, savings, credit, cash"})
		return
	}
	if err := database.DB.Model(&account).Updates(models.Account{Name: input.Name, Type: input.Type}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update account"})
		return
	}
	c.JSON(http.StatusOK, account)
}

func DeleteAccount(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	var account models.Account
	if err := database.DB.First(&account, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		return
	}
	if err := database.DB.Delete(&account).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete account"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Account deleted"})
}
