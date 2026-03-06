package main

import (
	"bufio"
	"context"
	"log"
	"os"
	"path/filepath"

	onboardinghandler "github.com/vericore/openclaw-orchestrator/api/v1/onboarding"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	crisishandler "github.com/vericore/openclaw-orchestrator/api/v1/crisis"
	"github.com/vericore/openclaw-orchestrator/data"
	"github.com/vericore/openclaw-orchestrator/internal/auth"
	"github.com/vericore/openclaw-orchestrator/internal/config"
	clinical "github.com/vericore/openclaw-orchestrator/internal/clinical/crisis"
	"github.com/vericore/openclaw-orchestrator/internal/onboarding"
	"github.com/vericore/openclaw-orchestrator/internal/signing"
	"github.com/vericore/openclaw-orchestrator/models"
	"github.com/vericore/openclaw-orchestrator/orchestrator"
	"github.com/vericore/openclaw-orchestrator/runner"
)

func main() {
	cfg := config.LoadConfig()

	app := fiber.New(fiber.Config{DisableStartupMessage: false})
	app.Use(logger.New())
	app.Use(cors.New())

	// Root and health — so opening http://localhost:8080 in a browser shows something
	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"service": "OpenClaw Skill Orchestrator API",
			"version": "1.0",
			"endpoints": fiber.Map{
				"GET  /api/v1/skills/templates":   "List 988 clinical workflow templates",
				"POST /api/v1/skills/validate":    "Validate a skill manifest (JSON body)",
				"POST /api/v1/skills/export":      "Export signed JSONL (JSON body)",
				"POST /api/v1/skills/run":         "Run manifest (JSON body), SSE stream of logs",
				"GET  /api/v1/crisis/workflows":   "List active crisis workflows",
				"POST /api/v1/crisis/workflows":   "Create crisis workflow",
				"POST /api/v1/crisis/workflows/:id/version": "New version (archive previous, create active)",
				"POST /api/v1/crisis/workflows/:id/run":     "Run workflow (SSE)",
				"POST /api/v1/onboarding/generate":           "Start tutorial job (body: workflow_id)",
				"GET  /api/v1/onboarding/status/:id":         "Job progress & script",
			},
			"docs": "Use the web app at /api-playground to try the API.",
		})
	})
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// POST /api/v1/auth/login — temporary: returns JWT for test_director / test_responder
	api := app.Group("/api/v1")
	api.Post("/auth/login", auth.LoginHandler(cfg.JWTSecret))

	// GET /api/v1/skills/templates — returns seed templates for the playground (explicit route)
	app.Get("/api/v1/skills/templates", func(c *fiber.Ctx) error {
		return c.JSON(data.GetSeedTemplates())
	})

	// Durable persistence: CGO-free SQLite at cfg.DBPath
	dataDir := filepath.Dir(cfg.DBPath)
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		log.Fatalf("create data dir: %v", err)
	}
	crisisStore, err := clinical.NewSQLiteStore(cfg.DBPath)
	if err != nil {
		log.Fatalf("open crisis store: %v", err)
	}
	onboardingJobStore, err := onboarding.NewSQLiteStore(cfg.DBPath)
	if err != nil {
		log.Fatalf("open onboarding store: %v", err)
	}

	skills := api.Group("/skills")

	// Crisis workflows (clinical domain): RBAC-protected
	crisisH := crisishandler.Handler{Store: crisisStore}
	crisisGroup := api.Group("/crisis/workflows")
	crisisGroup.Get("/", auth.RequireRole(cfg.JWTSecret, auth.RoleResponder), crisisH.ListWorkflows)
	crisisGroup.Post("/", auth.RequireRole(cfg.JWTSecret, auth.RoleClinicalDirector), crisisH.CreateWorkflow)
	crisisGroup.Post("/:id/version", auth.RequireRole(cfg.JWTSecret, auth.RoleClinicalDirector), crisisH.VersionWorkflow)
	crisisGroup.Post("/:id/run", auth.RequireRole(cfg.JWTSecret, auth.RoleResponder), crisisH.RunWorkflow)

	// Onboarding: tutorial generation from crisis workflows
	onboardingWorker := onboarding.NewWorker(onboardingJobStore)
	go onboardingWorker.Run(context.Background())
	onboardingH := onboardinghandler.Handler{
		CrisisStore: crisisStore,
		JobStore:    onboardingJobStore,
		Worker:      onboardingWorker,
	}
	onboardingGroup := api.Group("/onboarding")
	onboardingGroup.Post("/generate", onboardingH.Generate)
	onboardingGroup.Get("/status/:id", onboardingH.Status)

	// POST /api/v1/skills/validate — checks if the skill chain is logical (no infinite loops)
	skills.Post("/validate", func(c *fiber.Ctx) error {
		var manifest models.SkillManifest
		if err := c.BodyParser(&manifest); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid JSON body",
			})
		}
		result := orchestrator.ValidateSkillChain(manifest)
		return c.JSON(result)
	})

	// POST /api/v1/skills/export — returns the signed JSONL file (Verified Creator)
	skills.Post("/export", func(c *fiber.Ctx) error {
		var manifest models.SkillManifest
		if err := c.BodyParser(&manifest); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid JSON body",
			})
		}
		signer := signing.DefaultSigner{}
		jsonl, err := orchestrator.ExportToJSONL(manifest, signer)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		c.Set("Content-Type", "application/x-ndjson")
		c.Set("Content-Disposition", "attachment; filename=skill.jsonl")
		return c.Send(jsonl)
	})

	// POST /api/v1/skills/run — run manifest and stream logs via SSE
	skills.Post("/run", func(c *fiber.Ctx) error {
		var manifest models.SkillManifest
		if err := c.BodyParser(&manifest); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid JSON body",
			})
		}
		c.Set("Content-Type", "text/event-stream")
		c.Set("Cache-Control", "no-cache")
		c.Set("Connection", "keep-alive")
		c.Set("X-Accel-Buffering", "no")
		logChan := make(chan string, 64)
		go runner.ExecuteManifest(manifest, logChan)
		c.Context().SetBodyStreamWriter(func(w *bufio.Writer) {
			for msg := range logChan {
				w.WriteString("data: ")
				w.WriteString(msg)
				w.WriteString("\n\n")
				w.Flush()
			}
		})
		return nil
	})

	addr := ":" + cfg.Port
	log.Println("OpenClaw Skill Orchestrator API listening on", addr)
	if err := app.Listen(addr); err != nil {
		log.Fatal(err)
	}
}
