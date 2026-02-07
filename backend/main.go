package main

import (
	"budgetting-app/backend/config"
	"budgetting-app/backend/database"
	"budgetting-app/backend/handlers"
	"budgetting-app/backend/services"
	"log"
	"os"
	"path/filepath"

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

	r.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORSOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		ExposeHeaders:    []string{"X-Total-Count"},
		AllowCredentials: true,
	}))

	api := r.Group("/api")
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

	r.Run(cfg.Port)
}
