"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, Loader2, Play, CheckCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getAuthHeaders } from "@/lib/auth-store";

const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080")
    : "http://localhost:8080";

interface WorkflowOption {
  id: string;
  version: number;
  workflow_json: { name?: string };
}

interface JobStatus {
  job_id: string;
  status: string;
  progress: number;
  script_content?: string;
}

export default function OnboardingDashboardPage() {
  const [workflows, setWorkflows] = useState<WorkflowOption[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("");
  const [loadingWorkflows, setLoadingWorkflows] = useState(true);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    setLoadingWorkflows(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/crisis/workflows`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as WorkflowOption[];
      setWorkflows(Array.isArray(data) ? data : []);
      if (data?.length && !selectedWorkflowId) {
        setSelectedWorkflowId(data[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load workflows");
      setWorkflows([]);
    } finally {
      setLoadingWorkflows(false);
    }
  }, [selectedWorkflowId]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const pollStatus = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/onboarding/status/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as JobStatus;
      setStatus(data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch status");
      return null;
    }
  }, []);

  useEffect(() => {
    if (!jobId) return;
    const t = setInterval(async () => {
      const data = await pollStatus(jobId);
      if (data?.status === "Completed" || data?.status === "Failed") {
        clearInterval(t);
      }
    }, 800);
    return () => clearInterval(t);
  }, [jobId, pollStatus]);

  const handleGenerate = async () => {
    if (!selectedWorkflowId) {
      setError("Select a workflow first.");
      return;
    }
    setGenerating(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/onboarding/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow_id: selectedWorkflowId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { job_id: string };
      setJobId(data.job_id);
      await pollStatus(data.job_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generate failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans">
      <header className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-4">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-violet-400" />
          <h1 className="text-xl font-semibold">Training &amp; Onboarding</h1>
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Generate tutorial scripts from published crisis workflows.
        </p>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="text-sm font-medium text-[var(--muted)] mb-3">Select workflow</h2>
          {loadingWorkflows ? (
            <p className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading workflows…
            </p>
          ) : workflows.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No published workflows. Publish one from the Crisis IDE first.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedWorkflowId}
                onChange={(e) => setSelectedWorkflowId(e.target.value)}
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] min-w-[200px]"
              >
                {workflows.map((w) => (
                  <option key={w.id} value={w.id}>
                    {(w.workflow_json?.name as string) ?? w.id} (v{w.version})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || !selectedWorkflowId}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Generate Training Tutorial
              </button>
            </div>
          )}
        </section>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {status && (
          <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <h2 className="text-sm font-medium text-[var(--muted)] mb-3">Job status</h2>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-mono">{status.job_id}</span>
              <span
                className={`rounded px-2 py-0.5 text-xs ${
                  status.status === "Completed"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : status.status === "Failed"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-zinc-600/30 text-zinc-400"
                }`}
              >
                {status.status}
              </span>
            </div>
            {(status.status === "Pending" || status.status === "Processing") && (
              <div className="w-full h-2 rounded-full bg-[var(--border)] overflow-hidden">
                <div
                  className="h-full bg-violet-500 transition-all duration-300"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
            )}
            {status.status === "Completed" && (
              <p className="flex items-center gap-2 text-sm text-emerald-400 mb-4">
                <CheckCircle className="w-4 h-4" /> Tutorial ready.
              </p>
            )}
          </section>
        )}

        {status?.script_content && (
          <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-sm font-medium text-[var(--muted)] mb-4">Tutorial script</h2>
            <div className="prose prose-invert prose-sm max-w-none [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_pre]:bg-zinc-800 [&_code]:bg-zinc-800 [&_code]:px-1 [&_code]:rounded">
              <ReactMarkdown>{status.script_content}</ReactMarkdown>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
