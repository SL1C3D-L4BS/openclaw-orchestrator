package orchestrator

import (
	"bytes"
	"encoding/json"
	"fmt"

	"github.com/vericore/openclaw-orchestrator/internal/signing"
	"github.com/vericore/openclaw-orchestrator/models"
)

// ExportToJSONL converts the skill manifest into the standard OpenClaw .jsonl
// format and signs it with PQC (go-pq-mmr), producing a Verified Creator–ready export.
func ExportToJSONL(manifest models.SkillManifest, signer signing.Signer) ([]byte, error) {
	if signer == nil {
		signer = signing.DefaultSigner{}
	}

	// Build id -> node map for ordering and lookup
	nodeByID := make(map[string]models.SkillNode)
	for _, n := range manifest.Nodes {
		nodeByID[n.ID] = n
	}

	// Topological order via simple BFS from first node so export order is deterministic.
	// OpenClaw JSONL: one JSON object per line (id, type, config, next_nodes).
	var ordered []models.SkillNode
	seen := make(map[string]bool)
	var queue []string
	if len(manifest.Nodes) > 0 {
		queue = append(queue, manifest.Nodes[0].ID)
	}
	for len(queue) > 0 {
		id := queue[0]
		queue = queue[1:]
		if seen[id] {
			continue
		}
		seen[id] = true
		if n, ok := nodeByID[id]; ok {
			ordered = append(ordered, n)
			for _, next := range n.NextNodes {
				if !seen[next] {
					queue = append(queue, next)
				}
			}
		}
	}
	// Append any nodes not reachable from the first (e.g. disjoint subgraphs)
	for _, n := range manifest.Nodes {
		if !seen[n.ID] {
			ordered = append(ordered, n)
		}
	}

	var buf bytes.Buffer
	enc := json.NewEncoder(&buf)
	enc.SetEscapeHTML(false)
	for i := range ordered {
		line := jsonLine{
			ID:        ordered[i].ID,
			Type:      ordered[i].Type,
			Config:    ordered[i].Config,
			NextNodes: ordered[i].NextNodes,
		}
		if err := enc.Encode(line); err != nil {
			return nil, fmt.Errorf("encode node %s: %w", ordered[i].ID, err)
		}
	}

	payload := buf.Bytes()
	proof, err := signer.Sign(payload)
	if err != nil {
		return nil, fmt.Errorf("sign export: %w", err)
	}

	// Prepend metadata line with PQC proof for Verified Creator badge
	meta := metadataLine{
		Name:     manifest.Name,
		Version:  manifest.Version,
		PQCProof: proof,
		SignedBy: "Vericore",
	}
	if manifest.SignedBy != "" {
		meta.SignedBy = manifest.SignedBy
	}
	metaJSON, _ := json.Marshal(meta)
	final := append(metaJSON, '\n')
	final = append(final, payload...)

	return final, nil
}

type jsonLine struct {
	ID        string                 `json:"id"`
	Type      string                 `json:"type"`
	Config    map[string]interface{} `json:"config"`
	NextNodes []string               `json:"next_nodes"`
}

type metadataLine struct {
	Name     string `json:"name"`
	Version  string `json:"version"`
	PQCProof string `json:"pqc_proof"`
	SignedBy string `json:"signed_by"`
}
