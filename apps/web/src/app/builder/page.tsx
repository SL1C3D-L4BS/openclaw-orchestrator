"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ReactFlowProvider, useNodesState, useEdgesState, addEdge, type Connection } from "@xyflow/react";
import { Group, Panel, Separator } from "react-resizable-panels";
import VericoreHeader from "@/components/VericoreHeader";
import SkillMarketplace from "@/components/SkillMarketplace";
import SkillSimulator from "@/components/SkillSimulator";
import OrchestratorCanvas from "@/components/OrchestratorCanvas";
import { SimulationProvider } from "@/contexts/SimulationContext";
import { getSkillWorkflow, type CommunitySkill } from "@/data/communitySkills";
import { workflowToReactFlow } from "@/lib/workflow";
import type { Node, Edge } from "@xyflow/react";

const STORAGE_KEY = "openclaw_draft_graph";

/** Minimal OSINT-Prospector style first-run graph: BROWSER → API. */
const firstRunNodes: Node[] = [
  {
    id: "1",
    type: "skillNode",
    position: { x: 100, y: 120 },
    data: {
      id: "1",
      type: "BROWSER",
      config: { url: "https://www.linkedin.com/sales/search/people", action: "scrape" },
      label: "Scrape prospects",
    },
  },
  {
    id: "2",
    type: "skillNode",
    position: { x: 380, y: 120 },
    data: {
      id: "2",
      type: "API",
      config: { endpoint: "https://api.openai.com/v1/chat/completions", method: "POST", task: "write_outreach_email" },
      label: "Enrich & send",
    },
  },
];
const firstRunEdges: Edge[] = [{ id: "e-1-2", source: "1", target: "2" }];

function BuilderContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(firstRunNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(firstRunEdges);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [simulationSuccess, setSimulationSuccess] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const flowContainerRef = useRef<HTMLDivElement | null>(null);
  const hasInitializedRef = useRef(false);
  const skipNextSaveRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { nodes?: Node[]; edges?: Edge[] };
        if (Array.isArray(parsed.nodes) && parsed.nodes.length > 0 && Array.isArray(parsed.edges)) {
          setNodes(parsed.nodes);
          setEdges(parsed.edges);
          skipNextSaveRef.current = true;
        }
      } catch {
        // keep first-run graph
      }
    } else {
      setShowWelcomeBanner(true);
    }
    hasInitializedRef.current = true;
  }, [setNodes, setEdges]);

  useEffect(() => {
    if (typeof window === "undefined" || !hasInitializedRef.current) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
    } catch {
      // ignore quota or parse errors
    }
  }, [nodes, edges]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const loadSkillWorkflow = useCallback(
    (skill: CommunitySkill, position?: { x: number; y: number }) => {
      const steps = getSkillWorkflow(skill);
      const { nodes: newNodes, edges: newEdges } = workflowToReactFlow(steps, {
        idPrefix: `skill-${skill.id}`,
        offset: position ?? { x: 80, y: 80 },
      });
      if (position == null) {
        setNodes(newNodes);
        setEdges(newEdges);
      } else {
        setNodes((nds) => [...nds, ...newNodes]);
        setEdges((eds) => [...eds, ...newEdges]);
      }
    },
    [setNodes, setEdges]
  );

  return (
    <SimulationProvider activeNodeId={activeNodeId}>
      <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100">
        {showWelcomeBanner && (
          <div className="flex items-center justify-between gap-4 border-b border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-sm text-zinc-200">
            <p>
              Welcome to the Orchestrator. We&apos;ve loaded a sample skill to get you started. Your progress will auto-save locally.
            </p>
            <button
              type="button"
              onClick={() => setShowWelcomeBanner(false)}
              className="shrink-0 rounded px-2 py-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              aria-label="Dismiss"
            >
              Dismiss
            </button>
          </div>
        )}
        <VericoreHeader
          nodes={nodes}
          edges={edges}
          manifestName="My Skill"
          manifestVersion="0.1.0"
          onOpenSimulator={() => setSimulatorOpen(true)}
          simulationSuccess={simulationSuccess}
          flowContainerRef={flowContainerRef}
        />
        <Group orientation="horizontal" className="flex-1 min-h-0 w-full">
          <Panel id="sidebar" defaultSize="28" minSize="22" maxSize="45" className="relative z-10 flex flex-col min-w-0 overflow-hidden">
            <SkillMarketplace onLoadWorkflow={loadSkillWorkflow} />
          </Panel>
          <Separator id="resize" className="relative z-10 w-1.5 shrink-0 bg-zinc-800 transition-colors hover:bg-violet-500/60 active:bg-violet-500/80" />
          <Panel id="canvas" defaultSize="72" minSize="40" className="relative z-0 flex flex-col min-h-0 min-w-0 overflow-hidden">
            <OrchestratorCanvas
              ref={flowContainerRef}
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDropSkill={loadSkillWorkflow}
            />
          </Panel>
        </Group>
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
