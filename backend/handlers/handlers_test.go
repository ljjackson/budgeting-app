package handlers

import (
	"budgetting-app/backend/services"
	"budgetting-app/backend/testutil"
	"encoding/json"
	"net/http"
	"net/http/httptest"
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
