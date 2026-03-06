package crisis

import (
	"encoding/json"
	"fmt"

	"github.com/vericore/openclaw-orchestrator/models"
)

// ValidateClinicalGraph enforces 988 dispatch rules on the workflow JSON.
// Returns an error with a specific message if the graph is non-compliant.
func ValidateClinicalGraph(manifestJSON []byte) error {
	var manifest models.SkillManifest
	if err := json.Unmarshal(manifestJSON, &manifest); err != nil {
		return fmt.Errorf("invalid workflow_json: %w", err)
	}

	// Rule 1 (Intake): at least one node must be 988_intake
	hasIntake := false
	for i := range manifest.Nodes {
		if getSubtype(manifest.Nodes[i].Config) == "988_intake" {
			hasIntake = true
			break
		}
	}
	if !hasIntake {
		return fmt.Errorf("clinical validation failed: workflow must contain at least one 988_intake node")
	}

	// Rule 2 (No Dead Ends): every terminal node must be dispatch or resolution
	for i := range manifest.Nodes {
		n := &manifest.Nodes[i]
		if len(n.NextNodes) != 0 {
			continue
		}
		subtype := getSubtype(n.Config)
		if subtype != "dispatch" && subtype != "resolution" {
			return fmt.Errorf("clinical validation failed: workflow contains a dead-end node; must terminate in dispatch or resolution")
		}
	}

	return nil
}

func getSubtype(config map[string]interface{}) string {
	if config == nil {
		return ""
	}
	v, ok := config["subtype"]
	if !ok {
		return ""
	}
	s, _ := v.(string)
	return s
}
