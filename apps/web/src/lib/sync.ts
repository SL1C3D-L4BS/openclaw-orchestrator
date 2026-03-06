/**
 * Sync engine: pull active crisis workflows from the Go API into the local LibSQL DB.
 * Client-only; run when online.
 */

import { getAuthHeaders } from "./auth-store";
import { upsertWorkflow } from "./db";

const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080")
    : "http://localhost:8080";

export interface RemoteCrisisWorkflow {
  id: string;
  version: number;
  workflow_json: Record<string, unknown> | string;
  status: string;
  created_at: string;
}

/**
 * Fetches active workflows from GET /api/v1/crisis/workflows and upserts them
 * into the local LibSQL database. If a local record exists with a lower version,
 * it is overwritten with server data and sync_status is set to 'synced'.
 */
export async function syncWorkflows(): Promise<{ count: number }> {
  const res = await fetch(`${API_BASE}/api/v1/crisis/workflows`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Sync failed: ${res.status} ${res.statusText}`);
  }
  const list = (await res.json()) as RemoteCrisisWorkflow[];
  if (!Array.isArray(list)) {
    return { count: 0 };
  }
  for (const w of list) {
    const workflowJson =
      typeof w.workflow_json === "string"
        ? w.workflow_json
        : JSON.stringify(w.workflow_json);
    await upsertWorkflow(
      {
        id: w.id,
        version: w.version,
        workflow_json: workflowJson,
        status: w.status,
        created_at: w.created_at,
      },
      "synced"
    );
  }
  return { count: list.length };
}
