"use client";

import { useState, useRef, useCallback } from "react";
import { X, Play, Square, Terminal } from "lucide-react";
import { getExecutionOrder } from "@/lib/manifest";
import type { Node, Edge } from "@xyflow/react";

const STEP_DELAY_MS = 1200;

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

function formatTime() {
  const d = new Date();
  return d.toISOString().split("T")[1]!.slice(0, 12);
}

function getMockMessage(
  nodeType: string,
  config: Record<string, unknown>
): string {
  switch (nodeType) {
    case "BROWSER":
      return `Navigating to ${(config.url as string) || "..."}`;
    case "CLI":
      return `Running: ${(config.command as string) || "..."}`;
    case "API":
      return `${(config.method as string) || "GET"} ${(config.endpoint as string) || "..."}`;
    default:
      return "Executing step";
  }
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
  const abortRef = useRef(false);

  const runSimulation = useCallback(() => {
    const skillNodes = nodes.filter(
      (n) => n.type === "skillNode" && n.data?.type
    );
    if (skillNodes.length === 0) {
      setError("Add at least one skill node to simulate.");
      return;
    }
    setError(null);
    setLogs([]);
    setRunning(true);
    abortRef.current = false;
    onActiveNodeChange(null);

    const order = getExecutionOrder(
      skillNodes.map((n) => ({ id: n.id })),
      edges.map((e) => ({ source: e.source, target: e.target }))
    );
    const nodeMap = new Map(skillNodes.map((n) => [n.id, n]));

    let stepIndex = 0;
    const runStep = () => {
      if (abortRef.current) {
        setRunning(false);
        onActiveNodeChange(null);
        onSimulationComplete(false);
        return;
      }
      if (stepIndex >= order.length) {
        setLogs((prev) => [
          ...prev,
          {
            time: formatTime(),
            nodeId: "",
            nodeLabel: "",
            nodeType: "",
            message: "Simulation complete.",
            status: "success",
          },
        ]);
        setRunning(false);
        onActiveNodeChange(null);
        onSimulationComplete(true);
        return;
      }
      const nodeId = order[stepIndex]!;
      const node = nodeMap.get(nodeId);
      if (!node?.data) {
        stepIndex++;
        setTimeout(runStep, 300);
        return;
      }
      onActiveNodeChange(nodeId);
      const label = (node.data.label ?? nodeId) as string;
      const msg = getMockMessage(node.data.type as string, node.data.config ?? {});
      setLogs((prev) => [
        ...prev,
        {
          time: formatTime(),
          nodeId,
          nodeLabel: label,
          nodeType: node.data.type as string,
          message: msg,
          status: "info",
        },
      ]);
      stepIndex++;
      setTimeout(() => {
        setLogs((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.nodeId === nodeId)
            return [
              ...prev.slice(0, -1),
              { ...last, status: "success" as const },
            ];
          return prev;
        });
        setTimeout(runStep, 400);
      }, STEP_DELAY_MS);
    };

    setLogs((prev) => [
      ...prev,
      {
        time: formatTime(),
        nodeId: "",
        nodeLabel: "",
        nodeType: "",
        message: "Starting dry-run...",
        status: "info",
      },
    ]);
    setTimeout(runStep, 400);
  }, [nodes, edges, onActiveNodeChange, onSimulationComplete]);

  const stopSimulation = useCallback(() => {
    abortRef.current = true;
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
            onClick={runSimulation}
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
          <p className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Console Output
          </p>
          <div className="flex-1 overflow-y-auto bg-zinc-950 border-t border-zinc-800 font-mono text-xs">
            <div className="p-3 space-y-1.5">
              {logs.length === 0 && (
                <p className="text-zinc-600">
                  Click &quot;Run Simulation&quot; to dry-run your skill chain.
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
