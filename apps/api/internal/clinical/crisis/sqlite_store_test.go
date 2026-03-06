package crisis

import (
	"context"
	"encoding/json"
	"testing"
	"time"
)

func TestSQLiteStore_VersioningLogic(t *testing.T) {
	ctx := context.Background()
	store, err := NewSQLiteStore(":memory:")
	if err != nil {
		t.Fatalf("NewSQLiteStore: %v", err)
	}
	defer store.Close()

	workflowJSON := json.RawMessage(`{"name":"Test","version":"1.0","nodes":[]`)

	// 1. Create workflow (ID: test-wf, Version: 1)
	w1 := CrisisWorkflow{
		ID:           "test-wf",
		Version:      1,
		WorkflowJSON: workflowJSON,
		Status:       StatusActive,
		CreatedAt:    time.Now().UTC(),
	}
	if err := store.Create(ctx, w1); err != nil {
		t.Fatalf("Create v1: %v", err)
	}

	// 2. ArchiveActive("test-wf")
	if err := store.ArchiveActive(ctx, "test-wf"); err != nil {
		t.Fatalf("ArchiveActive: %v", err)
	}

	// 3. Create new version (ID: test-wf, Version: 2)
	w2 := CrisisWorkflow{
		ID:           "test-wf",
		Version:      2,
		WorkflowJSON: workflowJSON,
		Status:       StatusActive,
		CreatedAt:    time.Now().UTC(),
	}
	if err := store.Create(ctx, w2); err != nil {
		t.Fatalf("Create v2: %v", err)
	}

	// 4. GetActive("test-wf") -> version must be 2
	active, err := store.GetActive(ctx, "test-wf")
	if err != nil {
		t.Fatalf("GetActive: %v", err)
	}
	if active == nil {
		t.Fatal("GetActive: expected non-nil workflow")
	}
	if active.Version != 2 {
		t.Errorf("GetActive: expected version 2, got %d", active.Version)
	}
}
