package main

import (
	"budgetting-app/backend/config"
	"budgetting-app/backend/database"
	"budgetting-app/backend/handlers"
	"budgetting-app/backend/services"
	"context"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	db, err := database.Connect(cfg.DBPath)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Services
	accountSvc := services.NewAccountService(db)
	categorySvc := services.NewCategoryService(db)
	transactionSvc := services.NewTransactionService(db)
	budgetSvc := services.NewBudgetService(db)
	reportSvc := services.NewReportService(db)

	// Handlers
	accountH := handlers.NewAccountHandler(accountSvc)
	categoryH := handlers.NewCategoryHandler(categorySvc)
	transactionH := handlers.NewTransactionHandler(transactionSvc)
	budgetH := handlers.NewBudgetHandler(budgetSvc)
	reportH := handlers.NewReportHandler(reportSvc)

	r := gin.Default()
	r.MaxMultipartMemory = 8 << 20

	r.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORSOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "X-API-Key"},
		ExposeHeaders:    []string{"X-Total-Count"},
		AllowCredentials: true,
	}))

	// Health check
	sqlDB, _ := db.DB()
	r.GET("/health", func(c *gin.Context) {
		if err := sqlDB.Ping(); err != nil {
			slog.Error("Health check failed", "error", err)
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "unhealthy"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})

	api := r.Group("/api")

	// Optional API key auth
	if cfg.APIKey != "" {
		api.Use(func(c *gin.Context) {
			if c.GetHeader("X-API-Key") != cfg.APIKey {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or missing API key"})
				return
			}
			c.Next()
		})
	}

	{
		api.GET("/accounts", accountH.List)
		api.POST("/accounts", accountH.Create)
		api.PUT("/accounts/:id", accountH.Update)
		api.DELETE("/accounts/:id", accountH.Delete)

		api.GET("/categories", categoryH.List)
		api.POST("/categories", categoryH.Create)
		api.PUT("/categories/:id", categoryH.Update)
		api.DELETE("/categories/:id", categoryH.Delete)

		api.GET("/transactions", transactionH.List)
		api.POST("/transactions", transactionH.Create)
		api.PUT("/transactions/:id", transactionH.Update)
		api.DELETE("/transactions/:id", transactionH.Delete)
		api.PUT("/transactions/bulk-category", transactionH.BulkUpdateCategory)
		api.POST("/transactions/import", transactionH.ImportCSV)

		api.GET("/reports/by-category", reportH.ByCategory)
		api.GET("/reports/by-account", reportH.ByAccount)

		api.GET("/budget", budgetH.GetBudget)
		api.PUT("/budget/allocate", budgetH.AllocateBudget)
		api.PUT("/budget/allocate-bulk", budgetH.AllocateBulk)
		api.GET("/budget/category-average", budgetH.GetCategoryAverage)
		api.PUT("/categories/:id/target", budgetH.SetCategoryTarget)
		api.DELETE("/categories/:id/target", budgetH.DeleteCategoryTarget)
	}

	// Serve frontend static files when STATIC_DIR is set (production / Docker)
	if staticDir := os.Getenv("STATIC_DIR"); staticDir != "" {
		r.Static("/assets", filepath.Join(staticDir, "assets"))
		r.StaticFile("/vite.svg", filepath.Join(staticDir, "vite.svg"))
		r.NoRoute(func(c *gin.Context) {
			c.File(filepath.Join(staticDir, "index.html"))
		})
	}

	// Graceful shutdown
	srv := &http.Server{
		Addr:    cfg.Port,
		Handler: r,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	slog.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	slog.Info("Server exited")
}
