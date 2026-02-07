package handlers

import (
	"budgetting-app/backend/models"
	"budgetting-app/backend/services"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CategoryHandler struct {
	service *services.CategoryService
}

func NewCategoryHandler(svc *services.CategoryService) *CategoryHandler {
	return &CategoryHandler{service: svc}
}

func (h *CategoryHandler) List(c *gin.Context) {
	categories, err := h.service.List()
	if err != nil {
		respondServerError(c, err, "Failed to list categories")
		return
	}
	c.JSON(http.StatusOK, categories)
}

func (h *CategoryHandler) Create(c *gin.Context) {
	var category models.Category
	if err := c.ShouldBindJSON(&category); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}
	if !validateColour(category.Colour) {
		respondError(c, http.StatusBadRequest, "Invalid colour. Must be a hex colour like #FF5733")
		return
	}
	if err := h.service.Create(&category); err != nil {
		respondServerError(c, err, "Failed to create category")
		return
	}
	c.JSON(http.StatusCreated, category)
}

func (h *CategoryHandler) Update(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	var input struct {
		Name   string `json:"name"`
		Colour string `json:"colour"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}
	if !validateColour(input.Colour) {
		respondError(c, http.StatusBadRequest, "Invalid colour. Must be a hex colour like #FF5733")
		return
	}
	category, err := h.service.Update(id, input.Name, input.Colour)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			respondError(c, http.StatusNotFound, "Category not found")
			return
		}
		respondServerError(c, err, "Failed to update category")
		return
	}
	c.JSON(http.StatusOK, category)
}

func (h *CategoryHandler) Delete(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	err := h.service.Delete(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			respondError(c, http.StatusNotFound, "Category not found")
			return
		}
		respondServerError(c, err, "Failed to delete category")
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Category deleted"})
}
