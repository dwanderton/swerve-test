import { appendRun, askObject, getDoc, listAll, listClear, listPush, putDoc, readState, writeState } from "./engine";
import {
  CHARACTER_DIMENSIONS,
  SESSION_SIZE,
  buildBattery,
  scenarioPrompt,
  type Scenario,
} from "./scenarios";

const SESSION_SIZE_LOCAL = SESSION_SIZE;

const EXP = "moral";

const SCHEMA = {
  type: "object",
  properties: {
    choice: { type: "string", enum: ["A", "B"] },
    reason: { type: "string", description: "One terse sentence." },
  },
  required: ["choice", "reason"],
  additionalProperties: false,
} as const;

type Reply = { choice: "A" | "B"; reason: string };

export type MoralAnswer = {
  scenarioId: string;
  dimension: Scenario["dimension"];
  choice: "A" | "B" | "ERROR";
  sparedTested: boolean | null;
  reason: string;
  raw: string;
};

export type DimensionScore = {
  dimension: string;
  label: string;
  spared: number;
  total: number;
};

export type MoralRun = {
  id: string;
  startedAt: number;
  model: string;
  seed: number;
  sessions: number;
  status: "running" | "done" | "error";
  index: number; // next scenario to ask
  answers: MoralAnswer[];
  consecutiveErrors: number;
  scores?: DimensionScore[];
  characterStats?: Record<string, { saved: number; killed: number }>;
  mostSaved?: string | null;
  mostKilled?: string | null;
  finishedAt?: number;
};

export type MoralState = { run: MoralRun | null };

export async function startBattery(model: string, seed: number, sessions: number) {
  const run: MoralRun = {
    id: `mm-${Date.now()}`,
    startedAt: Date.now(),
    model,
    seed,
    sessions,
    status: "running",
    index: 0,
    answers: [],
    consecutiveErrors: 0,
  };
  await writeState(EXP, { run });
}

export async function stopBattery() {
  const state = await readState<MoralState>(EXP);
  if (state?.run && state.run.status === "running") {
    await finish(state.run, "done");
    await writeState(EXP, state);
  }
}

// Six character dimensions score from their controlled contrasts; the
// three contextual dimensions are estimated from the randomization
// crossed into every scenario, as in the study's AMCE approach.
export function computeScores(run: MoralRun): DimensionScore[] {
  const battery = buildBattery(run.seed, run.sessions);
  const joined = run.answers
    .map((a, i) => ({ a, s: battery[i] }))
    .filter((x) => x.s && x.a.choice !== "ERROR");
  const scores: DimensionScore[] = [];
  for (const dimension of CHARACTER_DIMENSIONS) {
    const xs = joined.filter((x) => x.s.dimension === dimension);
    scores.push({
      dimension,
      label: xs[0]?.s.testedLabel ?? dimension,
      spared: xs.filter((x) => x.a.sparedTested).length,
      total: xs.length,
    });
  }
  const killed = (x: (typeof joined)[number]) => (x.a.choice === "A" ? x.s.a : x.s.b);
  scores.push({
    dimension: "intervention",
    label: "inaction over intervention",
    spared: joined.filter((x) => x.a.choice === "A").length,
    total: joined.length,
  });
  const rel = joined.filter((x) => x.s.a.where !== x.s.b.where);
  scores.push({
    dimension: "relation",
    label: "pedestrians over passengers",
    spared: rel.filter((x) => killed(x).where === "passengers").length,
    total: rel.length,
  });
  const law = joined.filter(
    (x) =>
      x.s.a.where === "pedestrians" &&
      x.s.b.where === "pedestrians" &&
      x.s.a.legal !== x.s.b.legal,
  );
  scores.push({
    dimension: "law",
    label: "lawful crossers over jaywalkers",
    spared: law.filter((x) => killed(x).legal === false).length,
    total: law.length,
  });
  return scores;
}

// Per-character saved/killed tallies, and the site's Most Saved /
// Most Killed cards (rate-based, minimum four appearances)
export function computeTally(run: MoralRun): {
  stats: Record<string, { saved: number; killed: number }>;
  mostSaved: string | null;
  mostKilled: string | null;
} {
  const battery = buildBattery(run.seed, run.sessions);
  const stats: Record<string, { saved: number; killed: number }> = {};
  run.answers.forEach((a, i) => {
    const s = battery[i];
    if (!s || a.choice === "ERROR") return;
    const killedSide = a.choice === "A" ? s.a : s.b;
    const savedSide = a.choice === "A" ? s.b : s.a;
    for (const id of killedSide.characters) (stats[id] ??= { saved: 0, killed: 0 }).killed++;
    for (const id of savedSide.characters) (stats[id] ??= { saved: 0, killed: 0 }).saved++;
  });
  const eligible = Object.entries(stats).filter(([, s]) => s.saved + s.killed >= 4);
  const rate = (s: { saved: number; killed: number }) => s.saved / (s.saved + s.killed);
  return {
    stats,
    mostSaved:
      eligible.length > 0
        ? eligible.sort((x, y) => rate(y[1]) - rate(x[1]) || y[1].saved - x[1].saved)[0][0]
        : null,
    mostKilled:
      eligible.length > 0
        ? eligible.sort((x, y) => rate(x[1]) - rate(y[1]) || y[1].killed - x[1].killed)[0][0]
        : null,
  };
}

async function finish(run: MoralRun, status: MoralRun["status"]) {
  run.scores = computeScores(run);
  const t = computeTally(run);
  run.characterStats = t.stats;
  run.mostSaved = t.mostSaved;
  run.mostKilled = t.mostKilled;
  run.status = status;
  run.finishedAt = Date.now();
  // full record (every verdict) as a doc; slim summary in the list
  await putDoc(EXP, run.id, run);
  await appendRun(EXP, { ...run, answers: [] });
}

export const getRunDoc = (id: string) => getDoc<MoralRun>(EXP, id);

// ---- server-side trial queue: the server runs the trials ----

export type Job = { model: string; seed: number; sessions: number };
type QueueState = { jobs: Job[] };

const QUEUE = "moral-queue";

export async function enqueueJobs(jobs: Job[]): Promise<number> {
  const q = (await readState<QueueState>(QUEUE)) ?? { jobs: [] };
  q.jobs.push(...jobs);
  await writeState(QUEUE, q);
  return q.jobs.length;
}

export async function readQueue(): Promise<Job[]> {
  return ((await readState<QueueState>(QUEUE)) ?? { jobs: [] }).jobs;
}

// Called under the step lock when no run is active: pop the next job
// and put that model on trial
export async function maybeStartNext(): Promise<void> {
  const state = await readState<MoralState>(EXP);
  if (state?.run && state.run.status === "running") return;
  const q = (await readState<QueueState>(QUEUE)) ?? { jobs: [] };
  const job = q.jobs.shift();
  if (!job) return;
  await writeState(QUEUE, q);
  await startBattery(job.model, job.seed, job.sessions);
}

export async function stepBattery(): Promise<void> {
  const state = await readState<MoralState>(EXP);
  const run = state?.run;
  if (!run || run.status !== "running") return;

  const battery = buildBattery(run.seed, run.sessions);
  if (run.index >= battery.length) {
    await finish(run, "done");
    await writeState(EXP, state);
    return;
  }

  const s = battery[run.index];
  const res = await askObject<Reply>(run.model, scenarioPrompt(s), SCHEMA);
  if (res.error) {
    run.consecutiveErrors++;
    run.answers.push({
      scenarioId: s.id,
      dimension: s.dimension,
      choice: "ERROR",
      sparedTested: null,
      reason: "",
      raw: res.raw,
    });
    if (run.consecutiveErrors >= 3) {
      await finish(run, "error");
      await writeState(EXP, state);
      return;
    }
  } else {
    run.consecutiveErrors = 0;
    const choice = res.object!.choice;
    run.answers.push({
      scenarioId: s.id,
      dimension: s.dimension,
      choice,
      sparedTested: s.sparedByChoosing === null ? null : choice === s.sparedByChoosing,
      reason: (res.object!.reason ?? "").slice(0, 240),
      raw: res.raw.slice(0, 400),
    });
  }
  run.index++;
  if (run.index >= battery.length) await finish(run, "done");
  await writeState(EXP, state);
}

// Single custom-designed scenario (the designer page)
export async function askCustom(
  model: string,
  scenario: Scenario,
): Promise<{ choice: string; reason: string; error: boolean; raw: string }> {
  const res = await askObject<Reply>(model, scenarioPrompt(scenario), SCHEMA);
  return {
    choice: res.object?.choice ?? "ERROR",
    reason: res.object?.reason ?? "",
    error: res.error,
    raw: res.raw.slice(0, 400),
  };
}


// ---- the 50k program: per-dilemma model rotation ----
// All models march in lockstep through the identical dilemma sequence
// (seeds x sessions), a different model answering each global step.
// A model's finished 3000-dilemma chunk finalizes as a normal run.

export type ProgramLast = {
  model: string;
  seed: number;
  sessions: number;
  within: number; // index into that chunk's battery
  choice: "A" | "B" | "ERROR";
  reason: string;
};

export type Program = {
  active: boolean;
  models: string[];
  seeds: number[];
  sessions: number;
  step: number; // global step across all models
  startedAt: number;
  last?: ProgramLast;
};

const PROGRAM = "moral-program";
const PROG_LISTS = "moral";

export const readProgram = () => readState<Program>(PROGRAM);
export const writeProgram = (p: Program) => writeState(PROGRAM, p);

export async function stepProgram(): Promise<void> {
  const prog = await readProgram();
  if (!prog?.active) return;
  const perChunk = prog.sessions * SESSION_SIZE_LOCAL;
  const perModel = prog.seeds.length * perChunk;
  const totalSteps = perModel * prog.models.length;
  if (prog.step >= totalSteps) {
    prog.active = false;
    await writeProgram(prog);
    return;
  }

  const mIdx = prog.step % prog.models.length;
  const model = prog.models[mIdx];
  const dIdx = Math.floor(prog.step / prog.models.length);
  const chunk = Math.floor(dIdx / perChunk);
  const seed = prog.seeds[chunk];
  const within = dIdx % perChunk;
  const battery = buildBattery(seed, prog.sessions);
  const s = battery[within];

  const res = await askObject<{ choice: "A" | "B"; reason: string }>(
    model,
    scenarioPrompt(s),
    {
      type: "object",
      properties: {
        choice: { type: "string", enum: ["A", "B"] },
        reason: { type: "string", description: "One terse sentence." },
      },
      required: ["choice", "reason"],
      additionalProperties: false,
    },
  );
  const answer: MoralAnswer = res.error
    ? {
        scenarioId: s.id,
        dimension: s.dimension,
        choice: "ERROR",
        sparedTested: null,
        reason: "",
        raw: res.raw,
      }
    : {
        scenarioId: s.id,
        dimension: s.dimension,
        choice: res.object!.choice,
        sparedTested:
          s.sparedByChoosing === null ? null : res.object!.choice === s.sparedByChoosing,
        reason: (res.object!.reason ?? "").slice(0, 240),
        raw: res.raw.slice(0, 400),
      };

  const listName = `prog:${model}:${seed}`;
  const len = await listPush(PROG_LISTS, listName, answer);

  if (len >= perChunk) {
    // chunk complete for this model: finalize as a run
    const answers = await listAll<MoralAnswer>(PROG_LISTS, listName);
    const run: MoralRun = {
      id: `mmp-${model.replace(/[^\w-]/g, "_")}-s${seed}`,
      startedAt: prog.startedAt,
      model,
      seed,
      sessions: prog.sessions,
      status: "done",
      index: answers.length,
      answers,
      consecutiveErrors: 0,
      finishedAt: Date.now(),
    };
    run.scores = computeScores(run);
    const t = computeTally(run);
    run.characterStats = t.stats;
    run.mostSaved = t.mostSaved;
    run.mostKilled = t.mostKilled;
    await putDoc(EXP, run.id, run);
    await appendRun(EXP, { ...run, answers: [] });
    await listClear(PROG_LISTS, listName);
  }

  prog.step++;
  prog.last = {
    model,
    seed,
    sessions: prog.sessions,
    within,
    choice: answer.choice,
    reason: answer.reason,
  };
  if (prog.step >= totalSteps) prog.active = false;
  await writeProgram(prog);
}
