"use client";

import { useState } from "react";
import { Shield, Download, Loader2, CheckCircle, AlertCircle, Play, BadgeCheck } from "lucide-react";
import {
  validateSkillChain,
  exportSkillChain,
  downloadBlob,
} from "@/lib/api";
import { buildManifestFromGraph } from "@/lib/manifest";
import ShareGraph from "@/components/ShareGraph";
import type { Node, Edge } from "@xyflow/react";

interface VericoreHeaderProps {
  nodes: Node<{ id: string; type: string; config?: Record<string, unknown>; label?: string }>[];
  edges: Edge[];
  manifestName?: string;
  manifestVersion?: string;
  onOpenSimulator?: () => void;
  simulationSuccess?: boolean;
  flowContainerRef?: React.RefObject<HTMLElement | null>;
}

export default function VericoreHeader({
  nodes,
  edges,
  manifestName,
  manifestVersion,
  onOpenSimulator,
  simulationSuccess = false,
  flowContainerRef,
}: VericoreHeaderProps) {
  const [status, setStatus] = useState<"idle" | "validating" | "exporting" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [trustScore, setTrustScore] = useState(100);

  const handleSignAndExport = async () => {
    setMessage(null);
    const manifest = buildManifestFromGraph(
      nodes,
      edges,
      manifestName ?? "My Skill",
      manifestVersion ?? "0.1.0"
    );
    if (manifest.nodes.length === 0) {
      setStatus("error");
      setMessage("Add at least one skill node to export.");
      return;
    }
    setStatus("validating");
    try {
      const result = await validateSkillChain(manifest);
      if (!result.valid) {
        setStatus("error");
        setMessage(result.errors?.join(" ") ?? "Validation failed.");
        return;
      }
      setStatus("exporting");
      const blob = await exportSkillChain(manifest);
      downloadBlob(blob, "skill.jsonl");
      setStatus("success");
      setMessage("Signed & exported successfully. Verified by Vericore.");
      setTrustScore(100);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Export failed.");
      setTrustScore(0);
    }
  };

  return (
    <header className="flex items-center justify-between gap-4 px-6 py-3 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-violet-400" />
          <span className="font-semibold text-zinc-100">OpenClaw Skill Orchestrator</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700">
          <span className="text-xs text-zinc-500">Vericore Trust Score</span>
          <span
            className={`font-mono font-semibold ${
              trustScore >= 80 ? "text-emerald-400" : trustScore >= 50 ? "text-amber-400" : "text-red-400"
            }`}
          >
            {trustScore}%
          </span>
        </div>
        {simulationSuccess && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <BadgeCheck className="w-4 h-4" />
            Simulated Success
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {status === "validating" && (
          <span className="flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Validating…
          </span>
        )}
        {status === "exporting" && (
          <span className="flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Signing & exporting…
          </span>
        )}
        {status === "success" && message && (
          <span className="flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle className="w-4 h-4" /> {message}
          </span>
        )}
        {status === "error" && message && (
          <span className="flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4" /> {message}
          </span>
        )}
        {onOpenSimulator && (
          <button
            type="button"
            onClick={onOpenSimulator}
            className="flex items-center gap-2 rounded-lg border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            title="Dry-run skill chain"
          >
            <Play className="w-4 h-4" />
            Simulator
          </button>
        )}
        {flowContainerRef && <ShareGraph flowContainerRef={flowContainerRef} />}
        <button
          type="button"
          onClick={handleSignAndExport}
          disabled={status === "validating" || status === "exporting"}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-4 h-4" />
          Sign & Export
        </button>
      </div>
    </header>
  );
}
