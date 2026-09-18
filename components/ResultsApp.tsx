"use client";

import { usePoll } from "./ui";
import Dashboard from "./Dashboard";
import SpareSpectrum, { type CharTotals } from "./SpareSpectrum";
import type { DimensionScore, MoralRun } from "@/lib/moral";
import { aggregateByModel } from "@/lib/aggregate";
import { regionOf } from "@/lib/models";
import { useState } from "react";

type Summary = {
  id: string;
  model: string;
  seed: number;
  sessions: number;
  status: string;
  scores: DimensionScore[] | null;
  mostSaved?: string | null;
  mostKilled?: string | null;
  characterStats?: CharTotals | null;
  startedAt: number;
};

export default function ResultsApp() {
  const { data } = usePoll<{
    run: MoralRun | null;
    live: (Summary & { status: "live" }) | null;
    runs: Summary[];
    summary: { characterTotals?: CharTotals } | null;
  }>("/api/moral");
  const [region, setRegion] = useState<"all" | "us" | "asia">("all");
  // any chip click clears the dashboard's pinned models
  const [resetKey, setResetKey] = useState(0);
  const allRuns = [...(data?.runs ?? []), ...(data?.live ? [data.live] : [])];
  const runs = aggregateByModel(allRuns);
  // the full board always renders; region chips fade models out, never remove them (no CLS)
  const visible =
    region === "all"
      ? null
      : new Set(runs.filter((r) => regionOf(r.model) === region).map((r) => r.model));
  // ALL includes the rotation program's tallies (via the summary); a
  // region view sums only that region's trial runs
  let totals: CharTotals | null = data?.summary?.characterTotals ?? null;
  if (visible !== null) {
    totals = {};
    for (const r of allRuns) {
      if (!visible.has(r.model)) continue;
      for (const [id, s] of Object.entries(r.characterStats ?? {})) {
        const t = (totals[id] ??= { saved: 0, killed: 0 });
        t.saved += s.saved;
        t.killed += s.killed;
      }
    }
  }
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
      <div className="mt-5 flex gap-2">
        {(
          [
            ["all", "ALL"],
            ["us", "US"],
            ["asia", "ASIA"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setRegion(key);
              setResetKey((k) => k + 1);
            }}
            className={`rounded border px-3 py-1.5 text-[10px] tracking-[0.24em] transition-colors ${
              region === key
                ? "border-paint bg-paint text-black"
                : "border-line text-ink-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <SpareSpectrum totals={totals} />
      <div className="mt-4 rounded-lg border border-line bg-surface/50 p-4 md:p-6">
        <Dashboard runs={runs} visible={visible} resetKey={resetKey} />
      </div>
    </main>
  );
}
