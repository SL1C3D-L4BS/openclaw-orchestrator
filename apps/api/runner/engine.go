package runner

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os/exec"
	"strings"

	"github.com/vericore/openclaw-orchestrator/models"
)

// LogEvent is sent over the channel for SSE. JSON-serialized so the frontend can parse nodeId and message.
type LogEvent struct {
	NodeID  string `json:"nodeId"`
	Message string `json:"message"`
	Status  string `json:"status"` // "info", "success", "error"
}

// executionOrder returns node IDs in BFS order starting from the first node, following NextNodes.
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

func emit(logChan chan<- string, nodeID, message, status string) {
	ev := LogEvent{NodeID: nodeID, Message: message, Status: status}
	b, _ := json.Marshal(ev)
	logChan <- string(b)
}

// ExecuteManifest runs the skill manifest in execution order and streams log events to logChan.
// Closes logChan when done.
func ExecuteManifest(manifest models.SkillManifest, logChan chan<- string) {
	defer close(logChan)
	order := executionOrder(manifest)
	byID := make(map[string]*models.SkillNode)
	for i := range manifest.Nodes {
		byID[manifest.Nodes[i].ID] = &manifest.Nodes[i]
	}

	for _, id := range order {
		node := byID[id]
		if node == nil {
			continue
		}
		switch node.Type {
		case models.NodeTypeAPI:
			runAPINode(node, logChan)
		case models.NodeTypeCLI:
			runCLINode(node, logChan)
		case models.NodeTypeBROWSER:
			runBrowserNode(node, logChan)
		default:
			emit(logChan, node.ID, fmt.Sprintf("Unknown node type: %s", node.Type), "error")
		}
	}
	emit(logChan, "", "Execution complete.", "success")
}

func runAPINode(node *models.SkillNode, logChan chan<- string) {
	config := node.Config
	if config == nil {
		config = make(map[string]interface{})
	}
	endpoint, _ := config["endpoint"].(string)
	if endpoint == "" {
		emit(logChan, node.ID, "API node missing endpoint in config", "error")
		return
	}
	method, _ := config["method"].(string)
	if method == "" {
		method = "GET"
	}
	emit(logChan, node.ID, fmt.Sprintf("%s %s", method, endpoint), "info")
	req, err := http.NewRequest(method, endpoint, nil)
	if err != nil {
		emit(logChan, node.ID, fmt.Sprintf("Request build error: %v", err), "error")
		return
	}
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		emit(logChan, node.ID, fmt.Sprintf("Request error: %v", err), "error")
		return
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
	bodySnippet := string(body)
	if len(bodySnippet) > 200 {
		bodySnippet = bodySnippet[:200] + "..."
	}
	bodySnippet = strings.TrimSpace(strings.ReplaceAll(bodySnippet, "\n", " "))
	msg := fmt.Sprintf("%d %s", resp.StatusCode, bodySnippet)
	status := "success"
	if resp.StatusCode >= 400 {
		status = "error"
	}
	emit(logChan, node.ID, msg, status)
}

func runCLINode(node *models.SkillNode, logChan chan<- string) {
	config := node.Config
	if config == nil {
		config = make(map[string]interface{})
	}
	command, _ := config["command"].(string)
	if command == "" {
		emit(logChan, node.ID, "CLI node missing command in config", "error")
		return
	}
	log.Printf("[runner] WARNING: Executing CLI command locally. Only run manifests you trust on your own machine.")
	emit(logChan, node.ID, fmt.Sprintf("Running: %s (local execution)", command), "info")
	var args []string
	if a, ok := config["args"].([]interface{}); ok {
		for _, v := range a {
			if s, ok := v.(string); ok {
				args = append(args, s)
			}
		}
	}
	cmd := exec.Command(command, args...)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	err := cmd.Run()
	out := strings.TrimSpace(stdout.String())
	if out != "" {
		for _, line := range strings.Split(out, "\n") {
			emit(logChan, node.ID, line, "info")
		}
	}
	errStr := strings.TrimSpace(stderr.String())
	if errStr != "" {
		for _, line := range strings.Split(errStr, "\n") {
			emit(logChan, node.ID, "[stderr] "+line, "info")
		}
	}
	if err != nil {
		emit(logChan, node.ID, fmt.Sprintf("Exit error: %v", err), "error")
		return
	}
	emit(logChan, node.ID, "Command completed.", "success")
}

func runBrowserNode(node *models.SkillNode, logChan chan<- string) {
	config := node.Config
	if config == nil {
		config = make(map[string]interface{})
	}
	url, _ := config["url"].(string)
	if url == "" {
		url = "(no url)"
	}
	emit(logChan, node.ID, fmt.Sprintf("Browser action simulated (url: %s). Headless browser not integrated.", url), "info")
	emit(logChan, node.ID, "Browser action simulated", "success")
}
