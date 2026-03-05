"use client";

import { forwardRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Connection,
  ConnectionMode,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import SkillNode from "./nodes/SkillNode";
import type { SkillNodeData } from "@/types/skill";

const nodeTypes = { skillNode: SkillNode };

export const initialCanvasNodes: Node<SkillNodeData, "skillNode">[] = [
  {
    id: "1",
    type: "skillNode",
    position: { x: 100, y: 100 },
    data: { id: "1", type: "BROWSER", config: { url: "https://example.com" }, label: "Open page" },
  },
  {
    id: "2",
    type: "skillNode",
    position: { x: 400, y: 100 },
    data: { id: "2", type: "API", config: { endpoint: "/api/parse", method: "POST" }, label: "Parse" },
  },
];

export const initialCanvasEdges: Edge[] = [];

interface OrchestratorCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
}

const OrchestratorCanvas = forwardRef<HTMLDivElement, OrchestratorCanvasProps>(
  function OrchestratorCanvas(
    { nodes, edges, onNodesChange, onEdgesChange, onConnect },
    ref
  ) {
    return (
      <div ref={ref} className="w-full h-full bg-zinc-950">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          className="bg-zinc-950"
          colorMode="dark"
        >
          <Background color="#27272a" gap={16} />
          <Controls className="!bg-zinc-900 !border-zinc-700 !rounded-lg" />
          <MiniMap
            className="!bg-zinc-900 !border-zinc-700"
            nodeColor={(n) => {
              const d = n.data as { type?: string };
              if (d?.type === "API") return "#3b82f6";
              if (d?.type === "CLI") return "#f59e0b";
              if (d?.type === "BROWSER") return "#10b981";
              return "#71717a";
            }}
          />
        </ReactFlow>
      </div>
    );
  }
);

export default OrchestratorCanvas;
