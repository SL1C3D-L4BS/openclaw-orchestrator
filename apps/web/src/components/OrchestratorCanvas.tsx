"use client";

import { forwardRef, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Connection,
  ConnectionMode,
  useReactFlow,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import SkillNode from "./nodes/SkillNode";
import type { SkillNodeData } from "@/types/skill";
import type { CommunitySkill } from "@/data/communitySkills";

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
  /** When a community skill is dropped on the canvas, add its workflow at the drop position. */
  onDropSkill?: (skill: CommunitySkill, position: { x: number; y: number }) => void;
}

const OrchestratorCanvas = forwardRef<HTMLDivElement, OrchestratorCanvasProps>(
  function OrchestratorCanvas(
    { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDropSkill },
    ref
  ) {
    const { screenToFlowPosition } = useReactFlow();

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        if (!onDropSkill) return;
        e.preventDefault();
        const raw = e.dataTransfer.getData("application/json");
        if (!raw) return;
        try {
          const skill = JSON.parse(raw) as CommunitySkill;
          const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
          onDropSkill(skill, position);
        } catch {
          // ignore invalid drag data
        }
      },
      [onDropSkill, screenToFlowPosition]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }, []);

    return (
      <div ref={ref} className="relative w-full flex-1 min-h-0 min-w-0 overflow-hidden bg-zinc-950" style={{ minHeight: 200 }}>
        <div className="absolute inset-0 min-w-0 overflow-hidden" onDrop={handleDrop} onDragOver={handleDragOver}>
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
      </div>
    );
  }
);

export default OrchestratorCanvas;
