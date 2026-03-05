"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink, LayoutGrid, X } from "lucide-react";
import { COMMUNITY_SKILLS, type CommunitySkill } from "@/data/communitySkills";

export interface SkillMarketplaceProps {
  /** Load a skill's prebuilt workflow into the canvas (replace if no position, append at position if provided). */
  onLoadWorkflow?: (skill: CommunitySkill, position?: { x: number; y: number }) => void;
}

export default function SkillMarketplace({ onLoadWorkflow }: SkillMarketplaceProps) {
  const [selectedSkill, setSelectedSkill] = useState<CommunitySkill | null>(null);

  const handleDragStart = (e: React.DragEvent, skill: CommunitySkill) => {
    e.dataTransfer.setData("application/json", JSON.stringify(skill));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <aside className="w-72 shrink-0 border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-200">Community Skills</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Drag onto canvas or select and add. Prebuilt nodes &amp; workflows.</p>
      </div>
      <ul className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
        {COMMUNITY_SKILLS.map((skill) => (
          <li key={skill.id}>
            <div
              role="button"
              tabIndex={0}
              draggable={!!onLoadWorkflow}
              onDragStart={(e) => onLoadWorkflow && handleDragStart(e, skill)}
              onClick={() => setSelectedSkill(skill)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedSkill(skill);
                }
              }}
              className={`w-full text-left group flex items-start gap-2 p-2 rounded-lg transition-colors cursor-pointer ${onLoadWorkflow ? "cursor-grab active:cursor-grabbing" : ""} ${
                selectedSkill?.id === skill.id
                  ? "bg-violet-500/20 ring-1 ring-violet-400/50"
                  : "hover:bg-zinc-800/50"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {skill.signedBy === "Vericore" ? (
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 ring-2 ring-violet-400/50 shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                    title="PQC Verified"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                  </span>
                ) : (
                  <span className="inline-block w-5 h-5 rounded-full border border-zinc-600 bg-zinc-800" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-200 truncate">{skill.name}</p>
                <p className="text-xs text-zinc-500">
                  {skill.author}
                  {skill.signedBy === "Vericore" && (
                    <span className="ml-1 text-violet-400" title="PQC Verified">
                      • Verified
                    </span>
                  )}
                </p>
                <p className="text-xs text-zinc-600 mt-0.5">{skill.type}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {selectedSkill && (
        <div className="border-t border-zinc-800 p-3 bg-zinc-900 space-y-3 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-200 truncate">{selectedSkill.name}</p>
              <p className="text-xs text-zinc-500">
                {selectedSkill.author}
                {selectedSkill.signedBy === "Vericore" && (
                  <span className="ml-1 text-violet-400">• Verified</span>
                )}
              </p>
              <p className="text-xs text-zinc-600 mt-0.5">{selectedSkill.type}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSkill(null)}
              className="shrink-0 p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {selectedSkill.description && (
            <p className="text-xs text-zinc-400 leading-relaxed">{selectedSkill.description}</p>
          )}
          <div className="flex flex-col gap-2">
            {onLoadWorkflow && (
              <button
                type="button"
                onClick={() => onLoadWorkflow(selectedSkill)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-200 bg-violet-600 hover:bg-violet-500 px-3 py-2 rounded-lg transition-colors"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Add to canvas (full workflow)
              </button>
            )}
            <Link
              href={`/api-playground?template=${encodeURIComponent(selectedSkill.name)}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-400 hover:text-violet-300"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in API Playground
            </Link>
          </div>
        </div>
      )}
      <div className="p-2 border-t border-zinc-800">
        <p className="text-xs text-zinc-500 text-center">
          Skills signed by <strong className="text-violet-400">Vericore</strong> are PQC-verified and tamper-evident.
        </p>
      </div>
    </aside>
  );
}
