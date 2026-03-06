package config

import (
	"log"
	"os"
)

// Config holds application configuration loaded from the environment.
type Config struct {
	Port        string // HTTP server port (e.g. "8080")
	JWTSecret   string // Secret for signing/validating JWTs; required in production
	DBPath      string // Path to SQLite database file
	LogLevel    string // Log level: debug, info, warn, error
	Environment string // development, staging, production
	FrontendURL string // Allowed frontend origin (e.g. http://localhost:3000)
}

const (
	envPort        = "PORT"
	envJWTSecret   = "JWT_SECRET"
	envDBPath      = "DB_PATH"
	envLogLevel    = "LOG_LEVEL"
	envEnvironment = "ENVIRONMENT"
	envFrontendURL = "FRONTEND_URL"

	defaultPort        = "8080"
	defaultDBPath      = "./data/openclaw.db"
	defaultLogLevel    = "info"
	defaultEnvironment = "development"
	defaultFrontendURL = "http://localhost:3000"

	// Forbidden in production: well-known dev default so we never boot prod with it.
	devSecretSentinel = "openclaw-dev-secret-change-in-production"
)

// LoadConfig loads configuration from the environment and applies defaults.
// If Environment is "production", JWT_SECRET must be set and must not be the dev sentinel.
func LoadConfig() *Config {
	port := os.Getenv(envPort)
	if port == "" {
		port = defaultPort
	}
	jwtSecret := os.Getenv(envJWTSecret)
	dbPath := os.Getenv(envDBPath)
	if dbPath == "" {
		dbPath = defaultDBPath
	}
	logLevel := os.Getenv(envLogLevel)
	if logLevel == "" {
		logLevel = defaultLogLevel
	}
	environment := os.Getenv(envEnvironment)
	if environment == "" {
		environment = defaultEnvironment
	}
	frontendURL := os.Getenv(envFrontendURL)
	if frontendURL == "" {
		frontendURL = defaultFrontendURL
	}

	cfg := &Config{
		Port:        port,
		JWTSecret:   jwtSecret,
		DBPath:      dbPath,
		LogLevel:    logLevel,
		Environment: environment,
		FrontendURL: frontendURL,
	}

	if environment == "production" {
		if cfg.JWTSecret == "" || cfg.JWTSecret == devSecretSentinel {
			log.Fatalf("FATAL: JWT_SECRET is required in production environment")
		}
	}

	// In non-production, if JWT_SECRET is unset, use dev sentinel so local dev works
	if cfg.JWTSecret == "" {
		cfg.JWTSecret = devSecretSentinel
	}

	return cfg
}
