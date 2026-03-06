"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { validateSkillChain, exportSkillChain, downloadBlob } from "@/lib/api";
import type { SkillManifest, ValidateResult } from "@/types/skill";

// Single source of truth for API Playground sidebar: 988 clinical workflows only (no legacy skills).
const CLINICAL_WORKFLOW_TEMPLATES: SkillManifest[] = [
  {
    name: "988 Intake → Dispatch",
    version: "1.0.0",
    nodes: [
      { id: "intake-1", type: "API", config: { subtype: "988_intake", endpoint: "/988/intake", method: "POST" }, next_nodes: ["dispatch-1"] },
      { id: "dispatch-1", type: "API", config: { subtype: "dispatch", endpoint: "/dispatch", method: "POST" }, next_nodes: [] },
    ],
    signed_by: "Vericore",
  },
  {
    name: "988 Intake → Resolution",
    version: "1.0.0",
    nodes: [
      { id: "intake-1", type: "API", config: { subtype: "988_intake", endpoint: "/988/intake", method: "POST" }, next_nodes: ["resolution-1"] },
      { id: "resolution-1", type: "API", config: { subtype: "resolution", endpoint: "/resolution", method: "POST" }, next_nodes: [] },
    ],
    signed_by: "Vericore",
  },
  {
    name: "988 Intake → Triage → Dispatch",
    version: "1.0.0",
    nodes: [
      { id: "intake-1", type: "API", config: { subtype: "988_intake", endpoint: "/988/intake", method: "POST" }, next_nodes: ["triage-1"] },
      { id: "triage-1", type: "API", config: { subtype: "triage", endpoint: "/triage", method: "POST" }, next_nodes: ["dispatch-1"] },
      { id: "dispatch-1", type: "API", config: { subtype: "dispatch", endpoint: "/dispatch", method: "POST" }, next_nodes: [] },
    ],
    signed_by: "Vericore",
  },
  {
    name: "988 Intake → Triage → Resolution",
    version: "1.0.0",
    nodes: [
      { id: "intake-1", type: "API", config: { subtype: "988_intake", endpoint: "/988/intake", method: "POST" }, next_nodes: ["triage-1"] },
      { id: "triage-1", type: "API", config: { subtype: "triage", endpoint: "/triage", method: "POST" }, next_nodes: ["resolution-1"] },
      { id: "resolution-1", type: "API", config: { subtype: "resolution", endpoint: "/resolution", method: "POST" }, next_nodes: [] },
    ],
    signed_by: "Vericore",
  },
];

const SAMPLE_MANIFEST = CLINICAL_WORKFLOW_TEMPLATES[0]!;
const initialJson = JSON.stringify(SAMPLE_MANIFEST, null, 2);

function ApiPlaygroundContent() {
  const searchParams = useSearchParams();
  const [manifestJson, setManifestJson] = useState<string>(initialJson);
  const [templates] = useState<SkillManifest[]>(() => CLINICAL_WORKFLOW_TEMPLATES);
  const [activeTemplateName, setActiveTemplateName] = useState<string | null>(null);
  const [validateResult, setValidateResult] = useState<ValidateResult | null>(null);
  const [validateLoading, setValidateLoading] = useState(false);
  const [validateError, setValidateError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const appliedTemplateParam = useRef(false);

  const apiBase =
    typeof window !== "undefined"
      ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080")
      : "http://localhost:8080";

  // Preload template when navigating from workflow seeds with ?template=Name
  useEffect(() => {
    if (appliedTemplateParam.current) return;
    const templateName = searchParams.get("template");
    if (!templateName) return;
    const decoded = decodeURIComponent(templateName);
    const manifest = templates.find((t) => t.name === decoded);
    if (manifest) {
      setManifestJson(JSON.stringify(manifest, null, 2));
      setActiveTemplateName(manifest.name);
      setValidateResult(null);
      setValidateError(null);
      setExportSuccess(false);
      setExportError(null);
      setParseError(null);
      appliedTemplateParam.current = true;
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("template");
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    }
  }, [templates, searchParams]);

  function parseManifest(): SkillManifest | null {
    setParseError(null);
    try {
      const parsed = JSON.parse(manifestJson) as SkillManifest;
      if (!parsed.name || !parsed.version || !Array.isArray(parsed.nodes)) {
        setParseError("Invalid manifest: missing name, version, or nodes array.");
        return null;
      }
      return parsed;
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON");
      return null;
    }
  }

  const handleTemplateClick = (manifest: SkillManifest) => {
    setManifestJson(JSON.stringify(manifest, null, 2));
    setActiveTemplateName(manifest.name);
    setValidateResult(null);
    setValidateError(null);
    setExportSuccess(false);
    setExportError(null);
    setParseError(null);
  };

  const handleValidate = async () => {
    const manifest = parseManifest();
    if (!manifest) return;
    setValidateError(null);
    setValidateResult(null);
    setValidateLoading(true);
    try {
      const result = await validateSkillChain(manifest);
      setValidateResult(result);
    } catch (err) {
      setValidateError(
        err instanceof Error ? err.message : "Request failed. Is the API running on port 8080?"
      );
    } finally {
      setValidateLoading(false);
    }
  };

  const handleExport = async () => {
    const manifest = parseManifest();
    if (!manifest) return;
    setExportError(null);
    setExportSuccess(false);
    setExportLoading(true);
    try {
      const blob = await exportSkillChain(manifest);
      downloadBlob(blob, "skill.jsonl");
      setExportSuccess(true);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : "Request failed. Is the API running on port 8080?"
      );
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <div className="flex flex-1 min-h-0 w-full">
        {/* Left sidebar — 988 clinical workflow templates from API */}
        <aside className="w-[25%] min-w-[200px] border-r border-zinc-800 bg-zinc-900/30 flex flex-col p-4">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-1">
            988 Clinical Workflows
          </h2>
          <p className="text-xs text-zinc-500 mb-3">Verified workflow templates</p>
          <div className="flex flex-col gap-1.5">
            {templates.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => handleTemplateClick(t)}
                className={`
                  text-left px-3 py-2 rounded-lg text-sm font-medium transition-all
                  hover:bg-zinc-800/80 hover:text-zinc-100
                  focus:outline-none focus:ring-2 focus:ring-violet-500/50
                  ${activeTemplateName === t.name
                    ? "bg-violet-500/10 text-violet-300 border border-violet-500/60 shadow-[0_0_12px_rgba(139,92,246,0.25)]"
                    : "text-zinc-400 border border-transparent"
                  }
                `}
              >
                {t.name}
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-auto p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">API Playground</h1>
              <p className="text-zinc-400 mt-1">
                Validate and export 988 clinical workflows. Pick a template or paste your own manifest. API at{" "}
                <code className="text-violet-400">{apiBase}</code>.
              </p>
            </div>

            <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 space-y-3">
              <h2 className="text-sm font-semibold text-zinc-300">
                Manifest JSON
              </h2>
              <textarea
                value={manifestJson}
                onChange={(e) => {
                  setManifestJson(e.target.value);
                  setActiveTemplateName(null);
                  setParseError(null);
                }}
                spellCheck={false}
                className="w-full min-h-[280px] text-xs text-zinc-400 font-mono p-3 bg-zinc-950 rounded border border-zinc-800 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 resize-y"
              />
              {parseError && (
                <p className="text-red-400/90 text-sm">{parseError}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleValidate}
                disabled={validateLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {validateLoading ? "Validating…" : "POST /api/v1/skills/validate"}
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={exportLoading}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {exportLoading ? "Exporting…" : "POST /api/v1/skills/export"}
              </button>
            </div>

            {validateError && (
              <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
                {validateError}
              </div>
            )}
            {validateResult && (
              <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                <h3 className="text-sm font-semibold text-zinc-300 mb-2">
                  Validate response
                </h3>
                <pre className="text-xs text-zinc-400 overflow-x-auto">
                  {JSON.stringify(validateResult, null, 2)}
                </pre>
                {validateResult.valid && (
                  <p className="text-emerald-400 text-sm mt-2">
                    ✓ Valid — no cycles.
                  </p>
                )}
              </div>
            )}

            {exportError && (
              <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
                {exportError}
              </div>
            )}
            {exportSuccess && (
              <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4 text-sm text-emerald-400">
                ✓ Exported — skill.jsonl downloaded.
              </div>
            )}

            <a
              href="/"
              className="inline-block text-sm text-zinc-500 hover:text-zinc-300"
            >
              ← Back to home
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ApiPlaygroundPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
          <p className="text-zinc-500">Loading…</p>
        </div>
      }
    >
      <ApiPlaygroundContent />
    </Suspense>
  );
}
