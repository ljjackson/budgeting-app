package services

import (
	"budgetting-app/backend/models"
	"math"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type BudgetService struct {
	db *gorm.DB
}

func NewBudgetService(db *gorm.DB) *BudgetService {
	return &BudgetService{db: db}
}

type BudgetCategoryRow struct {
	CategoryID   uint   `json:"category_id"`
	CategoryName string `json:"category_name"`
	Colour       string `json:"colour"`
	Assigned     int64  `json:"assigned"`
	Activity     int64  `json:"activity"`
	Available    int64  `json:"available"`
}

type BudgetResponse struct {
	Month                 string              `json:"month"`
	Income                int64               `json:"income"`
	TotalAssigned         int64               `json:"total_assigned"`
	ReadyToAssign         int64               `json:"ready_to_assign"`
	UncategorizedExpenses int64               `json:"uncategorized_expenses"`
	Categories            []BudgetCategoryRow `json:"categories"`
}

func (s *BudgetService) GetBudget(month string) (*BudgetResponse, error) {
	firstDay, lastDay := monthDateRange(month)

	// 1. Income: monthly + cumulative in one query
	type incomeResult struct {
		MonthIncome      int64
		CumulativeIncome int64
	}
	var income incomeResult
	s.db.Raw(`SELECT
		COALESCE(SUM(CASE WHEN date >= ? AND date <= ? THEN amount ELSE 0 END), 0) as month_income,
		COALESCE(SUM(amount), 0) as cumulative_income
		FROM transactions WHERE type='income' AND date <= ?`, firstDay, lastDay, lastDay).Scan(&income)

	// 2. All categories
	var categories []models.Category
	s.db.Order("name").Find(&categories)

	// 3. Allocations: monthly + cumulative per category in one query
	type allocRow struct {
		CategoryID    uint
		MonthAmount   int64
		CumAmount     int64
	}
	var allocRows []allocRow
	s.db.Raw(`SELECT category_id,
		COALESCE(SUM(CASE WHEN month = ? THEN amount ELSE 0 END), 0) as month_amount,
		COALESCE(SUM(amount), 0) as cum_amount
		FROM budget_allocations WHERE month <= ? GROUP BY category_id`, month, month).Scan(&allocRows)
	monthAllocMap := make(map[uint]int64)
	cumAllocMap := make(map[uint]int64)
	for _, a := range allocRows {
		monthAllocMap[a.CategoryID] = a.MonthAmount
		cumAllocMap[a.CategoryID] = a.CumAmount
	}

	// 4. Expenses: monthly + cumulative per category in one query
	type expenseRow struct {
		CategoryID  uint
		MonthAmount int64
		CumAmount   int64
	}
	var expenseRows []expenseRow
	s.db.Raw(`SELECT category_id,
		COALESCE(SUM(CASE WHEN date >= ? AND date <= ? THEN amount ELSE 0 END), 0) as month_amount,
		COALESCE(SUM(amount), 0) as cum_amount
		FROM transactions WHERE type='expense' AND date <= ? AND category_id IS NOT NULL
		GROUP BY category_id`, firstDay, lastDay, lastDay).Scan(&expenseRows)
	monthExpenseMap := make(map[uint]int64)
	cumExpenseMap := make(map[uint]int64)
	for _, e := range expenseRows {
		monthExpenseMap[e.CategoryID] = e.MonthAmount
		cumExpenseMap[e.CategoryID] = e.CumAmount
	}

	// 5. Uncategorized expense count
	var uncategorizedExpenses int64
	s.db.Raw("SELECT COUNT(*) FROM transactions WHERE type='expense' AND category_id IS NULL AND date >= ? AND date <= ?", firstDay, lastDay).Scan(&uncategorizedExpenses)

	// 6. Build category rows
	rows := make([]BudgetCategoryRow, 0, len(categories))
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

		rows = append(rows, BudgetCategoryRow{
			CategoryID:   cat.ID,
			CategoryName: cat.Name,
			Colour:       cat.Colour,
			Assigned:     assigned,
			Activity:     activity,
			Available:    available,
		})
	}

	readyToAssign := income.CumulativeIncome - cumulativeTotalAssigned

	return &BudgetResponse{
		Month:                 month,
		Income:                income.MonthIncome,
		TotalAssigned:         totalAssigned,
		ReadyToAssign:         readyToAssign,
		UncategorizedExpenses: uncategorizedExpenses,
		Categories:            rows,
	}, nil
}

func (s *BudgetService) AllocateBudget(month string, categoryID uint, amount int64) error {
	// Validate category exists
	var cat models.Category
	if err := s.db.First(&cat, categoryID).Error; err != nil {
		return err
	}

	alloc := models.BudgetAllocation{
		Month:      month,
		CategoryID: categoryID,
		Amount:     amount,
	}
	return s.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "month"}, {Name: "category_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"amount", "updated_at"}),
	}).Create(&alloc).Error
}

func (s *BudgetService) GetCategoryAverage(categoryID uint, month string) (int64, error) {
	t, _ := time.Parse("2006-01", month)
	threeMonthsAgo := t.AddDate(0, -3, 0).Format("2006-01-02")
	firstOfMonth := t.Format("2006-01-02")

	var total int64
	err := s.db.Raw("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE type='expense' AND category_id=? AND date >= ? AND date < ?",
		categoryID, threeMonthsAgo, firstOfMonth).Scan(&total).Error
	if err != nil {
		return 0, err
	}

	average := int64(math.Round(float64(total) / 3.0))
	return average, nil
}

func monthDateRange(month string) (string, string) {
	t, _ := time.Parse("2006-01", month)
	first := t.Format("2006-01-02")
	last := t.AddDate(0, 1, -1).Format("2006-01-02")
	return first, last
}
