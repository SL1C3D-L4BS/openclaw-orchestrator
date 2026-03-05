import type { SkillManifest, SkillNodePayload } from "@/types/skill";
import type { Node, Edge } from "@xyflow/react";

export const DEFAULT_MANIFEST_NAME = "My Skill";
export const DEFAULT_MANIFEST_VERSION = "0.1.0";

/**
 * Build SkillManifest from React Flow nodes and edges.
 * Moving nodes and connecting them updates the graph; this derives the manifest for export.
 */
export function buildManifestFromGraph(
  nodes: Node<{ id: string; type: string; config?: Record<string, unknown>; label?: string }>[],
  edges: Edge[],
  name: string = DEFAULT_MANIFEST_NAME,
  version: string = DEFAULT_MANIFEST_VERSION
): SkillManifest {
  const skillNodes = nodes
    .filter((n) => n.type === "skillNode" && n.data?.type)
    .map((n) => {
      const nextNodes = edges
        .filter((e) => e.source === n.id)
        .map((e) => e.target);
      return {
        id: n.id,
        type: n.data.type as "API" | "CLI" | "BROWSER",
        config: n.data.config ?? {},
        next_nodes: nextNodes,
      } satisfies SkillNodePayload;
    });
  return { name, version, nodes: skillNodes };
}

/**
 * Returns node IDs in execution order (BFS from first node). Used for simulation.
 */
export function getExecutionOrder(
  nodes: { id: string }[],
  edges: { source: string; target: string }[]
): string[] {
  if (nodes.length === 0) return [];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const outEdges = new Map<string, string[]>();
  for (const e of edges) {
    const list = outEdges.get(e.source) ?? [];
    list.push(e.target);
    outEdges.set(e.source, list);
  }
  const order: string[] = [];
  const seen = new Set<string>();
  let queue = [nodes[0].id];
  while (queue.length) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    order.push(id);
    for (const next of outEdges.get(id) ?? []) {
      if (!seen.has(next)) queue.push(next);
    }
  }
  for (const n of nodes) {
    if (!seen.has(n.id)) order.push(n.id);
  }
  return order;
}
