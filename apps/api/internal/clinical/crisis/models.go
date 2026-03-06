package crisis

import (
	"encoding/json"
	"time"
)

// Workflow status: only Active workflows are returned by List and used by Run.
const (
	StatusActive   = "Active"
	StatusArchived = "Archived"
)

// CrisisWorkflow is an immutable record. Updates are done by creating a new
// version (POST .../version), which archives the previous and saves the new as Active.
type CrisisWorkflow struct {
	ID           string          `json:"id"`            // workflow logical id (e.g. UUID)
	Version      int             `json:"version"`       // version number; incremented on each override
	WorkflowJSON json.RawMessage `json:"workflow_json"` // raw JSON (SkillManifest-compatible)
	CreatedAt    time.Time       `json:"created_at"`
	Status       string          `json:"status"` // Active | Archived
}
