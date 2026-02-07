package handlers

import (
	"budgetting-app/backend/services"
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type TransactionHandler struct {
	service *services.TransactionService
}

func NewTransactionHandler(svc *services.TransactionService) *TransactionHandler {
	return &TransactionHandler{service: svc}
}

func (h *TransactionHandler) List(c *gin.Context) {
	params := services.ParseListParams(c.Query)

	transactions, total, err := h.service.List(params)
	if err != nil {
		respondServerError(c, err, "Failed to list transactions")
		return
	}
	c.Header("X-Total-Count", strconv.FormatInt(total, 10))
	c.JSON(http.StatusOK, transactions)
}

func (h *TransactionHandler) Create(c *gin.Context) {
	var input struct {
		AccountID   uint   `json:"account_id" binding:"required"`
		CategoryID  *uint  `json:"category_id"`
		Amount      int64  `json:"amount"`
		Description string `json:"description" binding:"required"`
		Date        string `json:"date" binding:"required"`
		Type        string `json:"type" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}
	if !validateTxnType(input.Type) {
		respondError(c, http.StatusBadRequest, "Invalid transaction type. Must be one of: income, expense")
		return
	}
	if !validateDate(input.Date) {
		respondError(c, http.StatusBadRequest, "Invalid date format. Must be YYYY-MM-DD")
		return
	}

	txn := services.CreateTransactionFromInput(input.AccountID, input.CategoryID, input.Amount, input.Description, input.Date, input.Type)
	if err := h.service.Create(&txn); err != nil {
		respondServerError(c, err, "Failed to create transaction")
		return
	}
	c.JSON(http.StatusCreated, txn)
}

func (h *TransactionHandler) Update(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	var input services.UpdateTransactionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}
	if input.Date != nil && !validateDate(*input.Date) {
		respondError(c, http.StatusBadRequest, "Invalid date format. Must be YYYY-MM-DD")
		return
	}
	if input.Type != nil && !validateTxnType(*input.Type) {
		respondError(c, http.StatusBadRequest, "Invalid transaction type. Must be one of: income, expense")
		return
	}

	txn, err := h.service.Update(id, input)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			respondError(c, http.StatusNotFound, "Transaction not found")
			return
		}
		respondServerError(c, err, "Failed to update transaction")
		return
	}
	c.JSON(http.StatusOK, txn)
}

func (h *TransactionHandler) Delete(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	err := h.service.Delete(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			respondError(c, http.StatusNotFound, "Transaction not found")
			return
		}
		respondServerError(c, err, "Failed to delete transaction")
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Transaction deleted"})
}

func (h *TransactionHandler) BulkUpdateCategory(c *gin.Context) {
	var input struct {
		TransactionIDs []uint `json:"transaction_ids" binding:"required"`
		CategoryID     *uint  `json:"category_id"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}
	if len(input.TransactionIDs) == 0 {
		respondError(c, http.StatusBadRequest, "transaction_ids must not be empty")
		return
	}

	affected, err := h.service.BulkUpdateCategory(input.TransactionIDs, input.CategoryID)
	if err != nil {
		respondServerError(c, err, "Failed to update transactions")
		return
	}
	c.JSON(http.StatusOK, gin.H{"updated": affected})
}

func (h *TransactionHandler) ImportCSV(c *gin.Context) {
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		respondError(c, http.StatusBadRequest, "File required")
		return
	}
	defer file.Close()

	accountID := c.PostForm("account_id")
	if accountID == "" {
		respondError(c, http.StatusBadRequest, "account_id required")
		return
	}

	transactions, err := services.ParseCSV(file, accountID)
	if err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.service.ImportCSV(transactions); err != nil {
		respondServerError(c, err, "Failed to import transactions")
		return
	}
	c.JSON(http.StatusCreated, gin.H{"imported": len(transactions)})
}
