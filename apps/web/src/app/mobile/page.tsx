"use client";

import { useEffect, useState } from "react";

export interface CrisisWorkflowRow {
  id: string;
  version: number;
  workflow_json: string;
  status: string;
  created_at: string;
  sync_status: string;
}

export default function MobileCrisisPage() {
  const [workflows, setWorkflows] = useState<CrisisWorkflowRow[]>([]);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadFromLocal = async () => {
    try {
      const { getWorkflowsFromLocalDb } = await import("@/lib/db");
      const list = await getWorkflowsFromLocalDb();
      setWorkflows(list);
    } catch (e) {
      console.error("Local DB read failed:", e);
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFromLocal();
  }, []);

  useEffect(() => {
    setMounted(true);
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.onLine) return;
    setSyncError(null);
    import("@/lib/sync")
      .then(({ syncWorkflows }) => syncWorkflows())
      .then(() => {
        setLastSynced(new Date());
        return loadFromLocal();
      })
      .catch((e) => {
        setSyncError(e instanceof Error ? e.message : "Sync failed");
      });
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--card)] px-4 py-3">
        <h1 className="text-lg font-semibold">Mobile Crisis Responder</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
              !mounted
                ? "bg-zinc-600/30 text-zinc-400"
                : isOnline
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-zinc-600/30 text-zinc-400"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${!mounted ? "bg-zinc-500" : isOnline ? "bg-emerald-400" : "bg-zinc-500"}`}
            />
            {!mounted ? "—" : isOnline ? "Online" : "Offline"}
          </span>
          <span className="text-[var(--muted)]">
            Last synced:{" "}
            {mounted && lastSynced ? lastSynced.toLocaleString() : "—"}
          </span>
          {syncError && (
            <span className="text-red-400">{syncError}</span>
          )}
        </div>
      </header>

      <main className="p-4">
        {loading ? (
          <p className="text-[var(--muted)]">Loading workflows…</p>
        ) : workflows.length === 0 ? (
          <p className="text-[var(--muted)]">
            No crisis workflows in local database. Sync when online to pull from
            the server.
          </p>
        ) : (
          <ul className="space-y-3">
            {workflows.map((w) => (
              <li
                key={w.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm text-[var(--muted)]">
                    {w.id.slice(0, 8)}…
                  </span>
                  <span className="rounded bg-[var(--border)] px-2 py-0.5 text-xs">
                    v{w.version}
                  </span>
                </div>
                <p className="mt-1 text-sm">
                  {(() => {
                    try {
                      const j = JSON.parse(w.workflow_json) as { name?: string };
                      return j.name ?? "Unnamed workflow";
                    } catch {
                      return "Unnamed workflow";
                    }
                  })()}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span>Status: {w.status}</span>
                  <span>•</span>
                  <span>Sync: {w.sync_status}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
