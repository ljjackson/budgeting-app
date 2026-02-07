package handlers

import (
	"budgetting-app/backend/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ReportHandler struct {
	service *services.ReportService
}

func NewReportHandler(svc *services.ReportService) *ReportHandler {
	return &ReportHandler{service: svc}
}

func (h *ReportHandler) ByCategory(c *gin.Context) {
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")
	txnType := c.Query("type")

	if dateFrom != "" && !validateDate(dateFrom) {
		respondError(c, http.StatusBadRequest, "Invalid date_from format. Must be YYYY-MM-DD")
		return
	}
	if dateTo != "" && !validateDate(dateTo) {
		respondError(c, http.StatusBadRequest, "Invalid date_to format. Must be YYYY-MM-DD")
		return
	}
	if txnType != "" && !validateTxnType(txnType) {
		respondError(c, http.StatusBadRequest, "Invalid type. Must be one of: income, expense")
		return
	}

	params := services.ReportParams{
		DateFrom: dateFrom,
		DateTo:   dateTo,
		Type:     txnType,
	}
	results, err := h.service.ByCategory(params)
	if err != nil {
		respondServerError(c, err, "Failed to generate category report")
		return
	}
	c.JSON(http.StatusOK, results)
}

func (h *ReportHandler) ByAccount(c *gin.Context) {
	dateFrom := c.Query("date_from")
	dateTo := c.Query("date_to")
	txnType := c.Query("type")

	if dateFrom != "" && !validateDate(dateFrom) {
		respondError(c, http.StatusBadRequest, "Invalid date_from format. Must be YYYY-MM-DD")
		return
	}
	if dateTo != "" && !validateDate(dateTo) {
		respondError(c, http.StatusBadRequest, "Invalid date_to format. Must be YYYY-MM-DD")
		return
	}
	if txnType != "" && !validateTxnType(txnType) {
		respondError(c, http.StatusBadRequest, "Invalid type. Must be one of: income, expense")
		return
	}

	params := services.ReportParams{
		DateFrom: dateFrom,
		DateTo:   dateTo,
		Type:     txnType,
	}
	results, err := h.service.ByAccount(params)
	if err != nil {
		respondServerError(c, err, "Failed to generate account report")
		return
	}
	c.JSON(http.StatusOK, results)
}
