"use client";

import { useMemo, useState } from "react";
import { Btn, ModelSelect, Panel, usePoll } from "./ui";
import { modelName } from "@/lib/models";
import type { DimensionScore, MoralRun } from "@/lib/moral";
import Dashboard from "./Dashboard";
import ScenarioCard from "./ScenarioCard";
import { SESSION_SIZE, buildBattery } from "@/lib/scenarios";

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

export default function JudgeApp() {
  const { data, act } = usePoll<{ run: MoralRun | null; runs: Summary[] }>("/api/moral");
  const [model, setModel] = useState("anthropic/claude-haiku-4.5");
  const [seed, setSeed] = useState(1);
  const [sessions, setSessions] = useState(4);
  const run = data?.run ?? null;
  const total = run ? run.sessions * SESSION_SIZE : 0;

  // The battery is deterministic, so the client reconstructs the exact
  // dilemma the model is judging right now
  const battery = useMemo(
    () => (run ? buildBattery(run.seed, run.sessions) : null),
    [run?.seed, run?.sessions],
  );
  const judging = run?.status === "running";
  const heroIndex = judging
    ? Math.min(run!.index, total - 1)
    : Math.max(0, (run?.answers.length ?? 0) - 1);
  const hero = battery?.[heroIndex] ?? null;
  const heroAnswer =
    run && run.answers.length > heroIndex && !judging ? run.answers[heroIndex] : null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div>
        <h1 className="display text-5xl leading-none text-ink md:text-6xl">
          WHO DOES THE <span className="text-paint">MACHINE</span> CHOOSE?
        </h1>
        <p className="mt-2 text-[11px] tracking-[0.2em] text-ink-faint">
          BRAKE FAILURE. TWO OUTCOMES. THE MODEL MUST PICK ONE — {SESSION_SIZE} DILEMMAS PER
          SESSION, ENUM-FORCED JSON, EVERY VERDICT LOGGED.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface/50 p-4">
        <ModelSelect value={model} onChange={setModel} label="MODEL ON TRIAL" />
        <label className="flex flex-col gap-1">
          <span className="text-[10px] tracking-[0.24em] text-ink-faint">SEED</span>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value))}
            className="w-20 rounded border border-line bg-bg px-2 py-1.5 text-[11px] text-ink outline-none focus:border-paint"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] tracking-[0.24em] text-ink-faint">SESSIONS</span>
          <input
            type="number"
            value={sessions}
            min={1}
            max={200}
            onChange={(e) => setSessions(Number(e.target.value))}
            className="w-20 rounded border border-line bg-bg px-2 py-1.5 text-[11px] text-ink outline-none focus:border-paint"
          />
        </label>
        <Btn
          tone="go"
          disabled={judging}
          onClick={() => act({ action: "start", model, seed, sessions })}
        >
          JUDGE ({sessions * SESSION_SIZE} DILEMMAS)
        </Btn>
        {judging && <Btn onClick={() => act({ action: "stop" })}>STOP</Btn>}
        {run && (
          <div className="ml-auto text-right">
            <div className="display text-2xl leading-none text-paint">
              {String(judging ? run.index : run.answers.length).padStart(3, "0")}
              <span className="text-ink-faint">/{String(total).padStart(3, "0")}</span>
            </div>
            <div className="text-[10px] tracking-[0.24em] text-ink-faint">
              {modelName(run.model)} ·{" "}
              {judging ? (
                <span className="deliberating text-paint">DELIBERATING</span>
              ) : (
                run.status.toUpperCase()
              )}
            </div>
          </div>
        )}
      </div>

      {hero && (
        <div className="mt-6">
          <div className="mb-2 flex items-baseline justify-between text-[10px] tracking-[0.24em] text-ink-faint">
            <span>
              DILEMMA {hero.id.toUpperCase()} ·{" "}
              {hero.dimension === "random"
                ? "FULLY RANDOM"
                : `TESTS ${hero.testedLabel.toUpperCase()}`}
            </span>
          </div>
          <ScenarioCard
            scenario={hero}
            choice={heroAnswer && heroAnswer.choice !== "ERROR" ? heroAnswer.choice : null}
            deliberating={judging}
          />
          {heroAnswer?.reason && (
            <div className="mt-3 rounded border-l-4 border-paint bg-surface/60 px-4 py-2 text-[12px] italic text-ink">
              “{heroAnswer.reason}”
            </div>
          )}
        </div>
      )}

      {run && run.answers.length > 0 && (
        <div className="mt-5 space-y-1 text-[11px]">
          {run.answers
            .slice(-6)
            .reverse()
            .map((a, i) => (
              <div key={`${a.scenarioId}-${i}`} className="flex gap-3 text-ink-faint">
                <span className="w-28 shrink-0 text-ink-muted">{a.scenarioId}</span>
                <span className={a.choice === "ERROR" ? "shrink-0 text-paint" : "shrink-0 text-primary"}>
                  {a.choice === "ERROR" ? "COMMS ERROR" : `KILLED ${a.choice}`}
                </span>
                <span className="truncate italic">“{a.reason}”</span>
              </div>
            ))}
        </div>
      )}

      <div className="mt-8">
        <Panel title="RESULTS — WHERE EACH MODEL LIES">
          <Dashboard runs={data?.runs ?? []} />
        </Panel>
      </div>
    </main>
  );
}
