"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CheckCircle2, ExternalLink, LayoutGrid, Search, X } from "lucide-react";
import { COMMUNITY_SKILLS, type CommunitySkill } from "@/data/communitySkills";

export interface SkillMarketplaceProps {
  /** Load a skill's prebuilt workflow into the canvas (replace if no position, append at position if provided). */
  onLoadWorkflow?: (skill: CommunitySkill, position?: { x: number; y: number }) => void;
}

const ROW_HEIGHT = 56;

export default function SkillMarketplace({ onLoadWorkflow }: SkillMarketplaceProps) {
  const [selectedSkill, setSelectedSkill] = useState<CommunitySkill | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const filteredSkills = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return COMMUNITY_SKILLS;
    return COMMUNITY_SKILLS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.author.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q) ||
        (s.description?.toLowerCase().includes(q) ?? false)
    );
  }, [searchQuery]);

  const virtualizer = useVirtualizer({
    count: filteredSkills.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  const handleDragStart = (e: React.DragEvent, skill: CommunitySkill) => {
    e.dataTransfer.setData("application/json", JSON.stringify(skill));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <aside className="h-full flex flex-col border-r border-zinc-800 bg-zinc-900/50 min-w-[280px] w-full">
      <div className="px-4 py-3 border-b border-zinc-800 shrink-0">
        <h2 className="text-sm font-semibold text-zinc-200">Community Skills</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Drag onto canvas or select and add. Prebuilt nodes &amp; workflows.</p>
      </div>
      <div className="shrink-0 px-2 pt-2 pb-1">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills..."
            className="w-full pl-8 pr-3 py-2 text-sm bg-zinc-950 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-shadow"
            aria-label="Search community skills"
          />
        </div>
      </div>
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto min-h-0 scroll-smooth"
        style={{ scrollBehavior: "smooth" }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const skill = filteredSkills[virtualRow.index]!;
            return (
              <div
                key={skill.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                  padding: "2px",
                }}
              >
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
              </div>
            );
          })}
        </div>
      </div>
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
      <div className="p-2 border-t border-zinc-800 shrink-0">
        <p className="text-xs text-zinc-500 text-center">
          Skills signed by <strong className="text-violet-400">Vericore</strong> are PQC-verified and tamper-evident.
        </p>
      </div>
    </aside>
  );
}
