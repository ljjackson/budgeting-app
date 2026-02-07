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
	CategoryID   uint    `json:"category_id"`
	CategoryName string  `json:"category_name"`
	Colour       string  `json:"colour"`
	Assigned     int64   `json:"assigned"`
	Activity     int64   `json:"activity"`
	Available    int64   `json:"available"`
	TargetType   *string `json:"target_type"`
	TargetAmount *int64  `json:"target_amount"`
	TargetDate   *string `json:"target_date"`
	Underfunded  *int64  `json:"underfunded"`
}

type BudgetResponse struct {
	Month                 string              `json:"month"`
	Income                int64               `json:"income"`
	TotalAssigned         int64               `json:"total_assigned"`
	ReadyToAssign         int64               `json:"ready_to_assign"`
	TotalUnderfunded      int64               `json:"total_underfunded"`
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

	// 6. Load category targets active for this month
	var targets []models.CategoryTarget
	s.db.Where("effective_from <= ? AND (effective_to IS NULL OR effective_to > ?)", month, month).Find(&targets)
	targetMap := make(map[uint]models.CategoryTarget)
	for _, t := range targets {
		targetMap[t.CategoryID] = t
	}

	// 7. Build category rows
	rows := make([]BudgetCategoryRow, 0, len(categories))
	var totalAssigned int64
	var cumulativeTotalAssigned int64
	var totalUnderfunded int64
	for _, cat := range categories {
		assigned := monthAllocMap[cat.ID]
		activity := monthExpenseMap[cat.ID]
		cumAssigned := cumAllocMap[cat.ID]
		cumActivity := cumExpenseMap[cat.ID]
		available := cumAssigned - cumActivity

		totalAssigned += assigned
		cumulativeTotalAssigned += cumAssigned

		row := BudgetCategoryRow{
			CategoryID:   cat.ID,
			CategoryName: cat.Name,
			Colour:       cat.Colour,
			Assigned:     assigned,
			Activity:     activity,
			Available:    available,
		}

		if target, ok := targetMap[cat.ID]; ok {
			row.TargetType = &target.TargetType
			row.TargetAmount = &target.TargetAmount
			row.TargetDate = target.TargetDate
			uf := computeUnderfunded(target, assigned, available, month)
			row.Underfunded = &uf
			totalUnderfunded += uf
		}

		rows = append(rows, row)
	}

	readyToAssign := income.CumulativeIncome - cumulativeTotalAssigned

	return &BudgetResponse{
		Month:                 month,
		Income:                income.MonthIncome,
		TotalAssigned:         totalAssigned,
		ReadyToAssign:         readyToAssign,
		TotalUnderfunded:      totalUnderfunded,
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

func (s *BudgetService) SetCategoryTarget(categoryID uint, month string, targetType string, targetAmount int64, targetDate *string) (*models.CategoryTarget, error) {
	var cat models.Category
	if err := s.db.First(&cat, categoryID).Error; err != nil {
		return nil, err
	}

	// Close any active target that covers this month
	s.closeActiveTarget(categoryID, month)

	target := models.CategoryTarget{
		CategoryID:    categoryID,
		TargetType:    targetType,
		TargetAmount:  targetAmount,
		TargetDate:    targetDate,
		EffectiveFrom: month,
	}
	if err := s.db.Create(&target).Error; err != nil {
		return nil, err
	}
	return &target, nil
}

func (s *BudgetService) DeleteCategoryTarget(categoryID uint, month string) error {
	var target models.CategoryTarget
	err := s.db.Where("category_id = ? AND effective_from <= ? AND (effective_to IS NULL OR effective_to > ?)",
		categoryID, month, month).First(&target).Error
	if err != nil {
		return gorm.ErrRecordNotFound
	}

	if target.EffectiveFrom == month {
		// Target started this month — just delete it entirely
		return s.db.Delete(&target).Error
	}
	// Target started before this month — close it at this month
	return s.db.Model(&target).Update("effective_to", month).Error
}

// closeActiveTarget closes any active target for a category at the given month.
func (s *BudgetService) closeActiveTarget(categoryID uint, month string) {
	var existing models.CategoryTarget
	err := s.db.Where("category_id = ? AND effective_from <= ? AND (effective_to IS NULL OR effective_to > ?)",
		categoryID, month, month).First(&existing).Error
	if err != nil {
		return
	}
	if existing.EffectiveFrom == month {
		// Same start month — replace entirely
		s.db.Delete(&existing)
	} else {
		s.db.Model(&existing).Update("effective_to", month)
	}
}

func computeUnderfunded(target models.CategoryTarget, assigned int64, available int64, currentMonth string) int64 {
	switch target.TargetType {
	case "monthly_savings":
		uf := target.TargetAmount - assigned
		if uf < 0 {
			return 0
		}
		return uf

	case "savings_balance", "spending_by_date":
		shortfall := target.TargetAmount - available
		if shortfall <= 0 {
			return 0
		}
		if target.TargetDate == nil {
			// No date set — treat as needing full shortfall now
			uf := shortfall - assigned
			if uf < 0 {
				return 0
			}
			return uf
		}

		current, _ := time.Parse("2006-01", currentMonth)
		targetTime, _ := time.Parse("2006-01", *target.TargetDate)

		// Count months remaining (including target month)
		months := monthsBetween(current, targetTime)
		if months <= 0 {
			// Target date passed or is current month — need full remaining shortfall
			uf := shortfall
			if uf < 0 {
				return 0
			}
			return uf
		}

		monthlyNeeded := int64(math.Ceil(float64(shortfall) / float64(months)))
		uf := monthlyNeeded - assigned
		if uf < 0 {
			return 0
		}
		return uf

	default:
		return 0
	}
}

func monthsBetween(from, to time.Time) int {
	years := to.Year() - from.Year()
	months := int(to.Month()) - int(from.Month())
	return years*12 + months
}

func monthDateRange(month string) (string, string) {
	t, _ := time.Parse("2006-01", month)
	first := t.Format("2006-01-02")
	last := t.AddDate(0, 1, -1).Format("2006-01-02")
	return first, last
}
