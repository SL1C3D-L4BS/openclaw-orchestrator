package orchestrator

import (
	"fmt"

	"github.com/vericore/openclaw-orchestrator/models"
)

// ValidateResult holds the result of skill chain validation.
type ValidateResult struct {
	Valid  bool     `json:"valid"`
	Errors []string `json:"errors,omitempty"`
}

// ValidateSkillChain checks that the manifest has no infinite loops (no cycles in the node graph).
func ValidateSkillChain(manifest models.SkillManifest) ValidateResult {
	var errs []string
	nodeByID := make(map[string]models.SkillNode)
	for _, n := range manifest.Nodes {
		if n.ID == "" {
			errs = append(errs, "node with empty id")
			continue
		}
		nodeByID[n.ID] = n
	}
	for _, n := range manifest.Nodes {
		for _, nextID := range n.NextNodes {
			if nextID != "" && nodeByID[nextID].ID == "" {
				errs = append(errs, fmt.Sprintf("node %q references missing next node %q", n.ID, nextID))
			}
		}
	}
	if len(errs) > 0 {
		return ValidateResult{Valid: false, Errors: errs}
	}
	// Cycle detection: DFS with recursion stack
	visited := make(map[string]bool)
	recStack := make(map[string]bool)
	var visit func(id string) bool
	visit = func(id string) bool {
		visited[id] = true
		recStack[id] = true
		n := nodeByID[id]
		for _, nextID := range n.NextNodes {
			if nextID == "" {
				continue
			}
			if !visited[nextID] {
				if visit(nextID) {
					return true
				}
			} else if recStack[nextID] {
				return true // cycle
			}
		}
		recStack[id] = false
		return false
	}
	for id := range nodeByID {
		if visited[id] {
			continue
		}
		if visit(id) {
			return ValidateResult{Valid: false, Errors: []string{"skill chain contains a cycle (infinite loop)"}}
		}
	}
	return ValidateResult{Valid: true}
}
