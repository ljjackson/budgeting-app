package handlers

import (
	"budgetting-app/backend/database"
	"budgetting-app/backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func ListCategories(c *gin.Context) {
	categories := []models.Category{}
	database.DB.Order("name").Find(&categories)
	c.JSON(http.StatusOK, categories)
}

func CreateCategory(c *gin.Context) {
	var category models.Category
	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	database.DB.Create(&category)
	c.JSON(http.StatusCreated, category)
}

func UpdateCategory(c *gin.Context) {
	var category models.Category
	if err := database.DB.First(&category, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}
	var input models.Category
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	database.DB.Model(&category).Updates(models.Account{Name: input.Name})
	category.Colour = input.Colour
	database.DB.Save(&category)
	c.JSON(http.StatusOK, category)
}

func DeleteCategory(c *gin.Context) {
	var category models.Category
	if err := database.DB.First(&category, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}
	database.DB.Delete(&category)
	c.JSON(http.StatusOK, gin.H{"message": "Category deleted"})
}
