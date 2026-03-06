package crisis

import (
	"bufio"
	"encoding/json"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	clinical "github.com/vericore/openclaw-orchestrator/internal/clinical/crisis"
	"github.com/vericore/openclaw-orchestrator/models"
	"github.com/vericore/openclaw-orchestrator/runner"
)

// Handler holds dependencies for crisis workflow HTTP handlers.
type Handler struct {
	Store clinical.Store
}

// ListWorkflows returns all active crisis workflows.
// GET /api/v1/crisis/workflows
func (h *Handler) ListWorkflows(c *fiber.Ctx) error {
	list, err := h.Store.ListActive(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(list)
}

// CreateWorkflowRequest is the body for creating a new workflow.
type CreateWorkflowRequest struct {
	WorkflowJSON json.RawMessage `json:"workflow_json"`
}

// CreateWorkflow creates a new crisis workflow (Version 1, Active).
// POST /api/v1/crisis/workflows
func (h *Handler) CreateWorkflow(c *fiber.Ctx) error {
	var req CreateWorkflowRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid JSON body"})
	}
	if len(req.WorkflowJSON) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "workflow_json is required"})
	}
	if err := clinical.ValidateClinicalGraph(req.WorkflowJSON); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	id := uuid.New().String()
	w := clinical.CrisisWorkflow{
		ID:           id,
		Version:      1,
		WorkflowJSON: req.WorkflowJSON,
		CreatedAt:    time.Now().UTC(),
		Status:       clinical.StatusActive,
	}
	if err := h.Store.Create(c.Context(), w); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(w)
}

// VersionWorkflowRequest is the body for creating a new version (override).
type VersionWorkflowRequest struct {
	WorkflowJSON json.RawMessage `json:"workflow_json"`
}

// VersionWorkflow archives the current active version and saves a new active version.
// POST /api/v1/crisis/workflows/:id/version
func (h *Handler) VersionWorkflow(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id is required"})
	}
	var req VersionWorkflowRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid JSON body"})
	}
	if len(req.WorkflowJSON) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "workflow_json is required"})
	}
	if err := clinical.ValidateClinicalGraph(req.WorkflowJSON); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	active, err := h.Store.GetActive(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	if active == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "workflow not found"})
	}
	if err := h.Store.ArchiveActive(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	next := clinical.CrisisWorkflow{
		ID:           id,
		Version:      active.Version + 1,
		WorkflowJSON: req.WorkflowJSON,
		CreatedAt:    time.Now().UTC(),
		Status:       clinical.StatusActive,
	}
	if err := h.Store.Create(c.Context(), next); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(next)
}

// RunWorkflow retrieves the active workflow by ID, parses WorkflowJSON into a manifest,
// and streams execution via SSE using the existing Orchestrator runner.
// POST /api/v1/crisis/workflows/:id/run
func (h *Handler) RunWorkflow(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id is required"})
	}
	active, err := h.Store.GetActive(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	if active == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "workflow not found"})
	}
	var manifest models.SkillManifest
	if err := json.Unmarshal(active.WorkflowJSON, &manifest); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid workflow_json: " + err.Error(),
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
}
