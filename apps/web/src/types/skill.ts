// Mirrors apps/api/models/skill.go for type-safe API usage.

export const NODE_TYPES = ["API", "CLI", "BROWSER"] as const;
export type NodeType = (typeof NODE_TYPES)[number];

export interface SkillNodeData extends Record<string, unknown> {
  id: string;
  type: NodeType;
  config: Record<string, unknown>;
  label?: string;
}

export interface SkillNodePayload {
  id: string;
  type: NodeType;
  config: Record<string, unknown>;
  next_nodes: string[];
}

export interface SkillManifest {
  name: string;
  version: string;
  nodes: SkillNodePayload[];
  pqc_proof?: string;
  signed_by?: string;
}

export interface ValidateResult {
  valid: boolean;
  errors?: string[];
}
