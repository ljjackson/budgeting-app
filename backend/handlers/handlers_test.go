package handlers

import (
	"budgetting-app/backend/models"
	"budgetting-app/backend/services"
	"budgetting-app/backend/testutil"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func setupAccountRouter(t *testing.T) (*gin.Engine, *services.AccountService) {
	t.Helper()
	db := testutil.SetupTestDB(t)
	svc := services.NewAccountService(db)
	h := NewAccountHandler(svc)

	r := gin.New()
	r.GET("/accounts", h.List)
	r.POST("/accounts", h.Create)
	r.PUT("/accounts/:id", h.Update)
	r.DELETE("/accounts/:id", h.Delete)
	return r, svc
}

func TestAccountHandler_Create(t *testing.T) {
	r, _ := setupAccountRouter(t)

	body := `{"name":"Test Account","type":"checking"}`
	req := httptest.NewRequest("POST", "/accounts", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d: %s", w.Code, w.Body.String())
	}
}

func TestAccountHandler_CreateInvalidType(t *testing.T) {
	r, _ := setupAccountRouter(t)

	body := `{"name":"Test","type":"invalid"}`
	req := httptest.NewRequest("POST", "/accounts", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestAccountHandler_DeleteNotFound(t *testing.T) {
	r, _ := setupAccountRouter(t)

	req := httptest.NewRequest("DELETE", "/accounts/999", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", w.Code)
	}
}

func TestAccountHandler_InvalidID(t *testing.T) {
	r, _ := setupAccountRouter(t)

	req := httptest.NewRequest("DELETE", "/accounts/abc", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func setupTransactionRouter(t *testing.T) *gin.Engine {
	t.Helper()
	db := testutil.SetupTestDB(t)
	svc := services.NewTransactionService(db)
	h := NewTransactionHandler(svc)

	r := gin.New()
	r.GET("/transactions", h.List)
	r.POST("/transactions", h.Create)
	r.PUT("/transactions/:id", h.Update)
	r.DELETE("/transactions/:id", h.Delete)
	return r
}

func TestTransactionHandler_List(t *testing.T) {
	r := setupTransactionRouter(t)

	req := httptest.NewRequest("GET", "/transactions", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	totalCount := w.Header().Get("X-Total-Count")
	if totalCount != "0" {
		t.Errorf("expected X-Total-Count 0, got %s", totalCount)
	}
}

func TestTransactionHandler_CreateValidation(t *testing.T) {
	r := setupTransactionRouter(t)

	// Missing required fields
	body := `{"amount":1000}`
	req := httptest.NewRequest("POST", "/transactions", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestTransactionHandler_UpdateNotFound(t *testing.T) {
	r := setupTransactionRouter(t)

	body := `{"amount":1000}`
	req := httptest.NewRequest("PUT", "/transactions/999", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", w.Code)
	}
}

func TestTransactionHandler_ErrorFormat(t *testing.T) {
	r := setupTransactionRouter(t)

	body := `{"amount":1000}`
	req := httptest.NewRequest("POST", "/transactions", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	var resp map[string]string
	json.Unmarshal(w.Body.Bytes(), &resp)
	if _, ok := resp["error"]; !ok {
		t.Error("expected error field in response")
	}
}

// --- Category handler tests ---

func setupCategoryRouter(t *testing.T) *gin.Engine {
	t.Helper()
	db := testutil.SetupTestDB(t)
	svc := services.NewCategoryService(db)
	h := NewCategoryHandler(svc)

	r := gin.New()
	r.GET("/categories", h.List)
	r.POST("/categories", h.Create)
	r.PUT("/categories/:id", h.Update)
	r.DELETE("/categories/:id", h.Delete)
	return r
}

func TestCategoryHandler_Create(t *testing.T) {
	r := setupCategoryRouter(t)

	body := `{"name":"Food","colour":"#FF5733"}`
	req := httptest.NewRequest("POST", "/categories", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d: %s", w.Code, w.Body.String())
	}
}

func TestCategoryHandler_CreateInvalidColour(t *testing.T) {
	r := setupCategoryRouter(t)

	body := `{"name":"Food","colour":"not-a-colour"}`
	req := httptest.NewRequest("POST", "/categories", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestCategoryHandler_DeleteNotFound(t *testing.T) {
	r := setupCategoryRouter(t)

	req := httptest.NewRequest("DELETE", "/categories/999", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", w.Code)
	}
}

func TestCategoryHandler_DeleteWithReferences(t *testing.T) {
	db := testutil.SetupTestDB(t)
	categorySvc := services.NewCategoryService(db)
	h := NewCategoryHandler(categorySvc)

	r := gin.New()
	r.DELETE("/categories/:id", h.Delete)

	// Create category + budget allocation to reference it
	cat := models.Category{Name: "Food", Colour: "#FF0000"}
	db.Create(&cat)
	db.Create(&models.BudgetAllocation{Month: "2024-01", CategoryID: cat.ID, Amount: 5000})

	req := httptest.NewRequest("DELETE", "/categories/"+strconv.FormatUint(uint64(cat.ID), 10), nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusConflict {
		t.Errorf("expected 409, got %d: %s", w.Code, w.Body.String())
	}
}

func TestCategoryHandler_UpdateNotFound(t *testing.T) {
	r := setupCategoryRouter(t)

	body := `{"name":"Updated","colour":"#000000"}`
	req := httptest.NewRequest("PUT", "/categories/999", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", w.Code)
	}
}

func TestCategoryHandler_InvalidID(t *testing.T) {
	r := setupCategoryRouter(t)

	req := httptest.NewRequest("DELETE", "/categories/abc", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

// --- Budget handler tests ---

func setupBudgetRouter(t *testing.T) *gin.Engine {
	t.Helper()
	db := testutil.SetupTestDB(t)
	svc := services.NewBudgetService(db)
	h := NewBudgetHandler(svc)

	r := gin.New()
	r.GET("/budget", h.GetBudget)
	r.PUT("/budget/allocate", h.AllocateBudget)
	r.PUT("/budget/allocate-bulk", h.AllocateBulk)
	r.GET("/budget/category-average", h.GetCategoryAverage)
	r.PUT("/categories/:id/target", h.SetCategoryTarget)
	r.DELETE("/categories/:id/target", h.DeleteCategoryTarget)
	return r
}

func TestBudgetHandler_GetBudgetMissingMonth(t *testing.T) {
	r := setupBudgetRouter(t)

	req := httptest.NewRequest("GET", "/budget", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestBudgetHandler_GetBudgetInvalidMonth(t *testing.T) {
	r := setupBudgetRouter(t)

	req := httptest.NewRequest("GET", "/budget?month=not-a-month", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestBudgetHandler_GetBudgetValid(t *testing.T) {
	r := setupBudgetRouter(t)

	req := httptest.NewRequest("GET", "/budget?month=2024-01", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

func TestBudgetHandler_AllocateMissingCategoryID(t *testing.T) {
	r := setupBudgetRouter(t)

	body := `{"month":"2024-01","amount":5000}`
	req := httptest.NewRequest("PUT", "/budget/allocate", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d: %s", w.Code, w.Body.String())
	}
}

func TestBudgetHandler_AllocateNegativeAmount(t *testing.T) {
	r := setupBudgetRouter(t)

	body := `{"month":"2024-01","category_id":1,"amount":-100}`
	req := httptest.NewRequest("PUT", "/budget/allocate", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d: %s", w.Code, w.Body.String())
	}
}

func TestBudgetHandler_AllocateBulkEmpty(t *testing.T) {
	r := setupBudgetRouter(t)

	body := `{"month":"2024-01","allocations":[]}`
	req := httptest.NewRequest("PUT", "/budget/allocate-bulk", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d: %s", w.Code, w.Body.String())
	}
}

func TestBudgetHandler_AllocateBulkInvalidMonth(t *testing.T) {
	r := setupBudgetRouter(t)

	body := `{"month":"bad","allocations":[{"category_id":1,"amount":100}]}`
	req := httptest.NewRequest("PUT", "/budget/allocate-bulk", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d: %s", w.Code, w.Body.String())
	}
}

func TestBudgetHandler_SetTargetValidation(t *testing.T) {
	r := setupBudgetRouter(t)

	// Missing month
	body := `{"target_type":"monthly_savings","target_amount":5000}`
	req := httptest.NewRequest("PUT", "/categories/1/target", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for missing month, got %d", w.Code)
	}
}

func TestBudgetHandler_SetTargetInvalidType(t *testing.T) {
	r := setupBudgetRouter(t)

	body := `{"month":"2024-01","target_type":"invalid","target_amount":5000}`
	req := httptest.NewRequest("PUT", "/categories/1/target", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestBudgetHandler_SetTargetZeroAmount(t *testing.T) {
	r := setupBudgetRouter(t)

	body := `{"month":"2024-01","target_type":"monthly_savings","target_amount":0}`
	req := httptest.NewRequest("PUT", "/categories/1/target", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d: %s", w.Code, w.Body.String())
	}
}

func TestBudgetHandler_DeleteTargetInvalidMonth(t *testing.T) {
	r := setupBudgetRouter(t)

	req := httptest.NewRequest("DELETE", "/categories/1/target?month=bad", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestBudgetHandler_CategoryAverageMissingParams(t *testing.T) {
	r := setupBudgetRouter(t)

	req := httptest.NewRequest("GET", "/budget/category-average", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

// --- Report handler tests ---

func setupReportRouter(t *testing.T) *gin.Engine {
	t.Helper()
	db := testutil.SetupTestDB(t)
	svc := services.NewReportService(db)
	h := NewReportHandler(svc)

	r := gin.New()
	r.GET("/reports/by-category", h.ByCategory)
	r.GET("/reports/by-account", h.ByAccount)
	return r
}

func TestReportHandler_ByCategoryEmpty(t *testing.T) {
	r := setupReportRouter(t)

	req := httptest.NewRequest("GET", "/reports/by-category", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestReportHandler_ByCategoryInvalidDate(t *testing.T) {
	r := setupReportRouter(t)

	req := httptest.NewRequest("GET", "/reports/by-category?date_from=not-a-date", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestReportHandler_ByCategoryInvalidType(t *testing.T) {
	r := setupReportRouter(t)

	req := httptest.NewRequest("GET", "/reports/by-category?type=invalid", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestReportHandler_ByAccountEmpty(t *testing.T) {
	r := setupReportRouter(t)

	req := httptest.NewRequest("GET", "/reports/by-account", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestReportHandler_ByAccountInvalidDate(t *testing.T) {
	r := setupReportRouter(t)

	req := httptest.NewRequest("GET", "/reports/by-account?date_to=bad", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestReportHandler_ByAccountInvalidType(t *testing.T) {
	r := setupReportRouter(t)

	req := httptest.NewRequest("GET", "/reports/by-account?type=bogus", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}
