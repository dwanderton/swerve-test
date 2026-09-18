import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { readRuns, readState, tryStep } from "@/lib/engine";
import {
  maybeStartNext,
  readProgram,
  readQueue,
  startBattery,
  stepProgram,
  stepBattery,
  stopBattery,
  type MoralRun,
  type MoralState,
  computeScores,
  computeTally,
} from "@/lib/moral";

export const maxDuration = 60;

// Battery control is not public in production
const controlAllowed =
  process.env.NODE_ENV === "development" || process.env.ALLOW_REMOTE_CONTROL === "1";

export async function GET() {
  const state = await readState<MoralState>("moral");
  const queuePeek = await readQueue();
  const progPeek = await readProgram();
  const work =
    state?.run?.status === "running"
      ? stepBattery
      : queuePeek.length > 0
        ? maybeStartNext // queued single-model trials first
        : progPeek?.active
          ? stepProgram // then the rotating program
          : maybeStartNext;
  try {
    waitUntil(new Promise<void>((resolve) => tryStep("moral", () => work().finally(resolve))));
  } catch {
    tryStep("moral", work);
  }
  const all = await readRuns<MoralRun>("moral");
  // home-page summary across every completed run
  const charTotals: Record<string, { saved: number; killed: number }> = {};
  let verdicts = 0;
  for (const run of all) {
    // slim summaries carry no answers; index is the count asked
    verdicts += run.answers.length > 0 ? run.answers.filter((a) => a.choice !== "ERROR").length : (run.index ?? 0);
    for (const [id, s] of Object.entries(run.characterStats ?? {})) {
      const t = (charTotals[id] ??= { saved: 0, killed: 0 });
      t.saved += s.saved;
      t.killed += s.killed;
    }
  }
  // fold in the rotation's live tallies so rankings move every verdict
  const progForSummary = await readProgram();
  for (const [id, t] of Object.entries(progForSummary?.tallies?.chars ?? {})) {
    const c = (charTotals[id] ??= { saved: 0, killed: 0 });
    c.saved += t.s;
    c.killed += t.k;
  }
  const eligible = Object.entries(charTotals).filter(([, s]) => s.saved + s.killed >= 10);
  const rate = (s: { saved: number; killed: number }) => s.saved / (s.saved + s.killed);
  const summary = {
    verdicts,
    models: new Set(all.map((r) => r.model)).size,
    characterTotals: charTotals,
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
            return { mostSaved: t.mostSaved, mostKilled: t.mostKilled, characterStats: t.stats };
          })(),
          startedAt: activeRun.startedAt,
        }
      : null;
  return NextResponse.json({
    run: state?.run ?? null,
    live,
    queue: queuePeek.map((j) => j.model),
    program: progPeek
      ? {
          active: progPeek.active,
          step: progPeek.step,
          totalSteps:
            progPeek.models.length * progPeek.seeds.length * progPeek.sessions * 15,
          models: progPeek.models,
          currentModel: progPeek.models[progPeek.step % progPeek.models.length],
          last: progPeek.last ?? null,
          pending: progPeek.pending ?? null,
          pets: progPeek.tallies?.pets ?? null,
        }
      : null,
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
      characterStats: r.characterStats ?? null,
      startedAt: r.startedAt,
    })),
  });
}

export async function POST(req: Request) {
  if (!controlAllowed) {
    return NextResponse.json({ error: "disabled in production" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  if (body.action === "start" && typeof body.model === "string") {
    await startBattery(
      body.model,
      Number.isFinite(Number(body.seed)) ? Number(body.seed) : 1,
      Math.min(Math.max(Number(body.sessions) || 20, 1), 200),
    );
  } else if (body.action === "stop") {
    await stopBattery();
  }
  return GET();
}
