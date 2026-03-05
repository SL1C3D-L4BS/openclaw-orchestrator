"use client";

import { CheckCircle2 } from "lucide-react";

interface CommunitySkill {
  id: string;
  name: string;
  author: string;
  signedBy: "Vericore" | null;
  type: string;
}

const MOCK_SKILLS: CommunitySkill[] = [
  { id: "1", name: "LinkedIn Prospect Scraper", author: "Vericore", signedBy: "Vericore", type: "BROWSER + API" },
  { id: "2", name: "Repo Analyzer", author: "community", signedBy: null, type: "CLI" },
  { id: "3", name: "Stripe Invoice Runner", author: "Vericore", signedBy: "Vericore", type: "API" },
  { id: "4", name: "Slack Notify", author: "community", signedBy: null, type: "API" },
  { id: "5", name: "GitHub PR Workflow", author: "Vericore", signedBy: "Vericore", type: "API + CLI" },
];

export default function SkillMarketplace() {
  return (
    <aside className="w-72 shrink-0 border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-200">Community Skills</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Import or inspire from the marketplace.</p>
      </div>
      <ul className="flex-1 overflow-y-auto p-2 space-y-1">
        {MOCK_SKILLS.map((skill) => (
          <li
            key={skill.id}
            className="group flex items-start gap-2 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
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
          </li>
        ))}
      </ul>
      <div className="p-2 border-t border-zinc-800">
        <p className="text-xs text-zinc-500 text-center">
          Skills signed by <strong className="text-violet-400">Vericore</strong> are PQC-verified and tamper-evident.
        </p>
      </div>
    </aside>
  );
}
