# 🕹️ OpenClaw Skill Orchestrator

**The Visual IDE for Standardized OpenClaw Agent Skills.**

[![OpenClaw Version](https://img.shields.io/badge/OpenClaw-v4.2%2B-blue)](https://github.com/openclaw/openclaw)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

OpenClaw Skill Orchestrator is a visual "drag-and-drop" IDE designed to chain complex AI behaviors—Browser manipulation, API interaction, and CLI execution—into a single, high-fidelity JSONL skill-set.

## 🚀 The Problem
OpenClaw skills are currently manually coded in Python or JSON, leading to frequent syntax errors and "Skill Drift." There is no visual way to debug how an agent chains a "Search LinkedIn" skill into an "Email Prospect" skill.

## ⚡ Features
* **Visual Node Builder:** Chain skills with logical flow. Drag nodes by the grip handle; connect outputs to inputs. Pan and zoom the canvas.
* **Clinical workflow seeds:** Four 988-compliant workflow templates in the sidebar (Intake → Dispatch, Intake → Resolution, Intake → Triage → Dispatch, Intake → Triage → Resolution). Each has a prebuilt workflow; **Add to canvas** or drag onto the canvas to load.
* **API Playground:** Same four clinical templates from the API. Open a seed in the playground via **Open in API Playground**; the selected template preloads. Validate and export manifests.
* **Cryptographic Signing:** Uses `go-pq-mmr` to sign skill-sets, ensuring they haven't been tampered with by prompt injection.
* **One-Click JSONL Export:** Instantly compatible with the `openclaw-agent --skills=./my_skill.jsonl` command.
* **Skill Simulator:** Dry-run your chains in a sandboxed environment before deployment.

## 📦 Quickstart

### Option A: Docker
```bash
# Build and start API + Web (rebuild so API includes /api/v1/skills/templates)
docker-compose up --build -d

# Open http://localhost:3000 for the app, http://localhost:3000/api-playground for the API Playground.
```

### Option B: Local development
```bash
# Terminal 1 — API (must be running for templates, validate & export)
npm run dev:api

# Terminal 2 — Web
npm run dev:web
```

Then open **http://localhost:3000** for the **Builder** (visual canvas + clinical workflow seeds) and **http://localhost:3000/api-playground** for the API Playground. The API runs on **http://localhost:8080** and serves 988-compliant clinical templates; the playground can preload a template when opened with `?template=988 Intake → Dispatch` (or the other seed names).

### Configuration (API)

The API loads configuration from the environment. All of these are optional in development (defaults apply).

| Variable       | Default                 | Description |
|----------------|-------------------------|-------------|
| `PORT`         | `8080`                  | HTTP server port |
| `JWT_SECRET`   | *(dev sentinel)*        | Secret for signing/validating JWTs. **Required in production.** |
| `DB_PATH`      | `./data/openclaw.db`    | Path to SQLite database file |
| `LOG_LEVEL`    | `info`                  | Log level: `debug`, `info`, `warn`, `error` |
| `ENVIRONMENT`  | `development`           | `development`, `staging`, or `production` |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed frontend origin (for CORS/documentation) |

**Production:** If `ENVIRONMENT=production`, you **must** set `JWT_SECRET` to a strong, non-default value. The API will exit at startup with `FATAL: JWT_SECRET is required in production environment` if it is missing or matches the development sentinel.

### Authentication (crisis workflows)

Crisis endpoints are protected by JWT RBAC. **Test users** (temporary, for development):

| Username        | Role               | Can do                                      |
|-----------------|--------------------|---------------------------------------------|
| `test_director` | CLINICAL_DIRECTOR  | Create workflow, new version                |
| `test_responder`| RESPONDER          | List workflows, run workflow                |

**Get a token:**
```bash
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test_director"}' | jq
# → { "token": "eyJ...", "role": "CLINICAL_DIRECTOR" }
```

**401 without token:**
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/v1/crisis/workflows
# → 401
```

**200 with token:**
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test_responder"}' | jq -r .token)
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/crisis/workflows
# → 200
```
