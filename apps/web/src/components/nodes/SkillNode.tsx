"use client";

import { memo, useCallback, useState } from "react";
import {
  Handle,
  Position,
  useReactFlow,
  type NodeProps,
  type Node,
} from "@xyflow/react";
import { Globe, GripVertical, Terminal, Webhook } from "lucide-react";
import { useSimulation } from "@/contexts/SimulationContext";
import type { SkillNodeData, NodeType } from "@/types/skill";

export type SkillFlowNode = Node<SkillNodeData, "skillNode">;

const TYPE_STYLES: Record<
  NodeType,
  { border: string; glow: string; icon: typeof Globe }
> = {
  API: {
    border: "border-blue-500/80",
    glow: "shadow-[0_0_12px_rgba(59,130,246,0.4)]",
    icon: Webhook,
  },
  CLI: {
    border: "border-amber-500/80",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.4)]",
    icon: Terminal,
  },
  BROWSER: {
    border: "border-emerald-500/80",
    glow: "shadow-[0_0_12px_rgba(16,185,129,0.4)]",
    icon: Globe,
  },
};

function SkillNodeComponent(props: NodeProps<SkillFlowNode>) {
  const { id, data, selected } = props;
  const { setNodes } = useReactFlow();
  const { activeNodeId } = useSimulation();
  const [isExpanded, setIsExpanded] = useState(false);
  const style = TYPE_STYLES[data.type as NodeType] ?? TYPE_STYLES.API;
  const Icon = style.icon;
  const isSimulationActive = activeNodeId === id;

  const updateConfig = useCallback(
    (key: string, value: unknown) => {
      setNodes((nodes) =>
        nodes.map((n) =>
          n.id === id
            ? {
                ...n,
                data: {
                  ...n.data,
                  ...(key === "label" && typeof value === "string"
                    ? { label: value }
                    : {}),
                  config: { ...(n.data.config ?? {}), [key]: value },
                },
              }
            : n
        )
      );
    },
    [id, setNodes]
  );

  const config = data.config ?? {};
  const label = (data.label ?? id) as string;

  return (
    <div
      className={`rounded-lg bg-zinc-900/95 backdrop-blur border-2 ${style.border} transition-shadow duration-300 ${selected ? style.glow : ""} ${isSimulationActive ? "shadow-[0_0_20px_rgba(139,92,246,0.6)] ring-2 ring-violet-400/80 " + style.glow : ""} min-w-[200px] overflow-hidden`}
    >
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-zinc-500 !border-zinc-700" />
      <div className="flex items-center gap-1">
        <div className="flex items-center py-2 pl-1.5 pr-1 text-zinc-500 cursor-grab active:cursor-grabbing" title="Drag to move">
          <GripVertical className="w-4 h-4" />
        </div>
        <div
          className="flex items-center gap-2 flex-1 px-2 py-2 border-b border-zinc-700/50 cursor-pointer nodrag min-w-0"
          onClick={() => setIsExpanded((e) => !e)}
        >
          <Icon className="w-4 h-4 text-zinc-400 shrink-0" />
          <span className="text-sm font-medium text-zinc-200 truncate">
            {label || data.type}
          </span>
          <span className="text-xs text-zinc-500 ml-auto shrink-0">{data.type}</span>
        </div>
      </div>
      {isExpanded && (
        <div className="p-3 space-y-2 border-t border-zinc-700/50 nodrag">
          <label className="block text-xs text-zinc-500">Label</label>
          <input
            type="text"
            defaultValue={label}
            placeholder="Node label"
            className="w-full px-2 py-1.5 text-sm bg-zinc-800 border border-zinc-600 rounded text-zinc-200 placeholder-zinc-500"
            onChange={(e) => updateConfig("label", e.target.value)}
          />
          {data.type === "BROWSER" && (
            <>
              <label className="block text-xs text-zinc-500">URL</label>
              <input
                type="url"
                defaultValue={(config.url as string) ?? ""}
                placeholder="https://..."
                className="w-full px-2 py-1.5 text-sm bg-zinc-800 border border-zinc-600 rounded text-zinc-200 placeholder-zinc-500"
                onChange={(e) => updateConfig("url", e.target.value)}
              />
            </>
          )}
          {data.type === "CLI" && (
            <>
              <label className="block text-xs text-zinc-500">Command</label>
              <input
                type="text"
                defaultValue={(config.command as string) ?? ""}
                placeholder="npm run build"
                className="w-full px-2 py-1.5 text-sm bg-zinc-800 border border-zinc-600 rounded text-zinc-200 placeholder-zinc-500 font-mono text-xs"
                onChange={(e) => updateConfig("command", e.target.value)}
              />
            </>
          )}
          {data.type === "API" && (
            <>
              <label className="block text-xs text-zinc-500">Endpoint</label>
              <input
                type="text"
                defaultValue={(config.endpoint as string) ?? ""}
                placeholder="/api/v1/..."
                className="w-full px-2 py-1.5 text-sm bg-zinc-800 border border-zinc-600 rounded text-zinc-200 placeholder-zinc-500 font-mono text-xs"
                onChange={(e) => updateConfig("endpoint", e.target.value)}
              />
              <label className="block text-xs text-zinc-500">Method</label>
              <select
                defaultValue={(config.method as string) ?? "GET"}
                className="w-full px-2 py-1.5 text-sm bg-zinc-800 border border-zinc-600 rounded text-zinc-200"
                onChange={(e) => updateConfig("method", e.target.value)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </>
          )}
        </div>
      )}
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-zinc-500 !border-zinc-700" />
    </div>
  );
}

export default memo(SkillNodeComponent);
