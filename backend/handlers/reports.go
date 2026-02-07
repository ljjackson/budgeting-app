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
	params := services.ReportParams{
		DateFrom: c.Query("date_from"),
		DateTo:   c.Query("date_to"),
		Type:     c.Query("type"),
	}
	results, err := h.service.ByCategory(params)
	if err != nil {
		respondServerError(c, err, "Failed to generate category report")
		return
	}
	c.JSON(http.StatusOK, results)
}

func (h *ReportHandler) ByAccount(c *gin.Context) {
	params := services.ReportParams{
		DateFrom: c.Query("date_from"),
		DateTo:   c.Query("date_to"),
		Type:     c.Query("type"),
	}
	results, err := h.service.ByAccount(params)
	if err != nil {
		respondServerError(c, err, "Failed to generate account report")
		return
	}
	c.JSON(http.StatusOK, results)
}
