package onboarding

import (
	"encoding/json"
	"fmt"

	"github.com/vericore/openclaw-orchestrator/models"
)

// GenerateTutorialScript traverses workflow JSON and produces Markdown training steps.
func GenerateTutorialScript(workflowJSON []byte) (string, error) {
	var manifest models.SkillManifest
	if err := json.Unmarshal(workflowJSON, &manifest); err != nil {
		return "", err
	}
	if len(manifest.Nodes) == 0 {
		return "# Training: Empty Workflow\n\nNo steps in this workflow.", nil
	}
	order := executionOrder(manifest)
	var steps []string
	steps = append(steps, fmt.Sprintf("# Training: %s\n\nVersion: %s\n", manifest.Name, manifest.Version))
	steps = append(steps, "## Steps\n\n")
	for i, id := range order {
		node := findNode(manifest.Nodes, id)
		if node == nil {
			continue
		}
		step := nodeToTrainingStep(node, i+1)
		steps = append(steps, step)
	}
	steps = append(steps, "\n---\n*Generated for clinical onboarding.*")
	return concatenate(steps), nil
}

func findNode(nodes []models.SkillNode, id string) *models.SkillNode {
	for i := range nodes {
		if nodes[i].ID == id {
			return &nodes[i]
		}
	}
	return nil
}

func executionOrder(manifest models.SkillManifest) []string {
	if len(manifest.Nodes) == 0 {
		return nil
	}
	byID := make(map[string]*models.SkillNode)
	for i := range manifest.Nodes {
		byID[manifest.Nodes[i].ID] = &manifest.Nodes[i]
	}
	var order []string
	seen := make(map[string]bool)
	queue := []string{manifest.Nodes[0].ID}
	for len(queue) > 0 {
		id := queue[0]
		queue = queue[1:]
		if seen[id] {
			continue
		}
		seen[id] = true
		order = append(order, id)
		node := byID[id]
		if node != nil {
			for _, next := range node.NextNodes {
				if !seen[next] {
					queue = append(queue, next)
				}
			}
		}
	}
	for _, n := range manifest.Nodes {
		if !seen[n.ID] {
			order = append(order, n.ID)
		}
	}
	return order
}

func nodeToTrainingStep(node *models.SkillNode, stepNum int) string {
	subtype := ""
	if node.Config != nil {
		if s, _ := node.Config["subtype"].(string); s != "" {
			subtype = s
		}
	}
	var title string
	switch subtype {
	case "988_intake":
		title = "Intake"
	case "triage", "risk_triage":
		title = "Clinician decision point (triage)"
	case "dispatch":
		title = "Dispatch / handoff"
	case "resolution":
		title = "Resolution / closure"
	default:
		switch node.Type {
		case models.NodeTypeAPI:
			title = "System automated data retrieval"
		case models.NodeTypeCLI:
			title = "Automated script or command"
		case models.NodeTypeBROWSER:
			title = "Browser or UI automation"
		default:
			title = "Workflow step"
		}
	}
	return fmt.Sprintf("### Step %d: %s\n\nNode ID: `%s`. Complete this step before proceeding.\n\n", stepNum, title, node.ID)
}

func concatenate(s []string) string {
	var b []byte
	for _, x := range s {
		b = append(b, x...)
	}
	return string(b)
}
