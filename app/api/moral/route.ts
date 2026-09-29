import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { readState, tryStep } from "@/lib/engine";
import { SESSION_SIZE } from "@/lib/scenarios";
import {
  maybeStartNext,
  readProgram,
  readQueue,
  readRunsCache,
  rebuildRunsCache,
  startBattery,
  stepProgram,
  stepBattery,
  stopBattery,
  type MoralState,
  computeScores,
  computeTally,
} from "@/lib/moral";

export const maxDuration = 60;

// Battery control is not public in production
const controlAllowed =
  process.env.NODE_ENV === "development" || process.env.ALLOW_REMOTE_CONTROL === "1";

const EMPTY = {
  run: null,
  live: null,
  queue: [],
  program: null,
  summary: { verdicts: 0, models: 0, characterTotals: {}, mostSaved: null, mostKilled: null },
  runs: [],
};

// Per-instance last good payload: when Redis is unavailable (quota
// exhausted, outage) polls get stale data, or EMPTY, never a 500
let lastGood: unknown = null;

export async function GET() {
  try {
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
    // aggregates over every completed run come from the one-key cache
    // (rebuilt on run completion); a miss backfills it once
    const cache = (await readRunsCache()) ?? (await rebuildRunsCache());
    // fold in the rotation's live tallies so rankings move every verdict
    const charTotals: Record<string, { saved: number; killed: number }> = {};
    for (const [id, s] of Object.entries(cache.characterTotals)) charTotals[id] = { ...s };
    for (const [id, t] of Object.entries(progPeek?.tallies?.chars ?? {})) {
      const c = (charTotals[id] ??= { saved: 0, killed: 0 });
      c.saved += t.s;
      c.killed += t.k;
    }
    const eligible = Object.entries(charTotals).filter(([, s]) => s.saved + s.killed >= 10);
    const rate = (s: { saved: number; killed: number }) => s.saved / (s.saved + s.killed);
    const summary = {
      verdicts: cache.verdicts,
      models: cache.models.length,
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
    // cases ever reviewed: every stored run, plus the live program's
    // not-yet-chunked steps, plus verdicts from before the roster restart
    const chunkedCurrent = cache.runs
      .filter((r) => r.id.startsWith("mmp-") && r.startedAt === progPeek?.startedAt)
      .reduce((n, r) => n + r.index, 0);
    const caseNumber = progPeek
      ? cache.verdicts + (progPeek.baseVerdicts ?? 0) + Math.max(0, progPeek.step - chunkedCurrent)
      : cache.verdicts;
    const payload = {
      run: state?.run ?? null,
      live,
      queue: queuePeek.map((j) => j.model),
      program: progPeek
        ? {
            active: progPeek.active,
            step: progPeek.step,
            caseNumber,
            totalSteps:
              progPeek.models.length * progPeek.seeds.length * progPeek.sessions * SESSION_SIZE,
            models: progPeek.models,
            currentModel: progPeek.models[progPeek.step % progPeek.models.length],
            last: progPeek.last ?? null,
            pending: progPeek.pending ?? null,
            pets: progPeek.tallies?.pets ?? null,
          }
        : null,
      summary,
      runs: cache.runs,
    };
    lastGood = payload;
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(lastGood ?? EMPTY);
  }
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
