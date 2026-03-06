# Crisis Workflows API

Clinical domain: immutable crisis workflows with versioning. Run uses the existing Orchestrator runner.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/crisis/workflows` | List active workflows |
| POST | `/api/v1/crisis/workflows` | Create new workflow (Version 1, Active) |
| POST | `/api/v1/crisis/workflows/:id/version` | New version: archive current, save new as Active |
| POST | `/api/v1/crisis/workflows/:id/run` | Run active version (SSE stream) |

## Curl: test versioning logic

Assume the API is running on `http://localhost:8080`.

**1. Create a workflow**

```bash
curl -s -X POST http://localhost:8080/api/v1/crisis/workflows \
  -H "Content-Type: application/json" \
  -d '{"workflow_json":{"name":"988 Intake","version":"1.0","nodes":[{"id":"n1","type":"API","config":{"endpoint":"https://httpbin.org/get","method":"GET"},"next_nodes":[]}]}}'
```

Save the returned `id` (e.g. `a1b2c3d4-...`).

**2. List active (should show one)**

```bash
curl -s http://localhost:8080/api/v1/crisis/workflows
```

**3. Create a new version (version override)**

Replace `WORKFLOW_ID` with the `id` from step 1.

```bash
curl -s -X POST "http://localhost:8080/api/v1/crisis/workflows/WORKFLOW_ID/version" \
  -H "Content-Type: application/json" \
  -d '{"workflow_json":{"name":"988 Intake v2","version":"2.0","nodes":[{"id":"n1","type":"API","config":{"endpoint":"https://httpbin.org/get","method":"GET"},"next_nodes":[]},{"id":"n2","type":"API","config":{"endpoint":"https://httpbin.org/delay/0","method":"GET"},"next_nodes":[]}]}}'
```

Response: new row with `version: 2`, `status: "Active"`. Previous row is `Archived`.

**4. List active again (still one workflow, but version 2)**

```bash
curl -s http://localhost:8080/api/v1/crisis/workflows
```

**5. Run the workflow (SSE)**

```bash
curl -N -X POST "http://localhost:8080/api/v1/crisis/workflows/WORKFLOW_ID/run"
```

You should see SSE events from the Orchestrator runner.
