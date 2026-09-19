import { readRuns, listAll } from "@/lib/engine";
import { getRunDoc, readProgram, type MoralAnswer, type MoralRun } from "@/lib/moral";
import { SESSION_SIZE } from "@/lib/scenarios";

export const maxDuration = 60;

// Default: one JSONL line per verdict - every trial and rotation
// answer with its reason. ?run=<id>: that run's complete record.
// ?summaries=1: the slim per-run summary list.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("run");
  if (id) {
    const doc = await getRunDoc(id);
    if (!doc) return new Response("not found", { status: 404 });
    return new Response(JSON.stringify(doc), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="swerve-run-${id}.json"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const runs = await readRuns<MoralRun>("moral", 100_000);
  if (url.searchParams.get("summaries")) {
    const body = runs.map((r) => JSON.stringify(r)).join("\n") + (runs.length ? "\n" : "");
    return jsonl(body, "swerve-summaries.jsonl");
  }

  const lines: string[] = [];
  const verdict = (
    source: "trial" | "rotation",
    replay: string,
    meta: { runId?: string; model: string; seed: number; sessions: number; dims?: string[] | null },
    a: MoralAnswer,
  ) =>
    lines.push(
      JSON.stringify({
        source,
        replay,
        ...meta,
        scenarioId: a.scenarioId,
        dimension: a.dimension,
        choice: a.choice,
        sparedTested: a.sparedTested,
        reason: a.reason,
      }),
    );

  for (const r of runs) {
    const doc = (await getRunDoc(r.id)) ?? r;
    (doc.answers ?? []).forEach((a, i) => {
      verdict(
        "trial",
        `${r.id}~${i}`,
        { runId: r.id, model: r.model, seed: r.seed, sessions: r.sessions, dims: r.dims ?? null },
        a,
      );
    });
  }

  // the rotation's in-flight chunks (completed chunks are runs above)
  const prog = await readProgram();
  if (prog) {
    const perChunk = prog.sessions * SESSION_SIZE;
    const currentChunk = Math.floor(Math.floor(prog.step / prog.models.length) / perChunk);
    for (const model of prog.models) {
      for (let c = 0; c <= currentChunk && c < prog.seeds.length; c++) {
        const seed = prog.seeds[c];
        const answers = await listAll<MoralAnswer>("moral", `prog:${model}:${seed}`);
        answers.forEach((a, i) => {
          verdict(
            "rotation",
            `rot~${model.replace("/", "_")}~${seed}~${i}`,
            { model, seed, sessions: prog.sessions },
            a,
          );
        });
      }
    }
  }

  return jsonl(lines.join("\n") + (lines.length ? "\n" : ""), "swerve-results.jsonl");
}

function jsonl(body: string, filename: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Content-Disposition": `attachment; filename="${filename}"`,
      // heavy to assemble; let the CDN absorb repeat downloads
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
