package main

import (
	"budgetting-app/backend/database"
	"budgetting-app/backend/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	database.Connect()

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		AllowCredentials: true,
	}))

	api := r.Group("/api")
	{
		api.GET("/accounts", handlers.ListAccounts)
		api.POST("/accounts", handlers.CreateAccount)
		api.PUT("/accounts/:id", handlers.UpdateAccount)
		api.DELETE("/accounts/:id", handlers.DeleteAccount)

		api.GET("/categories", handlers.ListCategories)
		api.POST("/categories", handlers.CreateCategory)
		api.PUT("/categories/:id", handlers.UpdateCategory)
		api.DELETE("/categories/:id", handlers.DeleteCategory)

		api.GET("/transactions", handlers.ListTransactions)
		api.POST("/transactions", handlers.CreateTransaction)
		api.PUT("/transactions/:id", handlers.UpdateTransaction)
		api.DELETE("/transactions/:id", handlers.DeleteTransaction)
		api.POST("/transactions/import", handlers.ImportCSV)

		api.GET("/reports/by-category", handlers.ReportByCategory)
		api.GET("/reports/by-account", handlers.ReportByAccount)
	}

	r.Run(":8080")
}
