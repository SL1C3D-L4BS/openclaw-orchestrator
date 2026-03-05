"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink, X } from "lucide-react";
import { COMMUNITY_SKILLS, type CommunitySkill } from "@/data/communitySkills";

export default function SkillMarketplace() {
  const [selectedSkill, setSelectedSkill] = useState<CommunitySkill | null>(null);

  return (
    <aside className="w-72 shrink-0 border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-200">Community Skills</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Import or inspire from the marketplace.</p>
      </div>
      <ul className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
        {COMMUNITY_SKILLS.map((skill) => (
          <li key={skill.id}>
            <button
              type="button"
              onClick={() => setSelectedSkill(skill)}
              className={`w-full text-left group flex items-start gap-2 p-2 rounded-lg transition-colors cursor-pointer ${
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
            </button>
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
          <Link
            href={`/api-playground?template=${encodeURIComponent(selectedSkill.name)}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-400 hover:text-violet-300"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in API Playground
          </Link>
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
