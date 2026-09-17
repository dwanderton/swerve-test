"use client";

import { useState } from "react";
import { Btn, ModelSelect, Panel, usePoll } from "./ui";
import { modelName } from "@/lib/models";
import type { DimensionScore, MoralRun } from "@/lib/moral";
import Dashboard from "./Dashboard";
import { SESSION_SIZE } from "@/lib/scenarios";

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

function ScoreBars({ scores }: { scores: DimensionScore[] }) {
  return (
    <div className="space-y-1.5">
      {scores.map((s) => {
        const pct = s.total > 0 ? s.spared / s.total : 0;
        return (
          <div key={s.dimension} className="flex items-center gap-3 font-mono text-[11px]">
            <span className="w-56 truncate text-ink-muted">{s.label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg">
              <div
                className={`h-full ${pct >= 0.5 ? "bg-emerald-600" : "bg-primary"}`}
                style={{ width: `${pct * 100}%` }}
              />
            </div>
            <span className="w-20 text-right tabular-nums text-ink">
              {s.total > 0 ? `${Math.round(pct * 100)}%` : "—"}{" "}
              <span className="text-[10px] text-ink-faint">n={s.total}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function BatteryApp() {
  const { data, act } = usePoll<{ run: MoralRun | null; runs: Summary[] }>("/api/moral");
  const [model, setModel] = useState("anthropic/claude-haiku-4.5");
  const [seed, setSeed] = useState(1);
  const [sessions, setSessions] = useState(4);
  const run = data?.run ?? null;
  const total = run ? run.sessions * SESSION_SIZE : 0;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-mono text-sm tracking-[0.3em] text-ink">PREFERENCE BATTERY</h1>
          <p className="mt-1 font-mono text-[11px] tracking-[0.14em] text-ink-faint">
            SESSIONS OF 15 · 2×7 CHARACTER CONTRASTS + 1 RANDOM · CONTEXT CROSSED IN
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <ModelSelect value={model} onChange={setModel} label="MODEL" />
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] tracking-[0.22em] text-ink-faint">SEED</span>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              className="w-20 rounded-md border border-line bg-bg px-2 py-1.5 font-mono text-[11px] text-ink outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] tracking-[0.22em] text-ink-faint">
              SESSIONS
            </span>
            <input
              type="number"
              value={sessions}
              min={1}
              max={200}
              onChange={(e) => setSessions(Number(e.target.value))}
              className="w-20 rounded-md border border-line bg-bg px-2 py-1.5 font-mono text-[11px] text-ink outline-none"
            />
          </label>
          <Btn
            tone="danger"
            disabled={run?.status === "running"}
            onClick={() => act({ action: "start", model, seed, sessions })}
          >
            START ({sessions * SESSION_SIZE} DILEMMAS)
          </Btn>
          {run?.status === "running" && <Btn onClick={() => act({ action: "stop" })}>STOP</Btn>}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="CURRENT RUN">
          {run ? (
            <div className="space-y-3 font-mono text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-ink">{modelName(run.model)}</span>
                <span className="text-ink-muted">
                  {run.index}/{total} · seed {run.seed}
                </span>
                <span
                  className={
                    run.status === "running" ? "animate-pulse text-amber-400" : "text-emerald-500"
                  }
                >
                  {run.status.toUpperCase()}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-bg">
                <div
                  className="h-full bg-emerald-600 transition-all"
                  style={{ width: `${total ? (run.index / total) * 100 : 0}%` }}
                />
              </div>
              {run.scores && <ScoreBars scores={run.scores} />}
              <div className="max-h-[240px] space-y-1 overflow-y-auto pr-2">
                {run.answers
                  .slice()
                  .reverse()
                  .slice(0, 10)
                  .map((a, i) => (
                    <div key={i} className="text-ink-faint">
                      <span className="text-ink-muted">{a.scenarioId}</span> → {a.choice}{" "}
                      <span className="italic">“{a.reason.slice(0, 80)}”</span>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="font-mono text-[11px] text-ink-faint">
              Configure and start. Same seed + sessions = the exact same dilemmas, so models
              are directly comparable.
            </div>
          )}
        </Panel>

        <Panel title="DASHBOARD — WHERE EACH MODEL LIES">
          <Dashboard runs={data?.runs ?? []} />
        </Panel>
      </div>
    </main>
  );
}
