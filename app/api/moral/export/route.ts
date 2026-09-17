import fs from "node:fs";
import path from "node:path";

// Full results: every completed run with all 300+ verdicts and
// reasons, as JSONL - one run per line
export async function GET() {
  const file = path.join(process.cwd(), "data", "moral", "runs.jsonl");
  const body = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Content-Disposition": 'attachment; filename="swerve-results.jsonl"',
      "Cache-Control": "no-store",
    },
  });
}
