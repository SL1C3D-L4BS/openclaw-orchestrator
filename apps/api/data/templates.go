package data

import (
	"fmt"

	"github.com/vericore/openclaw-orchestrator/models"
)

// seedTemplateDef defines a verified skill template by name and node types.
type seedTemplateDef struct {
	Name  string
	Types []string // "API", "CLI", "BROWSER" in order
}

// seedTemplateDefs are the 100 high-yield verified skill templates (names match community skills).
var seedTemplateDefs = []seedTemplateDef{
	{Name: "LinkedIn Prospect Scraper", Types: []string{"BROWSER", "API"}},
	{Name: "Repo Analyzer", Types: []string{"CLI"}},
	{Name: "Stripe Invoice Runner", Types: []string{"API"}},
	{Name: "Slack Notify", Types: []string{"API"}},
	{Name: "GitHub PR Workflow", Types: []string{"API", "CLI"}},
	{Name: "Notion Page Sync", Types: []string{"API"}},
	{Name: "Google Sheets ETL", Types: []string{"API"}},
	{Name: "AWS S3 Backup", Types: []string{"API", "CLI"}},
	{Name: "Jira Ticket Creator", Types: []string{"API"}},
	{Name: "Email Sequence Sender", Types: []string{"API"}},
	{Name: "Web Scraper Generic", Types: []string{"BROWSER", "API"}},
	{Name: "Linear Issue Sync", Types: []string{"API"}},
	{Name: "Docker Build & Push", Types: []string{"CLI"}},
	{Name: "Supabase Row Sync", Types: []string{"API"}},
	{Name: "OpenAI Batch Runner", Types: []string{"API"}},
	{Name: "Vercel Deploy Hook", Types: []string{"API"}},
	{Name: "PDF Generator", Types: []string{"API"}},
	{Name: "Cal.com Booking Sync", Types: []string{"API"}},
	{Name: "Twilio SMS Campaign", Types: []string{"API"}},
	{Name: "Figma Export Assets", Types: []string{"API"}},
	{Name: "Postgres Query Runner", Types: []string{"API", "CLI"}},
	{Name: "HubSpot Contact Enricher", Types: []string{"API"}},
	{Name: "Git Clone & Lint", Types: []string{"CLI"}},
	{Name: "Resend Transactional", Types: []string{"API"}},
	{Name: "Airtable Sync", Types: []string{"API"}},
	{Name: "Plaid Balance Check", Types: []string{"API"}},
	{Name: "Cron Job Runner", Types: []string{"CLI"}},
	{Name: "Intercom Inbox Sync", Types: []string{"API"}},
	{Name: "Sentry Issue Triage", Types: []string{"API"}},
	{Name: "Shopify Order Export", Types: []string{"API"}},
	{Name: "YouTube Transcript Fetcher", Types: []string{"BROWSER", "API"}},
	{Name: "Auth0 User Export", Types: []string{"API"}},
	{Name: "npm Publish", Types: []string{"CLI"}},
	{Name: "Mixpanel Event Replay", Types: []string{"API"}},
	{Name: "S3 to BigQuery Load", Types: []string{"API"}},
	{Name: "Loom Upload & Share", Types: []string{"API"}},
	{Name: "Terraform Plan Comment", Types: []string{"CLI"}},
	{Name: "Discord Bot Commands", Types: []string{"API"}},
	{Name: "Zapier-style Webhook", Types: []string{"API"}},
	{Name: "Segment Identify Sync", Types: []string{"API"}},
	{Name: "Playwright Screenshot", Types: []string{"BROWSER"}},
	{Name: "Retool DB Query", Types: []string{"API"}},
	{Name: "GitHub Actions Trigger", Types: []string{"API"}},
	{Name: "Salesforce Lead Router", Types: []string{"API"}},
	{Name: "Markdown to Notion", Types: []string{"API"}},
	{Name: "PagerDuty On-Call", Types: []string{"API"}},
	{Name: "RSS to Slack", Types: []string{"API"}},
	{Name: "Stripe Customer Sync", Types: []string{"API"}},
	{Name: "Cloudflare Purge Cache", Types: []string{"API"}},
	{Name: "Figma to Code", Types: []string{"API"}},
	{Name: "Vault Secret Fetcher", Types: []string{"API"}},
	{Name: "Datadog Dashboard Clone", Types: []string{"API"}},
	{Name: "Kubernetes Log Tail", Types: []string{"CLI"}},
	{Name: "Typeform Response Export", Types: []string{"API"}},
	{Name: "Grafana Annotation", Types: []string{"API"}},
	{Name: "Zoom Meeting Creator", Types: []string{"API"}},
	{Name: "Snowflake Query", Types: []string{"API"}},
	{Name: "Contentful Publish", Types: []string{"API"}},
	{Name: "Trello Board Sync", Types: []string{"API"}},
	{Name: "SendGrid Template Send", Types: []string{"API"}},
	{Name: "Elasticsearch Index", Types: []string{"API"}},
	{Name: "Asana Task Importer", Types: []string{"API"}},
	{Name: "Redis Cache Warmer", Types: []string{"API"}},
	{Name: "Twilio IVR Builder", Types: []string{"API"}},
	{Name: "MongoDB Aggregation", Types: []string{"API"}},
	{Name: "Braze Campaign Trigger", Types: []string{"API"}},
	{Name: "GCP Pub/Sub Publish", Types: []string{"API"}},
	{Name: "Amplitude Event Ingest", Types: []string{"API"}},
	{Name: "Stripe Subscription Report", Types: []string{"API"}},
	{Name: "Figma Variables Sync", Types: []string{"API"}},
	{Name: "Git Diff Stats", Types: []string{"CLI"}},
	{Name: "Customer.io Event Push", Types: []string{"API"}},
	{Name: "S3 Glacier Restore", Types: []string{"API"}},
	{Name: "Heap Event Export", Types: []string{"API"}},
	{Name: "Terraform State Lock", Types: []string{"CLI"}},
	{Name: "Zendesk Ticket Sync", Types: []string{"API"}},
	{Name: "Webhook Tester", Types: []string{"API"}},
	{Name: "Stripe Tax Report", Types: []string{"API"}},
	{Name: "GitHub Dependency Graph", Types: []string{"API"}},
	{Name: "Mailchimp List Sync", Types: []string{"API"}},
	{Name: "Lambda Invoke Chain", Types: []string{"API"}},
	{Name: "Looker Report Run", Types: []string{"API"}},
	{Name: "npm Audit Fix", Types: []string{"CLI"}},
	{Name: "DocuSign Envelope Send", Types: []string{"API"}},
	{Name: "Prometheus Query", Types: []string{"API"}},
	{Name: "Outreach Sequence", Types: []string{"API"}},
	{Name: "Terraform Apply", Types: []string{"CLI"}},
	{Name: "Intercom Tag Sync", Types: []string{"API"}},
	{Name: "Cypress E2E Runner", Types: []string{"CLI"}},
	{Name: "Stripe Product Sync", Types: []string{"API"}},
	{Name: "SQS Producer", Types: []string{"API"}},
	{Name: "HubSpot Deal Pipeline", Types: []string{"API"}},
	{Name: "Jest Coverage Report", Types: []string{"CLI"}},
	{Name: "Vercel Env Sync", Types: []string{"API"}},
	{Name: "Google Drive Export", Types: []string{"API"}},
	{Name: "Stripe Payout Report", Types: []string{"API"}},
	{Name: "OpenAI Moderation", Types: []string{"API"}},
	{Name: "PagerDuty Schedule", Types: []string{"API"}},
	{Name: "Git Tag Release", Types: []string{"CLI"}},
	{Name: "Full Story Session Export", Types: []string{"API"}},
}

// GetSeedTemplates returns verified SkillManifest templates for the API playground.
// All 100 community skill names have a matching template with valid node chains.
func GetSeedTemplates() []models.SkillManifest {
	out := make([]models.SkillManifest, 0, len(seedTemplateDefs))
	for _, def := range seedTemplateDefs {
		out = append(out, buildManifest(def))
	}
	return out
}

func buildManifest(def seedTemplateDef) models.SkillManifest {
	nodes := make([]models.SkillNode, 0, len(def.Types))
	for i, t := range def.Types {
		id := fmt.Sprintf("%d", i+1)
		next := []string{}
		if i+1 < len(def.Types) {
			next = []string{fmt.Sprintf("%d", i+2)}
		}
		var config map[string]interface{}
		switch t {
		case "API":
			config = map[string]interface{}{
				"endpoint": "https://api.example.com/v1",
				"method":   "POST",
				"task":     "verified_template",
			}
		case "CLI":
			config = map[string]interface{}{
				"command": "run",
				"args":    []interface{}{"--verified"},
				"task":    "verified_template",
			}
		case "BROWSER":
			config = map[string]interface{}{
				"url":    "https://example.com",
				"action": "read",
				"task":   "verified_template",
			}
		default:
			config = map[string]interface{}{"task": "verified_template"}
		}
		nodes = append(nodes, models.SkillNode{
			ID:        id,
			Type:      t,
			Config:    config,
			NextNodes: next,
		})
	}
	return models.SkillManifest{
		Name:     def.Name,
		Version:  "0.1.0",
		Nodes:    nodes,
		SignedBy: "Vericore",
	}
}
