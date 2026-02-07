package handlers

import (
	"budgetting-app/backend/database"
	"budgetting-app/backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

type budgetCategoryRow struct {
	CategoryID   uint   `json:"category_id"`
	CategoryName string `json:"category_name"`
	Colour       string `json:"colour"`
	Assigned     int64  `json:"assigned"`
	Activity     int64  `json:"activity"`
	Available    int64  `json:"available"`
}

type budgetResponse struct {
	Month         string              `json:"month"`
	Income        int64               `json:"income"`
	TotalAssigned int64               `json:"total_assigned"`
	ReadyToAssign int64               `json:"ready_to_assign"`
	Categories    []budgetCategoryRow `json:"categories"`
}

func buildBudgetResponse(month string) (*budgetResponse, error) {
	firstDay, lastDay := monthDateRange(month)

	// 1a. This month's income (for display)
	var monthIncome int64
	database.DB.Raw("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE type='income' AND date >= ? AND date <= ?", firstDay, lastDay).Scan(&monthIncome)

	// 1b. Cumulative income up to end of this month (for ready_to_assign)
	var cumulativeIncome int64
	database.DB.Raw("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE type='income' AND date <= ?", lastDay).Scan(&cumulativeIncome)

	// 2. All categories
	var categories []models.Category
	database.DB.Find(&categories)

	// 3. This month's allocations
	type catAmount struct {
		CategoryID uint
		Amount     int64
	}
	var monthAllocations []catAmount
	database.DB.Raw("SELECT category_id, amount FROM budget_allocations WHERE month = ?", month).Scan(&monthAllocations)
	monthAllocMap := make(map[uint]int64)
	for _, a := range monthAllocations {
		monthAllocMap[a.CategoryID] = a.Amount
	}

	// 4. Cumulative assigned per category (for available calculation)
	var cumAllocations []catAmount
	database.DB.Raw("SELECT category_id, COALESCE(SUM(amount),0) as amount FROM budget_allocations WHERE month <= ? GROUP BY category_id", month).Scan(&cumAllocations)
	cumAllocMap := make(map[uint]int64)
	for _, a := range cumAllocations {
		cumAllocMap[a.CategoryID] = a.Amount
	}

	// 5. This month's expense activity per category
	var monthExpenses []catAmount
	database.DB.Raw("SELECT category_id, COALESCE(SUM(amount),0) as amount FROM transactions WHERE type='expense' AND date >= ? AND date <= ? AND category_id IS NOT NULL GROUP BY category_id", firstDay, lastDay).Scan(&monthExpenses)
	monthExpenseMap := make(map[uint]int64)
	for _, e := range monthExpenses {
		monthExpenseMap[e.CategoryID] = e.Amount
	}

	// 6. Cumulative expense per category (for available calculation)
	var cumExpenses []catAmount
	database.DB.Raw("SELECT category_id, COALESCE(SUM(amount),0) as amount FROM transactions WHERE type='expense' AND date <= ? AND category_id IS NOT NULL GROUP BY category_id", lastDay).Scan(&cumExpenses)
	cumExpenseMap := make(map[uint]int64)
	for _, e := range cumExpenses {
		cumExpenseMap[e.CategoryID] = e.Amount
	}

	// 7. Build category rows
	rows := make([]budgetCategoryRow, 0, len(categories))
	var totalAssigned int64
	var cumulativeTotalAssigned int64
	for _, cat := range categories {
		assigned := monthAllocMap[cat.ID]
		activity := monthExpenseMap[cat.ID]
		cumAssigned := cumAllocMap[cat.ID]
		cumActivity := cumExpenseMap[cat.ID]
		available := cumAssigned - cumActivity

		totalAssigned += assigned
		cumulativeTotalAssigned += cumAssigned

		rows = append(rows, budgetCategoryRow{
			CategoryID:   cat.ID,
			CategoryName: cat.Name,
			Colour:       cat.Colour,
			Assigned:     assigned,
			Activity:     activity,
			Available:    available,
		})
	}

	// 8. ready_to_assign = cumulative income - cumulative total assigned
	readyToAssign := cumulativeIncome - cumulativeTotalAssigned

	return &budgetResponse{
		Month:         month,
		Income:        monthIncome,
		TotalAssigned: totalAssigned,
		ReadyToAssign: readyToAssign,
		Categories:    rows,
	}, nil
}

func GetBudget(c *gin.Context) {
	month := c.Query("month")
	if month == "" || !validateMonth(month) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "valid month parameter required (YYYY-MM)"})
		return
	}
	resp, err := buildBudgetResponse(month)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func AllocateBudget(c *gin.Context) {
	var req struct {
		Month      string `json:"month"`
		CategoryID uint   `json:"category_id"`
		Amount     int64  `json:"amount"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if !validateMonth(req.Month) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid month format (YYYY-MM)"})
		return
	}
	if req.Amount < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "amount must be non-negative"})
		return
	}
	// Validate category exists
	var cat models.Category
	if err := database.DB.First(&cat, req.CategoryID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "category not found"})
		return
	}

	// Upsert allocation
	var alloc models.BudgetAllocation
	result := database.DB.Where("month = ? AND category_id = ?", req.Month, req.CategoryID).First(&alloc)
	if result.Error != nil {
		// Create new
		alloc = models.BudgetAllocation{
			Month:      req.Month,
			CategoryID: req.CategoryID,
			Amount:     req.Amount,
		}
		database.DB.Create(&alloc)
	} else {
		// Update existing
		database.DB.Model(&alloc).Update("amount", req.Amount)
	}

	resp, err := buildBudgetResponse(req.Month)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}
