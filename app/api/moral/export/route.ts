import { readRuns } from "@/lib/engine";

export const maxDuration = 60;

// Full results: every completed run with all verdicts and reasons,
// as JSONL - one run per line
export async function GET() {
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
