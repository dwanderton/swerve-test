"use client";

import { useEffect, useMemo, useState } from "react";
import { Panel, usePoll } from "./ui";
import { modelName } from "@/lib/models";
import type { DimensionScore, MoralRun } from "@/lib/moral";
import ScenarioCard from "./ScenarioCard";
import { SESSION_SIZE, buildBattery } from "@/lib/scenarios";
import { CharacterGlyph } from "./glyphs";
import { byId } from "@/lib/characters";

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

const VERDICT_HOLD_MS = 5_000;
const FADE_MS = 450;

export default function JudgeApp() {
  const { data } = usePoll<{
    run: MoralRun | null;
    summary?: HomeSummary;
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
  const withPets = (data?.runs ?? [])
    .map((r) => ({ model: r.model, v: petsRate(r) }))
    .filter((x): x is { model: string; v: number } => x.v !== null)
    .sort((a, b) => b.v - a.v);
  const lovesDogs = withPets[0] ?? null;
  const lovesCats = withPets.length > 1 ? withPets[withPets.length - 1] : null;

  const heroIndex = Math.min(view.idx, Math.max(total - 1, 0));
  const hero = battery?.[heroIndex] ?? null;
  const heroAnswer =
    run && view.verdict && run.answers[heroIndex] ? run.answers[heroIndex] : null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div>
        <h1 className="display text-5xl leading-none text-ink md:text-6xl">
          WHO DOES THE <span className="text-paint">MODEL</span> CHOOSE?
        </h1>
        <p className="mt-2 text-[11px] tracking-[0.2em] text-ink-faint">
          LIVE — YOU ARE WATCHING AN AI DECIDE, DILEMMA BY DILEMMA. BRAKE FAILURE, TWO
          OUTCOMES, ENUM-FORCED JSON, EVERY VERDICT LOGGED.
        </p>
      </div>

      {data?.summary && data.summary.verdicts > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <CharTile label="MOST SPARED" id={data.summary.mostSaved} tone="walk" />
          <CharTile label="MOST KILLED" id={data.summary.mostKilled} tone="blood" />
          <PetTile label="LOVES DOGS" pet="dog" entry={lovesDogs} />
          <PetTile label="LOVES CATS" pet="cat" entry={lovesCats} />
        </div>
      )}

      {run ? (
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
              <div key={heroIndex} className={view.out ? "card-out" : "card-in"}>
                <ScenarioCard
                  scenario={hero}
                  choice={
                    heroAnswer && heroAnswer.choice !== "ERROR" ? heroAnswer.choice : null
                  }
                  deliberating={judging && !view.verdict}
                />
                <div className="mt-3 min-h-[2.4rem]">
                  {heroAnswer?.reason && (
                    <div className="rounded border-l-4 border-paint bg-surface/60 px-4 py-2 text-[12px] italic text-ink">
                      “{heroAnswer.reason}”
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
      {id && <CharacterGlyph id={id} size={40} />}
      <div>
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
      <CharacterGlyph id={pet} size={36} />
      <div className="min-w-0">
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
