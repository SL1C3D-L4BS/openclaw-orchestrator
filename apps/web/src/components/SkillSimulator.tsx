"use client";

import { useState, useRef, useCallback } from "react";
import { X, Play, Square, Terminal } from "lucide-react";
import { buildManifestFromGraph } from "@/lib/manifest";
import type { Node, Edge } from "@xyflow/react";

export interface LogEntry {
  time: string;
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  message: string;
  status: "info" | "success" | "error";
}

interface SkillSimulatorProps {
  open: boolean;
  onClose: () => void;
  nodes: Node<{ id: string; type: string; config?: Record<string, unknown>; label?: string }>[];
  edges: Edge[];
  onActiveNodeChange: (nodeId: string | null) => void;
  onSimulationComplete: (success: boolean) => void;
}

const apiBase =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080")
    : "http://localhost:8080";

function formatTime() {
  const d = new Date();
  return d.toISOString().split("T")[1]!.slice(0, 12);
}

function getNodeLabel(
  nodeId: string,
  nodeMap: Map<string, Node<{ id: string; type: string; config?: Record<string, unknown>; label?: string }>>
): string {
  const node = nodeMap.get(nodeId);
  if (!node?.data) return nodeId;
  return (node.data.label as string) ?? nodeId;
}

function getNodeType(
  nodeId: string,
  nodeMap: Map<string, Node<{ id: string; type: string; config?: Record<string, unknown>; label?: string }>>
): string {
  const node = nodeMap.get(nodeId);
  if (!node?.data) return "";
  return (node.data.type as string) ?? "";
}

export default function SkillSimulator({
  open,
  onClose,
  nodes,
  edges,
  onActiveNodeChange,
  onSimulationComplete,
}: SkillSimulatorProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const runSimulation = useCallback(async () => {
    const skillNodes = nodes.filter(
      (n) => n.type === "skillNode" && n.data?.type
    );
    if (skillNodes.length === 0) {
      setError("Add at least one skill node to run.");
      return;
    }
    setError(null);
    setLogs([]);
    setRunning(true);
    onActiveNodeChange(null);

    const manifest = buildManifestFromGraph(nodes, edges);
    const nodeMap = new Map(skillNodes.map((n) => [n.id, n]));

    const ac = new AbortController();
    abortControllerRef.current = ac;

    const addLog = (entry: Omit<LogEntry, "time">) => {
      setLogs((prev) => [...prev, { ...entry, time: formatTime() }]);
    };

    try {
      const res = await fetch(`${apiBase}/api/v1/skills/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manifest),
        signal: ac.signal,
      });
      if (!res.ok) {
        const text = await res.text();
        setError(`Run failed: ${res.status} ${text || res.statusText}`);
        setRunning(false);
        onSimulationComplete(false);
        return;
      }
      const reader = res.body?.getReader();
      if (!reader) {
        setError("No response body");
        setRunning(false);
        onSimulationComplete(false);
        return;
      }
      const dec = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += dec.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const event of events) {
          const line = event.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          const raw = line.slice(6);
          try {
            const ev = JSON.parse(raw) as {
              nodeId?: string;
              message?: string;
              status?: string;
            };
            const nodeId = ev.nodeId ?? "";
            const message = ev.message ?? raw;
            const status = (ev.status as "info" | "success" | "error") ?? "info";
            if (nodeId) onActiveNodeChange(nodeId);
            addLog({
              nodeId,
              nodeLabel: getNodeLabel(nodeId, nodeMap),
              nodeType: getNodeType(nodeId, nodeMap),
              message,
              status,
            });
            if (message === "Execution complete." && status === "success") {
              onActiveNodeChange(null);
              onSimulationComplete(true);
            }
          } catch {
            addLog({
              nodeId: "",
              nodeLabel: "",
              nodeType: "",
              message: raw,
              status: "info",
            });
          }
        }
      }
      if (buffer.trim()) {
        const line = buffer.split("\n").find((l) => l.startsWith("data: "));
        if (line) {
          try {
            const raw = line.slice(6);
            const ev = JSON.parse(raw) as { nodeId?: string; message?: string; status?: string };
            addLog({
              nodeId: ev.nodeId ?? "",
              nodeLabel: ev.nodeId ? getNodeLabel(ev.nodeId, nodeMap) : "",
              nodeType: ev.nodeId ? getNodeType(ev.nodeId, nodeMap) : "",
              message: ev.message ?? raw,
              status: (ev.status as "info" | "success" | "error") ?? "info",
            });
          } catch {
            addLog({ nodeId: "", nodeLabel: "", nodeType: "", message: buffer, status: "info" });
          }
        }
      }
      onActiveNodeChange(null);
      onSimulationComplete(true);
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        addLog({
          nodeId: "",
          nodeLabel: "",
          nodeType: "",
          message: "Run stopped by user.",
          status: "info",
        });
        onSimulationComplete(false);
      } else {
        setError(e instanceof Error ? e.message : "Run failed. Is the API running on port 8080?");
        onSimulationComplete(false);
      }
    } finally {
      setRunning(false);
      onActiveNodeChange(null);
      abortControllerRef.current = null;
    }
  }, [nodes, edges, onActiveNodeChange, onSimulationComplete]);

  const stopSimulation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md flex flex-col border-l border-zinc-800 bg-zinc-900 shadow-2xl"
        role="dialog"
        aria-label="Skill Simulator"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-500" />
            <h2 className="font-semibold text-zinc-100">Skill Simulator</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2 border-b border-zinc-800 p-3">
          <button
            type="button"
            onClick={() => void runSimulation()}
            disabled={running}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            Run Simulation
          </button>
          {running && (
            <button
              type="button"
              onClick={stopSimulation}
              className="flex items-center gap-2 rounded-lg border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          )}
        </div>
        {error && (
          <div className="mx-3 mt-2 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-800/30">
            <p className="text-xs text-zinc-400">
              Execution Environment: Local Sandbox. Note: BROWSER nodes are currently simulated for safety.
            </p>
          </div>
          <p className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Console Output
          </p>
          <div className="flex-1 overflow-y-auto bg-zinc-950 border-t border-zinc-800 font-mono text-xs">
            <div className="p-3 space-y-1.5">
              {logs.length === 0 && (
                <p className="text-zinc-600">
                  Click &quot;Run Simulation&quot; to run your workflow. Logs stream in real time from the API.
                </p>
              )}
              {logs.map((entry, i) => (
                <div
                  key={i}
                  className={`rounded px-2 py-1.5 ${
                    entry.status === "success"
                      ? "text-emerald-400/90 bg-emerald-500/5"
                      : entry.status === "error"
                        ? "text-red-400/90 bg-red-500/5"
                        : "text-zinc-400"
                  }`}
                >
                  <span className="text-zinc-500">[{entry.time}]</span>{" "}
                  {entry.nodeLabel && (
                    <span className="text-violet-400">{entry.nodeLabel}</span>
                  )}{" "}
                  {entry.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
