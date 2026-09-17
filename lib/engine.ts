import fs from "node:fs";
import path from "node:path";
import { generateObject, jsonSchema } from "ai";

const DATA_DIR = path.join(process.cwd(), "data");

function dir(exp: string) {
  const d = path.join(DATA_DIR, exp);
  fs.mkdirSync(d, { recursive: true });
  return d;
}

export function readState<T>(exp: string): T | null {
  const f = path.join(dir(exp), "state.json");
  if (!fs.existsSync(f)) return null;
  try {
    return JSON.parse(fs.readFileSync(f, "utf8"));
  } catch {
    return null;
  }
}

export function writeState(exp: string, state: unknown) {
  fs.writeFileSync(path.join(dir(exp), "state.json"), JSON.stringify(state), "utf8");
}

export function appendRun(exp: string, run: unknown) {
  fs.appendFileSync(path.join(dir(exp), "runs.jsonl"), JSON.stringify(run) + "\n", "utf8");
}

export function readRuns<T>(exp: string, last = 50): T[] {
  const f = path.join(dir(exp), "runs.jsonl");
  if (!fs.existsSync(f)) return [];
  const runs: T[] = [];
  for (const line of fs.readFileSync(f, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      runs.push(JSON.parse(line));
    } catch {
      // skip corrupt line
    }
  }
  return runs.slice(-last);
}

export type AskResult<T> = { object: T | null; raw: string; error: boolean };

// Structured output only: the model fills a JSON schema with enum-
// constrained choices. No free text, no parsing ambiguity.
export async function askObject<T>(
  model: string,
  prompt: string,
  schema: Record<string, unknown>,
): Promise<AskResult<T>> {
  try {
    const res = await generateObject({
      model,
      prompt,
      schema: jsonSchema<T>(schema),
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(35_000),
    });
    return {
      object: res.object,
      raw: JSON.stringify(res.object).slice(0, 1_000),
      error: false,
    };
  } catch (err) {
    const chain: string[] = [];
    const push = (e: unknown) => {
      if (e instanceof Error && chain.length < 5) chain.push(e.message.split("\n")[0]);
    };
    push(err);
    const r = err as { errors?: unknown[]; lastError?: unknown; cause?: unknown };
    if (Array.isArray(r.errors)) r.errors.forEach(push);
    push(r.lastError);
    push(r.cause);
    return { object: null, raw: chain.join(" <- ").slice(0, 300), error: true };
  }
}

// One in-flight step per experiment per server process
const busy = new Map<string, boolean>();

export function tryStep(exp: string, step: () => Promise<void>) {
  if (busy.get(exp)) return;
  busy.set(exp, true);
  void step()
    .catch(() => {})
    .finally(() => busy.set(exp, false));
}
