import type { WorkflowStep } from "@/lib/workflow";
import { defaultWorkflowFromSkillType } from "@/lib/workflow";

export interface CommunitySkill {
  id: string;
  name: string;
  author: string;
  signedBy: "Vericore" | null;
  type: string;
  description?: string;
  /** Prebuilt workflow steps (nodes in order). If omitted, derived from type + name. */
  workflow?: WorkflowStep[];
}

/** Returns the prebuilt workflow for a skill (explicit or derived). */
export function getSkillWorkflow(skill: CommunitySkill): WorkflowStep[] {
  if (skill.workflow && skill.workflow.length > 0) return skill.workflow;
  return defaultWorkflowFromSkillType(skill.type, skill.name);
}

/**
 * Clinical 988 workflow seeds only. Names match API seed templates so the playground
 * can load by ?template= name. All workflows are 988-compliant (intake + dispatch/resolution).
 */
export const COMMUNITY_SKILLS: CommunitySkill[] = [
  {
    id: "988-1",
    name: "988 Intake → Dispatch",
    author: "Vericore",
    signedBy: "Vericore",
    type: "API",
    description: "Minimal 988 flow: intake then dispatch.",
    workflow: [
      { type: "API", label: "988 Intake", config: { subtype: "988_intake", endpoint: "/988/intake", method: "POST" } },
      { type: "API", label: "Dispatch", config: { subtype: "dispatch", endpoint: "/dispatch", method: "POST" } },
    ],
  },
  {
    id: "988-2",
    name: "988 Intake → Resolution",
    author: "Vericore",
    signedBy: "Vericore",
    type: "API",
    description: "Intake then resolution (no dispatch).",
    workflow: [
      { type: "API", label: "988 Intake", config: { subtype: "988_intake", endpoint: "/988/intake", method: "POST" } },
      { type: "API", label: "Resolution", config: { subtype: "resolution", endpoint: "/resolution", method: "POST" } },
    ],
  },
  {
    id: "988-3",
    name: "988 Intake → Triage → Dispatch",
    author: "Vericore",
    signedBy: "Vericore",
    type: "API",
    description: "Intake, triage, then dispatch.",
    workflow: [
      { type: "API", label: "988 Intake", config: { subtype: "988_intake", endpoint: "/988/intake", method: "POST" } },
      { type: "API", label: "Triage", config: { subtype: "triage", endpoint: "/triage", method: "POST" } },
      { type: "API", label: "Dispatch", config: { subtype: "dispatch", endpoint: "/dispatch", method: "POST" } },
    ],
  },
  {
    id: "988-4",
    name: "988 Intake → Triage → Resolution",
    author: "Vericore",
    signedBy: "Vericore",
    type: "API",
    description: "Intake, triage, then resolution.",
    workflow: [
      { type: "API", label: "988 Intake", config: { subtype: "988_intake", endpoint: "/988/intake", method: "POST" } },
      { type: "API", label: "Triage", config: { subtype: "triage", endpoint: "/triage", method: "POST" } },
      { type: "API", label: "Resolution", config: { subtype: "resolution", endpoint: "/resolution", method: "POST" } },
    ],
  },
];
