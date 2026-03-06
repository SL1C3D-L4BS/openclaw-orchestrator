package onboarding

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	clinical "github.com/vericore/openclaw-orchestrator/internal/clinical/crisis"
	onboardingpkg "github.com/vericore/openclaw-orchestrator/internal/onboarding"
)

// Handler holds dependencies for onboarding HTTP handlers.
type Handler struct {
	CrisisStore clinical.Store
	JobStore    onboardingpkg.JobStore
	Worker      *onboardingpkg.Worker
}

// GenerateRequest is the body for POST /generate.
type GenerateRequest struct {
	WorkflowID string `json:"workflow_id"`
}

// Generate creates a job, starts the worker, and returns job_id.
// POST /api/v1/onboarding/generate
func (h *Handler) Generate(c *fiber.Ctx) error {
	var req GenerateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid JSON body"})
	}
	if req.WorkflowID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "workflow_id is required"})
	}
	active, err := h.CrisisStore.GetActive(context.Background(), req.WorkflowID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	if active == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "workflow not found"})
	}

	jobID := uuid.New().String()
	job := &onboardingpkg.OnboardingJob{
		ID:           jobID,
		WorkflowID:   req.WorkflowID,
		Status:       onboardingpkg.StatusPending,
		Progress:     0,
		WorkflowJSON: active.WorkflowJSON,
	}
	h.JobStore.Put(job)
	h.Worker.Enqueue(jobID)

	return c.Status(fiber.StatusAccepted).JSON(fiber.Map{"job_id": jobID})
}

// Status returns current progress and script_content if completed.
// GET /api/v1/onboarding/status/:id
func (h *Handler) Status(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id is required"})
	}
	job := h.JobStore.Get(id)
	if job == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "job not found"})
	}
	out := fiber.Map{
		"job_id":    job.ID,
		"status":    job.Status,
		"progress":  job.Progress,
	}
	if job.ScriptContent != "" {
		out["script_content"] = job.ScriptContent
	}
	return c.JSON(out)
}
