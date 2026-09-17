import { readRuns } from "@/lib/engine";
import { getRunDoc } from "@/lib/moral";

export const maxDuration = 60;

// Default: every run summary (scores, tallies, metadata) as JSONL.
// ?run=<id>: that run's complete record with every verdict and reason.
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("run");
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
  const runs = await readRuns<unknown>("moral", 100_000);
  const body = runs.map((r) => JSON.stringify(r)).join("\n") + (runs.length ? "\n" : "");
  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Content-Disposition": 'attachment; filename="swerve-results.jsonl"',
      "Cache-Control": "no-store",
    },
  });
}
