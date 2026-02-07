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
	if !validateColour(category.Colour) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid colour. Must be a hex colour like #FF5733"})
		return
	}
	if err := database.DB.Create(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create category"})
		return
	}
	c.JSON(http.StatusCreated, category)
}

func UpdateCategory(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	var category models.Category
	if err := database.DB.First(&category, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}
	var input models.Category
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if !validateColour(input.Colour) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid colour. Must be a hex colour like #FF5733"})
		return
	}
	if err := database.DB.Model(&category).Updates(models.Category{Name: input.Name, Colour: input.Colour}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update category"})
		return
	}
	c.JSON(http.StatusOK, category)
}

func DeleteCategory(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	var category models.Category
	if err := database.DB.First(&category, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}
	if err := database.DB.Delete(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete category"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Category deleted"})
}
