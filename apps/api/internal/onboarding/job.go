package onboarding

// Job status values.
const (
	StatusPending    = "Pending"
	StatusProcessing = "Processing"
	StatusCompleted  = "Completed"
	StatusFailed     = "Failed"
)

// OnboardingJob represents a tutorial generation job.
type OnboardingJob struct {
	ID            string          `json:"id"`
	WorkflowID    string          `json:"workflow_id"`
	Status        string          `json:"status"`         // Pending | Processing | Completed | Failed
	Progress      int             `json:"progress"`      // 0-100
	ScriptContent string          `json:"script_content"` // Markdown when completed
	WorkflowJSON  []byte          `json:"-"`             // used by worker to generate script; not exposed in API
}
