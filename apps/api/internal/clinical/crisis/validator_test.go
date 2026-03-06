package crisis

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestValidateClinicalGraph_ValidGraph(t *testing.T) {
	// Valid: 988_intake -> dispatch (terminal)
	manifest := map[string]interface{}{
		"name":    "Test",
		"version": "1.0",
		"nodes": []map[string]interface{}{
			{
				"id":         "intake-1",
				"type":       "API",
				"config":     map[string]interface{}{"subtype": "988_intake", "endpoint": "/intake"},
				"next_nodes": []string{"dispatch-1"},
			},
			{
				"id":         "dispatch-1",
				"type":       "API",
				"config":     map[string]interface{}{"subtype": "dispatch"},
				"next_nodes": []string{},
			},
		},
	}
	body, err := json.Marshal(manifest)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	if err := ValidateClinicalGraph(body); err != nil {
		t.Errorf("expected nil error for valid graph; got: %v", err)
	}
}

func TestValidateClinicalGraph_MissingIntake(t *testing.T) {
	// Only a dispatch node; no 988_intake
	manifest := map[string]interface{}{
		"name":    "Test",
		"version": "1.0",
		"nodes": []map[string]interface{}{
			{
				"id":         "dispatch-1",
				"type":       "API",
				"config":     map[string]interface{}{"subtype": "dispatch"},
				"next_nodes": []string{},
			},
		},
	}
	body, err := json.Marshal(manifest)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	err = ValidateClinicalGraph(body)
	if err == nil {
		t.Fatal("expected error for missing intake; got nil")
	}
	if !strings.Contains(err.Error(), "must contain at least one 988_intake node") {
		t.Errorf("error should mention 988_intake; got: %s", err.Error())
	}
}

func TestValidateClinicalGraph_DeadEnd(t *testing.T) {
	// 988_intake -> generic API node with no next (dead end, not dispatch/resolution)
	manifest := map[string]interface{}{
		"name":    "Test",
		"version": "1.0",
		"nodes": []map[string]interface{}{
			{
				"id":         "intake-1",
				"type":       "API",
				"config":     map[string]interface{}{"subtype": "988_intake"},
				"next_nodes": []string{"api-1"},
			},
			{
				"id":         "api-1",
				"type":       "API",
				"config":     map[string]interface{}{"endpoint": "/some-api"},
				"next_nodes": []string{},
			},
		},
	}
	body, err := json.Marshal(manifest)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	err = ValidateClinicalGraph(body)
	if err == nil {
		t.Fatal("expected error for dead-end node; got nil")
	}
	if !strings.Contains(err.Error(), "workflow contains a dead-end node") {
		t.Errorf("error should mention dead-end; got: %s", err.Error())
	}
}
