package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/vericore/openclaw-orchestrator/internal/signing"
	"github.com/vericore/openclaw-orchestrator/models"
	"github.com/vericore/openclaw-orchestrator/orchestrator"
)

func main() {
	app := fiber.New(fiber.Config{DisableStartupMessage: false})
	app.Use(logger.New())
	app.Use(cors.New())

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
