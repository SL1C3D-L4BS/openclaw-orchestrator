package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/vericore/openclaw-orchestrator/data"
	"github.com/vericore/openclaw-orchestrator/internal/signing"
	"github.com/vericore/openclaw-orchestrator/models"
	"github.com/vericore/openclaw-orchestrator/orchestrator"
)

func main() {
	app := fiber.New(fiber.Config{DisableStartupMessage: false})
	app.Use(logger.New())
	app.Use(cors.New())

	// Root and health — so opening http://localhost:8080 in a browser shows something
	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"service": "OpenClaw Skill Orchestrator API",
			"version": "1.0",
			"endpoints": fiber.Map{
				"GET  /api/v1/skills/templates": "List seed skill templates",
				"POST /api/v1/skills/validate":  "Validate a skill manifest (JSON body)",
				"POST /api/v1/skills/export":   "Export signed JSONL (JSON body)",
			},
			"docs": "Use the web app at /api-playground to try the API.",
		})
	})
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// GET /api/v1/skills/templates — returns seed templates for the playground (explicit route)
	app.Get("/api/v1/skills/templates", func(c *fiber.Ctx) error {
		return c.JSON(data.GetSeedTemplates())
	})

	api := app.Group("/api/v1")
	skills := api.Group("/skills")

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

	log.Println("OpenClaw Skill Orchestrator API listening on :8080")
	if err := app.Listen(":8080"); err != nil {
		log.Fatal(err)
	}
}
