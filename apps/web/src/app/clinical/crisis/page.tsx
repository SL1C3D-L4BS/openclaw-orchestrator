"use client";

import { useCallback, useRef, useState } from "react";
import {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
} from "@xyflow/react";
import { Shield, Loader2, CheckCircle, AlertCircle, Send } from "lucide-react";
import OrchestratorCanvas from "@/components/OrchestratorCanvas";
import { buildManifestFromGraph } from "@/lib/manifest";
import { validateCrisisWorkflow } from "@/lib/clinical-validation";
import { getAuthHeaders, getToken, login, clearToken } from "@/lib/auth-store";
import type { SkillNodeData } from "@/types/skill";
import type { Node, Edge } from "@xyflow/react";

const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080")
    : "http://localhost:8080";

type CrisisSkillNode = Node<SkillNodeData & { subtype?: string }>;

/** Seed graph: Intake → Dispatch (passes clinical validation). */
const initialNodes: CrisisSkillNode[] = [
  {
    id: "intake-1",
    type: "skillNode",
    position: { x: 120, y: 140 },
    data: {
      id: "intake-1",
      type: "API",
      config: { endpoint: "/988/intake", method: "POST", subtype: "988_intake" },
      label: "988 Intake",
      subtype: "988_intake",
    } as SkillNodeData & { subtype?: string },
  },
  {
    id: "dispatch-1",
    type: "skillNode",
    position: { x: 420, y: 140 },
    data: {
      id: "dispatch-1",
      type: "API",
      config: { endpoint: "/dispatch", method: "POST", subtype: "dispatch" },
      label: "Dispatch",
      subtype: "dispatch",
    } as SkillNodeData & { subtype?: string },
  },
];
const initialEdges: Edge[] = [{ id: "e-i-d", source: "intake-1", target: "dispatch-1" }];

// Ensure subtype is on data for validation (mirror from config if needed)
function ensureSubtypeOnData(nodes: CrisisSkillNode[]): Node<SkillNodeData & { subtype?: string }>[] {
  return nodes.map((n) => {
    const d = n.data as SkillNodeData & { subtype?: string };
    const subtype = d.subtype ?? (d.config && typeof d.config.subtype === "string" ? d.config.subtype : undefined);
    return { ...n, data: { ...d, subtype } };
  });
}

function CrisisIDEContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState<CrisisSkillNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [publishStatus, setPublishStatus] = useState<"idle" | "publishing" | "success" | "error">("idle");
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [publishedVersion, setPublishedVersion] = useState<number | null>(null);
  const [authRole, setAuthRole] = useState<string | null>(null);
  const flowContainerRef = useRef<HTMLDivElement | null>(null);

  const handleLogin = useCallback(async (user: "test_director" | "test_responder") => {
    try {
      const { role } = await login(user);
      setAuthRole(role);
    } catch {
      setAuthRole(null);
    }
  }, []);

  const handleLogout = useCallback(() => {
    clearToken();
    setAuthRole(null);
  }, []);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const handlePublish = useCallback(async () => {
    setPublishMessage(null);
    const nodesWithSubtype = ensureSubtypeOnData(nodes);
    const result = validateCrisisWorkflow(nodesWithSubtype, edges);

    if (!result.valid) {
      setPublishStatus("error");
      const msg = result.errors.join("\n");
      setPublishMessage(msg);
      if (typeof window !== "undefined") window.alert(`Validation failed:\n\n${msg}`);
      return;
    }

    setPublishStatus("publishing");
    try {
      const manifest = buildManifestFromGraph(
        nodes,
        edges,
        "Crisis Workflow",
        "1.0"
      );
      if (manifest.nodes.length === 0) {
        setPublishStatus("error");
        setPublishMessage("Add at least one node to publish.");
        return;
      }

      const res = await fetch(`${API_BASE}/api/v1/crisis/workflows`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ workflow_json: manifest }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      const created = (await res.json()) as { version?: number };
      const version = typeof created.version === "number" ? created.version : 1;
      setPublishedVersion(version);
      setPublishStatus("success");
      setPublishMessage(`Published Version ${version}`);
    } catch (e) {
      setPublishStatus("error");
      setPublishMessage(e instanceof Error ? e.message : "Publish failed.");
    }
  }, [nodes, edges]);

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100">
      <header className="flex items-center justify-between gap-4 px-6 py-3 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur shrink-0">
        <div className="flex items-center gap-4">
          <Shield className="w-6 h-6 text-violet-400" />
          <span className="font-semibold text-zinc-100">Crisis IDE — 988 / Dispatch</span>
        </div>
        <div className="flex items-center gap-3">
          {getToken() ? (
            <span className="flex items-center gap-2 text-sm text-zinc-400">
              {authRole ?? "Logged in"}
              <button type="button" onClick={handleLogout} className="text-violet-400 hover:underline">Log out</button>
            </span>
          ) : (
            <span className="flex items-center gap-2 text-sm">
              <button type="button" onClick={() => handleLogin("test_director")} className="rounded bg-violet-600 px-2 py-1 text-white hover:bg-violet-500">Login as Director</button>
              <button type="button" onClick={() => handleLogin("test_responder")} className="rounded bg-zinc-600 px-2 py-1 text-zinc-200 hover:bg-zinc-500">Login as Responder</button>
            </span>
          )}
          {publishStatus === "publishing" && (
            <span className="flex items-center gap-2 text-sm text-zinc-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Publishing…
            </span>
          )}
          {publishStatus === "success" && publishMessage && (
            <span className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle className="w-4 h-4" /> {publishMessage}
            </span>
          )}
          {publishStatus === "error" && publishMessage && (
            <span className="flex items-center gap-2 text-sm text-red-400 max-w-md truncate" title={publishMessage}>
              <AlertCircle className="w-4 h-4 shrink-0" /> {publishMessage}
            </span>
          )}
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishStatus === "publishing"}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            Publish Workflow
          </button>
        </div>
      </header>
      <div ref={flowContainerRef} className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <OrchestratorCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
        />
      </div>
      {publishStatus === "error" && publishMessage && publishMessage.includes("\n") && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-lg rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 shadow-lg"
          role="alert"
        >
          <p className="font-medium text-red-400 mb-1">Validation failed</p>
          <pre className="whitespace-pre-wrap text-xs">{publishMessage}</pre>
        </div>
      )}
    </div>
  );
}

export default function CrisisIDEPage() {
  return (
    <ReactFlowProvider>
      <CrisisIDEContent />
    </ReactFlowProvider>
  );
}
