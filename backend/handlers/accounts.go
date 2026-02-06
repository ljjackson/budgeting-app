package handlers

import (
	"budgetting-app/backend/database"
	"budgetting-app/backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func ListAccounts(c *gin.Context) {
	accounts := []models.Account{}
	database.DB.Order("name").Find(&accounts)
	c.JSON(http.StatusOK, accounts)
}

func CreateAccount(c *gin.Context) {
	var account models.Account
	if err := c.ShouldBindJSON(&account); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	database.DB.Create(&account)
	c.JSON(http.StatusCreated, account)
}

func UpdateAccount(c *gin.Context) {
	var account models.Account
	if err := database.DB.First(&account, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		return
	}
	var input models.Account
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	database.DB.Model(&account).Updates(models.Account{Name: input.Name, Type: input.Type})
	c.JSON(http.StatusOK, account)
}

func DeleteAccount(c *gin.Context) {
	var account models.Account
	if err := database.DB.First(&account, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		return
	}
	database.DB.Delete(&account)
	c.JSON(http.StatusOK, gin.H{"message": "Account deleted"})
}
