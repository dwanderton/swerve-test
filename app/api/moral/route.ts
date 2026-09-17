import { NextResponse } from "next/server";
import { readRuns, readState, tryStep } from "@/lib/engine";
import {
  startBattery,
  stepBattery,
  stopBattery,
  type MoralRun,
  type MoralState,
} from "@/lib/moral";

export async function GET() {
  const state = readState<MoralState>("moral");
  if (state?.run?.status === "running") tryStep("moral", stepBattery);
  return NextResponse.json({
    run: state?.run ?? null,
    runs: readRuns<MoralRun>("moral").map((r) => ({
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
