package config

import (
	"os"
	"strings"
)

type Config struct {
	Port        string
	DBPath      string
	CORSOrigins []string
	APIKey      string
}

func Load() Config {
	cfg := Config{
		Port:        ":8080",
		DBPath:      "budgetting.db",
		CORSOrigins: []string{"http://localhost:5173"},
	}

	if p := os.Getenv("PORT"); p != "" {
		cfg.Port = ":" + p
	}
	if d := os.Getenv("DB_PATH"); d != "" {
		cfg.DBPath = d
	}
	if o := os.Getenv("CORS_ORIGINS"); o != "" {
		cfg.CORSOrigins = strings.Split(o, ",")
	}
	if k := os.Getenv("API_KEY"); k != "" {
		cfg.APIKey = k
	}

	return cfg
}
