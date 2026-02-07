package handlers

import (
	"budgetting-app/backend/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type BudgetHandler struct {
	service *services.BudgetService
}

func NewBudgetHandler(svc *services.BudgetService) *BudgetHandler {
	return &BudgetHandler{service: svc}
}

func (h *BudgetHandler) GetBudget(c *gin.Context) {
	month := c.Query("month")
	if month == "" || !validateMonth(month) {
		respondError(c, http.StatusBadRequest, "valid month parameter required (YYYY-MM)")
		return
	}
	resp, err := h.service.GetBudget(month)
	if err != nil {
		respondServerError(c, err, "Failed to get budget")
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *BudgetHandler) GetCategoryAverage(c *gin.Context) {
	categoryIDStr := c.Query("category_id")
	month := c.Query("month")

	if categoryIDStr == "" {
		respondError(c, http.StatusBadRequest, "category_id is required")
		return
	}
	categoryID, err := strconv.ParseUint(categoryIDStr, 10, 64)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid category_id")
		return
	}
	if month == "" || !validateMonth(month) {
		respondError(c, http.StatusBadRequest, "valid month parameter required (YYYY-MM)")
		return
	}

	average, err := h.service.GetCategoryAverage(uint(categoryID), month)
	if err != nil {
		respondServerError(c, err, "Failed to get category average")
		return
	}
	c.JSON(http.StatusOK, gin.H{"average": average})
}

func (h *BudgetHandler) AllocateBudget(c *gin.Context) {
	var req struct {
		Month      string `json:"month"`
		CategoryID uint   `json:"category_id"`
		Amount     int64  `json:"amount"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}
	if !validateMonth(req.Month) {
		respondError(c, http.StatusBadRequest, "invalid month format (YYYY-MM)")
		return
	}
	if req.Amount < 0 {
		respondError(c, http.StatusBadRequest, "amount must be non-negative")
		return
	}

	if err := h.service.AllocateBudget(req.Month, req.CategoryID, req.Amount); err != nil {
		respondServerError(c, err, "Failed to allocate budget")
		return
	}

	resp, err := h.service.GetBudget(req.Month)
	if err != nil {
		respondServerError(c, err, "Failed to get budget")
		return
	}
	c.JSON(http.StatusOK, resp)
}
