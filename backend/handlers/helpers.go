package handlers

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func parseID(c *gin.Context) (uint, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		respondError(c, http.StatusBadRequest, "Invalid ID")
		return 0, false
	}
	return uint(id), true
}

func respondError(c *gin.Context, status int, msg string) {
	c.JSON(status, gin.H{"error": msg})
}

func respondServerError(c *gin.Context, err error, publicMsg string) {
	log.Printf("ERROR: %s: %v", publicMsg, err)
	c.JSON(http.StatusInternalServerError, gin.H{"error": publicMsg})
}
