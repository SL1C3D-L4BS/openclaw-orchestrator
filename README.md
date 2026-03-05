# 🕹️ OpenClaw Skill Orchestrator

**The Visual IDE for Standardized OpenClaw Agent Skills.**

[![OpenClaw Version](https://img.shields.io/badge/OpenClaw-v4.2%2B-blue)](https://github.com/openclaw/openclaw)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

OpenClaw Skill Orchestrator is a visual "drag-and-drop" IDE designed to chain complex AI behaviors—Browser manipulation, API interaction, and CLI execution—into a single, high-fidelity JSONL skill-set.

## 🚀 The Problem
OpenClaw skills are currently manually coded in Python or JSON, leading to frequent syntax errors and "Skill Drift." There is no visual way to debug how an agent chains a "Search LinkedIn" skill into an "Email Prospect" skill.

## ⚡ Features
* **Visual Node Builder:** Chain skills with logical flow. Drag nodes by the grip handle; connect outputs to inputs. Pan and zoom the canvas.
* **Community Skills (100 preloaded):** Browse 100 high-yield skills in the sidebar. Each has a **prebuilt workflow** (nodes + edges). **Add to canvas** loads the full workflow; **drag a skill onto the canvas** to drop its workflow at the drop position.
* **API Playground:** 100 verified skill templates from the API. Open a community skill in the playground via **Open in API Playground**; the selected template preloads. Validate and export manifests.
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

Then open **http://localhost:3000** for the **Builder** (visual canvas + Community Skills) and **http://localhost:3000/api-playground** for the API Playground. The API runs on **http://localhost:8080** and serves 100 verified skill templates; the playground can preload a template when opened with `?template=Skill Name`.
