"use client";

import { useState, useEffect } from "react";
import { validateSkillChain, exportSkillChain, downloadBlob } from "@/lib/api";
import type { SkillManifest, ValidateResult } from "@/types/skill";

const SAMPLE_MANIFEST: SkillManifest = {
  name: "Sample Skill",
  version: "0.1.0",
  nodes: [
    {
      id: "1",
      type: "BROWSER",
      config: { url: "https://example.com" },
      next_nodes: ["2"],
    },
    {
      id: "2",
      type: "API",
      config: { endpoint: "/api/parse", method: "POST" },
      next_nodes: [],
    },
  ],
};

const initialJson = JSON.stringify(SAMPLE_MANIFEST, null, 2);

export default function ApiPlaygroundPage() {
  const [manifestJson, setManifestJson] = useState<string>(initialJson);
  const [templates, setTemplates] = useState<SkillManifest[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [activeTemplateName, setActiveTemplateName] = useState<string | null>(null);
  const [validateResult, setValidateResult] = useState<ValidateResult | null>(null);
  const [validateLoading, setValidateLoading] = useState(false);
  const [validateError, setValidateError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const apiBase =
    typeof window !== "undefined"
      ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080")
      : "http://localhost:8080";

  useEffect(() => {
    let cancelled = false;
    setTemplatesLoading(true);
    setTemplatesError(null);
    fetch(`${apiBase}/api/v1/skills/templates`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: unknown) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          setTemplates(data as SkillManifest[]);
        } else {
          setTemplates([]);
          setTemplatesError("Templates response was not an array.");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setTemplatesError(
            err instanceof Error ? err.message : "Failed to load templates. Is the API running?"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setTemplatesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

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
        {/* Left sidebar — Verified Skill Templates */}
        <aside className="w-[25%] min-w-[200px] border-r border-zinc-800 bg-zinc-900/30 flex flex-col p-4">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">
            Verified Skill Templates
          </h2>
          {templatesLoading && (
            <p className="text-zinc-500 text-sm">Loading templates…</p>
          )}
          {templatesError && (
            <p className="text-amber-500/90 text-sm mb-2">{templatesError}</p>
          )}
          {!templatesLoading && templates.length === 0 && !templatesError && (
            <p className="text-zinc-500 text-sm">No templates available.</p>
          )}
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
                Try the skill API with a template or your own manifest. API at{" "}
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
