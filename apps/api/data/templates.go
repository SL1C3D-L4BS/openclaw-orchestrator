package data

import (
	"github.com/vericore/openclaw-orchestrator/models"
)

// seedTemplateDef defines a 988-compliant clinical workflow (intake + dispatch/resolution).
type seedTemplateDef struct {
	Name   string
	Nodes  []nodeDef
	Signed string
}

type nodeDef struct {
	ID       string
	Type     string // API, CLI, BROWSER
	Subtype  string // 988_intake, dispatch, resolution, triage, etc.
	NextIDs  []string
	Endpoint string
	Method   string
}

// Clinical seed templates only. All pass ValidateClinicalGraph (intake present, terminals are dispatch/resolution).
var seedTemplateDefs = []seedTemplateDef{
	{
		Name:  "988 Intake → Dispatch",
		Signed: "Vericore",
		Nodes: []nodeDef{
			{ID: "intake-1", Type: "API", Subtype: "988_intake", NextIDs: []string{"dispatch-1"}, Endpoint: "/988/intake", Method: "POST"},
			{ID: "dispatch-1", Type: "API", Subtype: "dispatch", NextIDs: nil, Endpoint: "/dispatch", Method: "POST"},
		},
	},
	{
		Name:  "988 Intake → Resolution",
		Signed: "Vericore",
		Nodes: []nodeDef{
			{ID: "intake-1", Type: "API", Subtype: "988_intake", NextIDs: []string{"resolution-1"}, Endpoint: "/988/intake", Method: "POST"},
			{ID: "resolution-1", Type: "API", Subtype: "resolution", NextIDs: nil, Endpoint: "/resolution", Method: "POST"},
		},
	},
	{
		Name:  "988 Intake → Triage → Dispatch",
		Signed: "Vericore",
		Nodes: []nodeDef{
			{ID: "intake-1", Type: "API", Subtype: "988_intake", NextIDs: []string{"triage-1"}, Endpoint: "/988/intake", Method: "POST"},
			{ID: "triage-1", Type: "API", Subtype: "triage", NextIDs: []string{"dispatch-1"}, Endpoint: "/triage", Method: "POST"},
			{ID: "dispatch-1", Type: "API", Subtype: "dispatch", NextIDs: nil, Endpoint: "/dispatch", Method: "POST"},
		},
	},
	{
		Name:  "988 Intake → Triage → Resolution",
		Signed: "Vericore",
		Nodes: []nodeDef{
			{ID: "intake-1", Type: "API", Subtype: "988_intake", NextIDs: []string{"triage-1"}, Endpoint: "/988/intake", Method: "POST"},
			{ID: "triage-1", Type: "API", Subtype: "triage", NextIDs: []string{"resolution-1"}, Endpoint: "/triage", Method: "POST"},
			{ID: "resolution-1", Type: "API", Subtype: "resolution", NextIDs: nil, Endpoint: "/resolution", Method: "POST"},
		},
	},
}

// GetSeedTemplates returns 988-compliant clinical workflow templates for the API playground.
func GetSeedTemplates() []models.SkillManifest {
	out := make([]models.SkillManifest, 0, len(seedTemplateDefs))
	for _, def := range seedTemplateDefs {
		out = append(out, buildManifest(def))
	}
	return out
}

func buildManifest(def seedTemplateDef) models.SkillManifest {
	nodes := make([]models.SkillNode, 0, len(def.Nodes))
	for _, n := range def.Nodes {
		config := map[string]interface{}{
			"subtype":   n.Subtype,
			"endpoint":  n.Endpoint,
			"method":    n.Method,
			"task":      "988_clinical",
		}
		nodes = append(nodes, models.SkillNode{
			ID:        n.ID,
			Type:      n.Type,
			Config:    config,
			NextNodes: n.NextIDs,
		})
	}
	return models.SkillManifest{
		Name:     def.Name,
		Version:  "1.0.0",
		Nodes:    nodes,
		SignedBy: def.Signed,
	}
}
