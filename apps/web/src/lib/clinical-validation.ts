import type { Node, Edge } from "@xyflow/react";

/** Crisis node data may include a clinical subtype for validation. */
export type CrisisNodeData = {
  id: string;
  type: string;
  config?: Record<string, unknown>;
  label?: string;
  subtype?: string;
};

/**
 * Validates a crisis workflow graph before publish.
 * Returns { valid: true } or { valid: false, errors: string[] }.
 *
 * Rule 1: At least one node must be Intake (e.g. subtype === '988_intake').
 * Rule 2: Every terminal node (no outgoing edges) must be Dispatch or Resolution (no dead ends).
 */
export function validateCrisisWorkflow(
  nodes: Node<CrisisNodeData | Record<string, unknown>>[],
  edges: Edge[]
): { valid: true } | { valid: false; errors: string[] } {
  const errors: string[] = [];
  const nodeList = nodes.filter((n) => n.type === "skillNode" && n.data);
  const sourceIds = new Set(edges.map((e) => e.source));

  const getSubtype = (data: CrisisNodeData | Record<string, unknown>): string | undefined =>
    typeof (data as CrisisNodeData).subtype === "string"
      ? (data as CrisisNodeData).subtype
      : undefined;

  // Rule 1: At least one Intake node
  const hasIntake = nodeList.some((n) => getSubtype(n.data) === "988_intake");
  if (!hasIntake) {
    errors.push("The graph must contain at least one Intake node (subtype: 988_intake).");
  }

  // Rule 2: Every terminal node (no outgoing edge) must be Dispatch or Resolution
  const terminalNodeIds = nodeList.filter((n) => !sourceIds.has(n.id)).map((n) => n.id);
  const allowedTerminalSubtypes = ["dispatch", "resolution"];
  for (const id of terminalNodeIds) {
    const node = nodeList.find((n) => n.id === id);
    if (!node) continue;
    const subtype = (getSubtype(node.data) ?? "").toLowerCase();
    if (!allowedTerminalSubtypes.includes(subtype)) {
      errors.push(
        `Terminal node "${node.id}" (no outgoing edges) must be a Dispatch or Resolution node. Found subtype: ${subtype || "(none)"}.`
      );
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true };
}
