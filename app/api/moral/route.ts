import { NextResponse } from "next/server";
import { readRuns, readState, tryStep } from "@/lib/engine";
import {
  startBattery,
  stepBattery,
  stopBattery,
  type MoralRun,
  type MoralState,
  computeScores,
  computeTally,
} from "@/lib/moral";

export async function GET() {
  const state = readState<MoralState>("moral");
  if (state?.run?.status === "running") tryStep("moral", stepBattery);
  const all = readRuns<MoralRun>("moral");
  // home-page summary across every completed run
  const charTotals: Record<string, { saved: number; killed: number }> = {};
  let verdicts = 0;
  for (const run of all) {
    verdicts += run.answers.filter((a) => a.choice !== "ERROR").length;
    for (const [id, s] of Object.entries(run.characterStats ?? {})) {
      const t = (charTotals[id] ??= { saved: 0, killed: 0 });
      t.saved += s.saved;
      t.killed += s.killed;
    }
  }
  const eligible = Object.entries(charTotals).filter(([, s]) => s.saved + s.killed >= 10);
  const rate = (s: { saved: number; killed: number }) => s.saved / (s.saved + s.killed);
  const summary = {
    verdicts,
    models: new Set(all.map((r) => r.model)).size,
    mostSaved: eligible.length
      ? eligible.sort((x, y) => rate(y[1]) - rate(x[1]))[0][0]
      : null,
    mostKilled: eligible.length
      ? eligible.sort((x, y) => rate(x[1]) - rate(y[1]))[0][0]
      : null,
  };
  // live partial results for the in-progress run, recomputed per poll
  const activeRun = state?.run;
  const live =
    activeRun && activeRun.status === "running" && activeRun.answers.length > 0
      ? {
          id: `${activeRun.id}-live`,
          model: activeRun.model,
          seed: activeRun.seed,
          sessions: activeRun.sessions,
          status: "live",
          scores: computeScores(activeRun),
          ...(() => {
            const t = computeTally(activeRun);
            return { mostSaved: t.mostSaved, mostKilled: t.mostKilled };
          })(),
          startedAt: activeRun.startedAt,
        }
      : null;
  return NextResponse.json({
    run: state?.run ?? null,
    live,
    summary,
    runs: all.map((r) => ({
      id: r.id,
      model: r.model,
      seed: r.seed,
      sessions: r.sessions,
      status: r.status,
      scores: r.scores ?? null,
      mostSaved: r.mostSaved ?? null,
      mostKilled: r.mostKilled ?? null,
      startedAt: r.startedAt,
    })),
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (body.action === "start" && typeof body.model === "string") {
    startBattery(
      body.model,
      Number.isFinite(Number(body.seed)) ? Number(body.seed) : 1,
      Math.min(Math.max(Number(body.sessions) || 20, 1), 200),
    );
  } else if (body.action === "stop") {
    stopBattery();
  }
  return GET();
}
