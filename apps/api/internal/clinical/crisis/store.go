package crisis

import "context"

// Store defines persistence for immutable CrisisWorkflow records.
// Mock implementation is in-memory; replace with DB for production.
type Store interface {
	// ListActive returns all workflows with Status == Active (one row per workflow id).
	ListActive(ctx context.Context) ([]CrisisWorkflow, error)
	// Create inserts a new workflow (Version 1, Status Active). ID must be set by caller.
	Create(ctx context.Context, w CrisisWorkflow) error
	// GetActive returns the active version for the given workflow ID, or nil if not found.
	GetActive(ctx context.Context, workflowID string) (*CrisisWorkflow, error)
	// ArchiveActive marks the current active row for workflowID as Archived.
	ArchiveActive(ctx context.Context, workflowID string) error
	// GetByIDAndVersion returns a specific version; used for auditing.
	GetByIDAndVersion(ctx context.Context, workflowID string, version int) (*CrisisWorkflow, error)
}
