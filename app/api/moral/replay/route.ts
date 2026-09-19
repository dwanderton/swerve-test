import { NextResponse } from "next/server";
import { listAll } from "@/lib/engine";
import { getRunDoc, readProgram } from "@/lib/moral";
import { buildBattery, buildFilteredBattery } from "@/lib/scenarios";
import { buildBatteryV1 } from "@/lib/generator-v1";
import { MODELS } from "@/lib/models";

export const maxDuration = 30;

// Resolve a replay id to its scenario and verdict.
//   <runId>~<index>            a trial run's answer
//   rot~<model_safe>~<seed>~<index>   an in-flight rotation answer
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!/^[\w.~-]+$/.test(id)) return NextResponse.json({ error: "bad id" }, { status: 400 });

  if (id.startsWith("rot~")) {
    const [, modelSafe, seedStr, idxStr] = id.split("~");
    const model = MODELS.find((m) => m.id.replace("/", "_") === modelSafe)?.id;
    const seed = Number(seedStr);
    const idx = Number(idxStr);
    const prog = await readProgram();
    if (!model || !prog || !Number.isInteger(seed) || !Number.isInteger(idx)) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    const answers = await listAll<{ scenarioId: string; choice: string; reason: string }>(
      "moral",
      `prog:${model}:${seed}`,
    );
    const a = answers[idx];
    const scenario = buildBattery(seed, prog.sessions)[idx];
    if (!a || !scenario) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (a.scenarioId !== scenario.id) {
      return NextResponse.json({ error: "recorded before the current generator" }, { status: 409 });
    }
    return NextResponse.json({ model, scenario, choice: a.choice, reason: a.reason });
  }

  const [runId, idxStr] = id.split("~");
  const idx = Number(idxStr);
  const doc = await getRunDoc(runId);
  if (!doc || !Number.isInteger(idx)) return NextResponse.json({ error: "not found" }, { status: 404 });
  const a = doc.answers?.[idx];
  if (!a) return NextResponse.json({ error: "not found" }, { status: 404 });
  // the run's era is whichever generator reproduces its recorded ids
  let scenario = buildFilteredBattery(doc.seed, doc.sessions, doc.dims)[idx];
  if ((!scenario || a.scenarioId !== scenario.id) && !doc.dims) {
    scenario = buildBatteryV1(doc.seed, doc.sessions)[idx];
  }
  if (!scenario || a.scenarioId !== scenario.id) {
    return NextResponse.json({ error: "no generator reproduces this recording" }, { status: 409 });
  }
  return NextResponse.json({ model: doc.model, scenario, choice: a.choice, reason: a.reason });
}
