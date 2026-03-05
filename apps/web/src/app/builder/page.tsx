"use client";

import { useCallback, useRef, useState } from "react";
import { ReactFlowProvider, useNodesState, useEdgesState, addEdge, type Connection } from "@xyflow/react";
import VericoreHeader from "@/components/VericoreHeader";
import SkillMarketplace from "@/components/SkillMarketplace";
import SkillSimulator from "@/components/SkillSimulator";
import OrchestratorCanvas, {
  initialCanvasNodes,
  initialCanvasEdges,
} from "@/components/OrchestratorCanvas";
import { SimulationProvider } from "@/contexts/SimulationContext";
import type { Node, Edge } from "@xyflow/react";

function BuilderContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialCanvasNodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialCanvasEdges);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [simulationSuccess, setSimulationSuccess] = useState(false);
  const flowContainerRef = useRef<HTMLDivElement | null>(null);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <SimulationProvider activeNodeId={activeNodeId}>
      <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100">
        <VericoreHeader
          nodes={nodes}
          edges={edges}
          manifestName="My Skill"
          manifestVersion="0.1.0"
          onOpenSimulator={() => setSimulatorOpen(true)}
          simulationSuccess={simulationSuccess}
          flowContainerRef={flowContainerRef}
        />
        <div className="flex flex-1 min-h-0">
          <SkillMarketplace />
          <div className="flex-1 min-w-0">
            <OrchestratorCanvas
              ref={flowContainerRef}
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
            />
          </div>
        </div>
        <SkillSimulator
          open={simulatorOpen}
          onClose={() => setSimulatorOpen(false)}
          nodes={nodes}
          edges={edges}
          onActiveNodeChange={setActiveNodeId}
          onSimulationComplete={setSimulationSuccess}
        />
      </div>
    </SimulationProvider>
  );
}

export default function BuilderPage() {
  return (
    <ReactFlowProvider>
      <BuilderContent />
    </ReactFlowProvider>
  );
}
