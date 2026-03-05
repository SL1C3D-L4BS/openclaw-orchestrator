package models

// NodeType represents the kind of skill node (API, CLI, or BROWSER).
const (
	NodeTypeAPI     = "API"
	NodeTypeCLI     = "CLI"
	NodeTypeBROWSER = "BROWSER"
)

// SkillNode is a single node in the skill graph.
type SkillNode struct {
	ID        string                 `json:"id"`
	Type      string                 `json:"type"` // API | CLI | BROWSER
	Config    map[string]interface{} `json:"config"`
	NextNodes []string               `json:"next_nodes"`
}

// SkillManifest is the full skill-set with PQC verification proof.
type SkillManifest struct {
	Name      string      `json:"name"`
	Version   string      `json:"version"`
	Nodes     []SkillNode `json:"nodes"`
	PQCProof  string      `json:"pqc_proof,omitempty"`
	SignedBy  string      `json:"signed_by,omitempty"` // e.g. "Vericore" for Verified Creator badge
}
