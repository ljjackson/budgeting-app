package handlers

import (
	"budgetting-app/backend/services"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AccountHandler struct {
	service *services.AccountService
}

func NewAccountHandler(svc *services.AccountService) *AccountHandler {
	return &AccountHandler{service: svc}
}

func (h *AccountHandler) List(c *gin.Context) {
	results, err := h.service.List()
	if err != nil {
		respondServerError(c, err, "Failed to list accounts")
		return
	}
	c.JSON(http.StatusOK, results)
}

func (h *AccountHandler) Create(c *gin.Context) {
	var input services.CreateAccountInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}
	if !validateAccountType(input.Type) {
		respondError(c, http.StatusBadRequest, "Invalid account type. Must be one of: checking, savings, credit, cash")
		return
	}
	account, err := h.service.Create(input)
	if err != nil {
		respondServerError(c, err, "Failed to create account")
		return
	}
	c.JSON(http.StatusCreated, account)
}

func (h *AccountHandler) Update(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	var input struct {
		Name string `json:"name" binding:"required"`
		Type string `json:"type" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}
	if !validateAccountType(input.Type) {
		respondError(c, http.StatusBadRequest, "Invalid account type. Must be one of: checking, savings, credit, cash")
		return
	}
	account, err := h.service.Update(id, input.Name, input.Type)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			respondError(c, http.StatusNotFound, "Account not found")
			return
		}
		respondServerError(c, err, "Failed to update account")
		return
	}
	c.JSON(http.StatusOK, account)
}

func (h *AccountHandler) Delete(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	err := h.service.Delete(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			respondError(c, http.StatusNotFound, "Account not found")
			return
		}
		if err.Error() == "cannot delete account with transactions" {
			respondError(c, http.StatusConflict, "Cannot delete account with transactions")
			return
		}
		respondServerError(c, err, "Failed to delete account")
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Account deleted"})
}
