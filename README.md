# 🕹️ OpenClaw Skill Orchestrator

**The Visual IDE for Standardized OpenClaw Agent Skills.**

[![OpenClaw Version](https://img.shields.io/badge/OpenClaw-v4.2%2B-blue)](https://github.com/openclaw/openclaw)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

OpenClaw Skill Orchestrator is a visual "drag-and-drop" IDE designed to chain complex AI behaviors—Browser manipulation, API interaction, and CLI execution—into a single, high-fidelity JSONL skill-set.

## 🚀 The Problem
OpenClaw skills are currently manually coded in Python or JSON, leading to frequent syntax errors and "Skill Drift." There is no visual way to debug how an agent chains a "Search LinkedIn" skill into an "Email Prospect" skill.

## ⚡ Features
* **Visual Node Builder:** Chain skills with logical flow (If/Then, Loops).
* **Cryptographic Signing:** Uses `go-pq-mmr` to sign skill-sets, ensuring they haven't been tampered with by prompt injection.
* **One-Click JSONL Export:** Instantly compatible with the `openclaw-agent --skills=./my_skill.jsonl` command.
* **Skill Simulator:** Dry-run your chains in a sandboxed environment before deployment.

## 📦 Quickstart
```bash
# Start the Orchestrator
docker-compose up -d

# Navigate to localhost:3000 to start building your first skill.
```
