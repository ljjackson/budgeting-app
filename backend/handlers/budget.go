package handlers

import (
	"budgetting-app/backend/services"
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
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

func (h *BudgetHandler) SetCategoryTarget(c *gin.Context) {
	idStr := c.Param("id")
	categoryID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid category id")
		return
	}

	var req struct {
		Month        string  `json:"month"`
		TargetType   string  `json:"target_type"`
		TargetAmount int64   `json:"target_amount"`
		TargetDate   *string `json:"target_date"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}
	if !validateMonth(req.Month) {
		respondError(c, http.StatusBadRequest, "valid month parameter required (YYYY-MM)")
		return
	}
	if !validateTargetType(req.TargetType) {
		respondError(c, http.StatusBadRequest, "target_type must be one of: monthly_savings, savings_balance, spending_by_date")
		return
	}
	if req.TargetAmount <= 0 {
		respondError(c, http.StatusBadRequest, "target_amount must be greater than 0")
		return
	}
	if req.TargetType != "monthly_savings" {
		if req.TargetDate == nil || !validateMonth(*req.TargetDate) {
			respondError(c, http.StatusBadRequest, "target_date (YYYY-MM) is required for this target type")
			return
		}
	}

	target, err := h.service.SetCategoryTarget(uint(categoryID), req.Month, req.TargetType, req.TargetAmount, req.TargetDate)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			respondError(c, http.StatusNotFound, "category not found")
			return
		}
		respondServerError(c, err, "Failed to set category target")
		return
	}
	c.JSON(http.StatusOK, target)
}

func (h *BudgetHandler) DeleteCategoryTarget(c *gin.Context) {
	idStr := c.Param("id")
	categoryID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid category id")
		return
	}

	month := c.Query("month")
	if !validateMonth(month) {
		respondError(c, http.StatusBadRequest, "valid month query parameter required (YYYY-MM)")
		return
	}

	err = h.service.DeleteCategoryTarget(uint(categoryID), month)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			respondError(c, http.StatusNotFound, "no target found for this category")
			return
		}
		respondServerError(c, err, "Failed to delete category target")
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "target deleted"})
}

func (h *BudgetHandler) AllocateBulk(c *gin.Context) {
	var req struct {
		Month       string                       `json:"month"`
		Allocations []services.BulkAllocationItem `json:"allocations"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, err.Error())
		return
	}
	if !validateMonth(req.Month) {
		respondError(c, http.StatusBadRequest, "invalid month format (YYYY-MM)")
		return
	}
	if len(req.Allocations) == 0 {
		respondError(c, http.StatusBadRequest, "allocations must not be empty")
		return
	}
	for _, a := range req.Allocations {
		if a.CategoryID == 0 {
			respondError(c, http.StatusBadRequest, "each allocation must have a category_id")
			return
		}
		if a.Amount < 0 {
			respondError(c, http.StatusBadRequest, "allocation amounts must be non-negative")
			return
		}
	}

	if err := h.service.AllocateBulk(req.Month, req.Allocations); err != nil {
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
	if req.CategoryID == 0 {
		respondError(c, http.StatusBadRequest, "category_id is required")
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
