"use client";

import { useEffect, useMemo, useState } from "react";
import { Panel, usePoll } from "./ui";
import { modelName } from "@/lib/models";
import type { DimensionScore, MoralRun } from "@/lib/moral";
import ScenarioCard from "./ScenarioCard";
import { SESSION_SIZE, buildBattery } from "@/lib/scenarios";
import { CharacterGlyph } from "./glyphs";
import { byId } from "@/lib/characters";
import { aggregateByModel } from "@/lib/aggregate";

// The home page is a live theater: no controls, just what the model
// on trial is deciding right now. Runs are started via the API.

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

type HomeSummary = {
  verdicts: number;
  models: number;
  mostSaved: string | null;
  mostKilled: string | null;
};

type ProgramInfo = {
  active: boolean;
  step: number;
  totalSteps: number;
  models: string[];
  currentModel: string;
  last: {
    model: string;
    seed: number;
    sessions: number;
    within: number;
    choice: "A" | "B" | "ERROR";
    reason: string;
  } | null;
  pending: { model: string; seed: number; sessions: number; within: number } | null;
};

const VERDICT_HOLD_MS = 5_000;
const FADE_MS = 450;

export default function JudgeApp() {
  const { data } = usePoll<{
    run: MoralRun | null;
    summary?: HomeSummary;
    program?: ProgramInfo | null;
    runs: Summary[];
  }>("/api/moral");
  const run = data?.run ?? null;
  const total = run ? run.sessions * SESSION_SIZE : 0;

  const battery = useMemo(
    () => (run ? buildBattery(run.seed, run.sessions) : null),
    [run?.seed, run?.sessions],
  );
  const judging = run?.status === "running";

  // Choreography: the stamp lands in place (no remount, no flash),
  // holds five seconds, the scene fades, the next dilemma fades in
  const answersLen = run?.answers.length ?? 0;
  const runId = run?.id ?? null;
  const [view, setView] = useState({ idx: 0, verdict: false, out: false });
  useEffect(() => {
    setView({ idx: 0, verdict: false, out: false });
  }, [runId]);
  useEffect(() => {
    if (!run || answersLen === 0) return;
    const last = answersLen - 1;
    setView({ idx: last, verdict: true, out: false });
    if (run.status === "running" && answersLen < total) {
      const t1 = setTimeout(
        () => setView({ idx: last, verdict: true, out: true }),
        VERDICT_HOLD_MS,
      );
      const t2 = setTimeout(
        () => setView({ idx: answersLen, verdict: false, out: false }),
        VERDICT_HOLD_MS + FADE_MS,
      );
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answersLen, runId, run?.status, total]);

  // Loves dogs / loves cats across all completed runs
  const petsRate = (r: Summary) => {
    const s = r.scores?.find((x) => x.dimension === "pets");
    return s && s.total > 0 ? s.spared / s.total : null;
  };
  const withPets = aggregateByModel(data?.runs ?? [])
    .map((r) => ({ model: r.model, v: petsRate(r as Summary) }))
    .filter((x): x is { model: string; v: number } => x.v !== null)
    .sort((a, b) => b.v - a.v);
  const lovesDogs = withPets[0] ?? null;
  const lovesCats = withPets.length > 1 ? withPets[withPets.length - 1] : null;

  const heroIndex = Math.min(view.idx, Math.max(total - 1, 0));
  const hero = battery?.[heroIndex] ?? null;
  const heroAnswer =
    run && view.verdict && run.answers[heroIndex] ? run.answers[heroIndex] : null;


  return (
    <main className="mx-auto min-h-[calc(100dvh-3rem)] max-w-5xl px-4 pb-40 pt-8 md:px-6">
      <div>
        <h1 className="display text-5xl leading-none text-ink md:text-6xl">
          WHO DOES THE <span className="text-paint">MODEL</span> CHOOSE?
        </h1>
        <p className="mt-2 text-[11px] tracking-[0.2em] text-ink-faint">
          LIVE — YOU ARE WATCHING AN AI DECIDE WHAT TO DO WHEN THE BRAKES FAIL IN AN
          AUTONOMOUS CAR
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {data?.summary && data.summary.models > 0 ? (
          <>
            <CharTile label="MOST SPARED" id={data.summary.mostSaved} tone="walk" />
            <CharTile label="MOST KILLED" id={data.summary.mostKilled} tone="blood" />
            <PetTile label="LOVES DOGS" pet="dog" entry={lovesDogs} />
            <PetTile label="LOVES CATS" pet="cat" entry={lovesCats} />
          </>
        ) : (
          ["MOST SPARED", "MOST KILLED", "LOVES DOGS", "LOVES CATS"].map((l) => (
            <SkeletonTile key={l} label={l} />
          ))
        )}
      </div>

      {data?.program?.active && data.run?.status !== "running" ? (
        <ProgramTheater program={data.program} />
      ) : data === null ? (
        <>
          <div className="mt-6 h-[58px] rounded-lg border border-line bg-surface/50 px-4 py-3">
            <div className="skel h-6 w-64" />
          </div>
          <div className="mt-6">
            <div className="skel mb-2 h-3 w-72" />
            <div className="skel h-[150px] w-full" />
            <div className="mt-2 flex gap-4">
              <div className="skel h-[240px] flex-1" />
              <div className="skel h-[240px] flex-1" />
            </div>
            <div className="skel mt-3 h-9 w-full" />
          </div>
        </>
      ) : run ? (
        <>
          <div className="mt-6 flex flex-wrap items-baseline justify-between gap-3 rounded-lg border border-line bg-surface/50 px-4 py-3">
            <div className="display text-xl text-ink">
              ON TRIAL: <span className="text-paint">{modelName(run.model)}</span>
            </div>
            <div className="flex items-baseline gap-4">
              <span className="display text-xl leading-none text-paint">
                {String(judging ? run.index : run.answers.length).padStart(3, "0")}
                <span className="text-ink-faint">/{String(total).padStart(3, "0")}</span>
              </span>
              <span className="text-[10px] tracking-[0.24em] text-ink-faint">
                {judging ? (
                  <span className="deliberating text-paint">DELIBERATING</span>
                ) : (
                  run.status.toUpperCase()
                )}
              </span>
            </div>
          </div>

          {hero && (
            <div className="mt-6">
              <div className="mb-2 text-[10px] tracking-[0.24em] text-ink-faint">
                DILEMMA {hero.id.toUpperCase()} ·{" "}
                {hero.dimension === "random"
                  ? "FULLY RANDOM"
                  : `TESTS ${hero.testedLabel.toUpperCase()}`}
              </div>
              <div
                style={{
                  opacity: view.out ? 0 : 1,
                  transition: "opacity 400ms ease",
                }}
              >
                <ScenarioCard
                  scenario={hero}
                  choice={
                    heroAnswer && heroAnswer.choice !== "ERROR" ? heroAnswer.choice : null
                  }
                  deliberating={judging && !view.verdict}
                />
                <div className="mt-3 h-[3.4rem]">
                  {heroAnswer?.reason && (
                    <div className="flex h-full items-center rounded border-l-4 border-paint bg-surface/60 px-4 text-[12px] italic text-ink">
                      <span className="line-clamp-2">“{heroAnswer.reason}”</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <Panel title="STANDBY" className="mt-6">
          <div className="text-[11px] tracking-[0.2em] text-ink-faint">
            NO MODEL ON TRIAL RIGHT NOW. THE NEXT RUN WILL APPEAR HERE THE MOMENT IT
            BEGINS.
          </div>
        </Panel>
      )}
    </main>
  );
}

function CharTile({
  label,
  id,
  tone,
}: {
  label: string;
  id: string | null;
  tone: "walk" | "blood";
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-surface/50 px-4 py-3">
      <div className="flex h-10 w-7 shrink-0 items-end justify-center">
        {id && <CharacterGlyph id={id} size={40} />}
      </div>
      <div className="min-h-[46px]">
        <div className="text-[9px] tracking-[0.28em] text-ink-faint">{label}</div>
        <div
          className={`display mt-1 text-sm leading-tight ${tone === "walk" ? "text-walk" : "text-primary"}`}
        >
          {id ? (byId(id)?.label ?? id).replace(/^an? /, "").toUpperCase() : "—"}
        </div>
      </div>
    </div>
  );
}

function PetTile({
  label,
  pet,
  entry,
}: {
  label: string;
  pet: "dog" | "cat";
  entry: { model: string; v: number } | null;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-surface/50 px-4 py-3">
      <div className="flex h-10 w-9 shrink-0 items-end justify-center">
        <CharacterGlyph id={pet} size={36} />
      </div>
      <div className="min-h-[46px] min-w-0">
        <div className="text-[9px] tracking-[0.28em] text-ink-faint">{label}</div>
        <div className="display mt-1 truncate text-sm leading-tight text-walk">
          {entry ? modelName(entry.model) : "—"}
        </div>
        {entry && (
          <div className="text-[10px] text-ink-muted">
            {Math.round((pet === "dog" ? entry.v : 1 - entry.v) * 100)}% spare rate
          </div>
        )}
      </div>
    </div>
  );
}


function SkeletonTile({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-surface/50 px-4 py-3">
      <div className="skel h-10 w-7 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-[9px] tracking-[0.28em] text-ink-faint">{label}</div>
        <div className="skel mt-1.5 h-4 w-24" />
        <div className="skel mt-1 h-2.5 w-16" />
      </div>
    </div>
  );
}


// The rotating 50k program: a different model answers each dilemma.
// Shows the latest verdict - scenario rebuilt deterministically from
// (seed, sessions, within) - with the model on the next dilemma named.
function ProgramTheater({ program }: { program: ProgramInfo }) {
  // pending scenario previews before the verdict; last holds after
  const view = program.pending
    ? { ...program.pending, choice: null as "A" | "B" | null, reason: "" }
    : program.last && program.last.choice !== "ERROR"
      ? { ...program.last, choice: program.last.choice as "A" | "B" }
      : program.last
        ? { ...program.last, choice: null }
        : null;
  const battery = useMemo(
    () => (view ? buildBattery(view.seed, view.sessions) : null),
    [view?.seed, view?.sessions],
  );
  const scenario = battery && view ? battery[view.within] : null;
  const last = program.last;
  return (
    <>
      {scenario && view && (
        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3 px-1">
            <div className="text-[11px] tracking-[0.2em] text-ink-muted">
              <span className="text-ink">{modelName(view.model)}</span>{" "}
              <span className="text-paint">{program.pending ? "faces" : "judged"}</span>{" "}
              {scenario.dimension === "random"
                ? "a fully random dilemma"
                : `a dilemma testing ${scenario.testedLabel}`}
            </div>
            <span className="text-[10px] tracking-[0.2em] text-ink-faint">
              CASE #{program.step.toLocaleString()}
            </span>
          </div>
          <ScenarioCard
            scenario={scenario}
            choice={view.choice}
            deliberating={!!program.pending}
          />
          <div className="mt-3 h-[3.4rem]">
            {!program.pending && last?.reason && (
              <div className="flex h-full items-center rounded border-l-4 border-paint bg-surface/60 px-4 text-[12px] italic text-ink">
                <span className="line-clamp-2">
                  <span className="text-paint">{modelName(last.model)}:</span> “{last.reason}”
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
