package data

import (
	"github.com/vericore/openclaw-orchestrator/models"
)

// GetSeedTemplates returns hardcoded high-quality SkillManifest templates
// for the Template Seed Engine (Phase 4).
func GetSeedTemplates() []models.SkillManifest {
	return []models.SkillManifest{
		{
			Name:    "OSINT-Prospector",
			Version: "0.1.0",
			Nodes: []models.SkillNode{
				{
					ID:   "1",
					Type: models.NodeTypeBROWSER,
					Config: map[string]interface{}{
						"url":     "https://www.linkedin.com/sales/search/people",
						"action":  "scrape",
						"selector": ".search-result",
					},
					NextNodes: []string{"2"},
				},
				{
					ID:   "2",
					Type: models.NodeTypeAPI,
					Config: map[string]interface{}{
						"endpoint": "https://api.openai.com/v1/chat/completions",
						"method":  "POST",
						"provider": "OpenAI",
						"task":    "write_outreach_email",
					},
					NextNodes: []string{"3"},
				},
				{
					ID:   "3",
					Type: models.NodeTypeAPI,
					Config: map[string]interface{}{
						"endpoint": "https://api.sendgrid.com/v3/mail/send",
						"method":  "POST",
						"provider": "SendGrid",
						"task":    "send_email",
					},
					NextNodes: []string{},
				},
			},
		},
		{
			Name:    "DevSecOps-Autobuilder",
			Version: "0.1.0",
			Nodes: []models.SkillNode{
				{
					ID:   "1",
					Type: models.NodeTypeCLI,
					Config: map[string]interface{}{
						"command": "gosec",
						"args":    []interface{}{"-fmt=json", "./..."},
						"task":    "security_scan",
					},
					NextNodes: []string{"2"},
				},
				{
					ID:   "2",
					Type: models.NodeTypeCLI,
					Config: map[string]interface{}{
						"command": "docker",
						"args":    []interface{}{"build", "-t", "app:latest", "."},
						"task":    "build_image",
					},
					NextNodes: []string{"3"},
				},
				{
					ID:   "3",
					Type: models.NodeTypeAPI,
					Config: map[string]interface{}{
						"endpoint": "https://discord.com/api/webhooks/...",
						"method":  "POST",
						"provider": "Discord",
						"task":    "notify_build_result",
					},
					NextNodes: []string{},
				},
			},
		},
		{
			Name:    "Competitor-Spy",
			Version: "0.1.0",
			Nodes: []models.SkillNode{
				{
					ID:   "1",
					Type: models.NodeTypeBROWSER,
					Config: map[string]interface{}{
						"url":     "https://competitor.example.com/pricing",
						"action":  "read",
						"task":    "capture_pricing_page",
					},
					NextNodes: []string{"2"},
				},
				{
					ID:   "2",
					Type: models.NodeTypeAPI,
					Config: map[string]interface{}{
						"endpoint": "/api/extract-numbers",
						"method":  "POST",
						"task":    "extract_pricing_numbers",
					},
					NextNodes: []string{"3"},
				},
				{
					ID:   "3",
					Type: models.NodeTypeAPI,
					Config: map[string]interface{}{
						"endpoint": "https://hooks.slack.com/services/...",
						"method":  "POST",
						"provider": "Slack",
						"task":    "webhook_alert",
					},
					NextNodes: []string{},
				},
			},
		},
	}
}
