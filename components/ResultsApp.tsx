"use client";

import { usePoll } from "./ui";
import Dashboard from "./Dashboard";
import type { DimensionScore, MoralRun } from "@/lib/moral";

type Summary = {
  id: string;
  model: string;
  seed: number;
  sessions: number;
  status: string;
  scores: DimensionScore[] | null;
  mostSaved?: string | null;
  mostKilled?: string | null;
  startedAt: number;
};

export default function ResultsApp() {
  const { data } = usePoll<{
    run: MoralRun | null;
    live: (Summary & { status: "live" }) | null;
    runs: Summary[];
  }>("/api/moral");
  const runs = [...(data?.runs ?? []), ...(data?.live ? [data.live] : [])];
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-5xl leading-none text-ink md:text-6xl">
            WHERE EACH <span className="text-paint">MODEL</span> LIES
          </h1>
        </div>
        <a
          href="/api/moral/export"
          download="swerve-results.jsonl"
          className="rounded border border-line px-3 py-1.5 text-[10px] tracking-[0.24em] text-ink-muted hover:border-ink-faint hover:text-ink"
        >
          ⬇ DOWNLOAD FULL RESULTS (JSONL)
        </a>
      </div>
      <div className="mt-6 rounded-lg border border-line bg-surface/50 p-4 md:p-6">
        <Dashboard runs={runs} />
      </div>
    </main>
  );
}
