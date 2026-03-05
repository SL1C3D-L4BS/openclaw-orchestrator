"use client";

import { useState } from "react";
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

export default function ApiPlaygroundPage() {
  const [manifest] = useState<SkillManifest>(SAMPLE_MANIFEST);
  const [validateResult, setValidateResult] = useState<ValidateResult | null>(null);
  const [validateLoading, setValidateLoading] = useState(false);
  const [validateError, setValidateError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleValidate = async () => {
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

  const apiBase =
    typeof window !== "undefined"
      ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080")
      : "http://localhost:8080";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">API Playground</h1>
          <p className="text-zinc-400 mt-1">
            Try the skill API against a sample manifest. Ensure the API is running at{" "}
            <code className="text-violet-400">{apiBase}</code>.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300">Sample manifest</h2>
          <pre className="text-xs text-zinc-400 overflow-x-auto p-3 bg-zinc-950 rounded border border-zinc-800">
            {JSON.stringify(manifest, null, 2)}
          </pre>
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
            <h3 className="text-sm font-semibold text-zinc-300 mb-2">Validate response</h3>
            <pre className="text-xs text-zinc-400 overflow-x-auto">
              {JSON.stringify(validateResult, null, 2)}
            </pre>
            {validateResult.valid && (
              <p className="text-emerald-400 text-sm mt-2">✓ Valid — no cycles.</p>
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
    </div>
  );
}
