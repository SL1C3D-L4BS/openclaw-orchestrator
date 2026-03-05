import type { Node, Edge } from "@xyflow/react";
import type { NodeType, SkillNodeData } from "@/types/skill";

/** One step in a prebuilt workflow (chain of nodes). */
export interface WorkflowStep {
  type: NodeType;
  label: string;
  config?: Record<string, unknown>;
}

const NODE_WIDTH = 240;
const NODE_SPACING = 120;

/**
 * Converts a workflow definition (chain of steps) into React Flow nodes and edges.
 * Uses optional prefix for node IDs and optional offset for layout when appending to canvas.
 */
export function workflowToReactFlow(
  steps: WorkflowStep[],
  options: {
    idPrefix?: string;
    offset?: { x: number; y: number };
  } = {}
): { nodes: Node<SkillNodeData, "skillNode">[]; edges: Edge[] } {
  const { idPrefix = "skill", offset = { x: 0, y: 0 } } = options;
  const nodes: Node<SkillNodeData, "skillNode">[] = [];
  const edges: Edge[] = [];

  steps.forEach((step, i) => {
    const id = `${idPrefix}-${i + 1}`;
    nodes.push({
      id,
      type: "skillNode",
      position: {
        x: offset.x + i * (NODE_WIDTH + NODE_SPACING),
        y: offset.y,
      },
      data: {
        id,
        type: step.type,
        config: step.config ?? {},
        label: step.label,
      } satisfies SkillNodeData,
    });
    if (i > 0) {
      edges.push({
        id: `e-${idPrefix}-${i}`,
        source: `${idPrefix}-${i}`,
        target: id,
      });
    }
  });

  return { nodes, edges };
}

/** Derive a default workflow (steps) from a skill's type string and name. */
export function defaultWorkflowFromSkillType(
  typeStr: string,
  skillName: string
): WorkflowStep[] {
  const parts = typeStr
    .split(/\+|\s+and\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
  const steps: WorkflowStep[] = [];
  const labels = skillName.split(" ").slice(0, 3).join(" ");
  if (parts.length === 0) {
    return [
      { type: "API", label: labels || "Step 1", config: { endpoint: "/api/v1", method: "POST" } },
    ];
  }
  parts.forEach((p, i) => {
    const label = parts.length === 1 ? labels || skillName : `${labels} – ${p} (${i + 1})`;
    if (p === "BROWSER") {
      steps.push({
        type: "BROWSER",
        label: label.slice(0, 40),
        config: { url: "https://example.com", action: "read" },
      });
    } else if (p === "CLI") {
      steps.push({
        type: "CLI",
        label: label.slice(0, 40),
        config: { command: "run", args: [] },
      });
    } else {
      steps.push({
        type: "API",
        label: label.slice(0, 40),
        config: { endpoint: "/api/v1", method: "POST" },
      });
    }
  });
  return steps;
}
