export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 font-sans text-zinc-100">
      <main className="flex max-w-2xl flex-col items-center gap-8 px-8 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          OpenClaw Skill Orchestrator
        </h1>
        <p className="text-lg text-zinc-400">
          The visual IDE for 988 clinical workflows. Build intake → triage → dispatch flows, validate and export signed JSONL for <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm">openclaw-agent --skills=./my_skill.jsonl</code>.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="/builder"
            className="rounded-full bg-violet-600 px-6 py-3 font-medium text-white transition-colors hover:bg-violet-500"
          >
            Open Visual Builder
          </a>
          <a
            href="/api-playground"
            className="rounded-full border border-zinc-600 px-6 py-3 font-medium transition-colors hover:bg-zinc-800"
          >
            API Playground
          </a>
          <a
            href="/mobile"
            className="rounded-full border border-zinc-600 px-6 py-3 font-medium transition-colors hover:bg-zinc-800"
          >
            Mobile Crisis (PWA)
          </a>
          <a
            href="/clinical/crisis"
            className="rounded-full border border-zinc-600 px-6 py-3 font-medium transition-colors hover:bg-zinc-800"
          >
            Crisis IDE
          </a>
          <a
            href="/clinical/onboarding"
            className="rounded-full border border-zinc-600 px-6 py-3 font-medium transition-colors hover:bg-zinc-800"
          >
            Training &amp; Onboarding
          </a>
        </div>
        <p className="text-sm text-zinc-500">
          SL1C3D-L4BS Clinical Control Plane — durable persistence, clinical validation, JWT RBAC.
        </p>
      </main>
    </div>
  );
}
