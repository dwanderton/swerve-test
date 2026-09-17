import fs from "node:fs";
import path from "node:path";
import { generateObject, jsonSchema } from "ai";

// Storage backends: Upstash Redis in production (shared store with
// the petrov-test project, swerve:* key prefix), plain files in dev.
const useRedis =
  !!process.env.KV_REST_API_URL &&
  (process.env.NODE_ENV === "production" || process.env.USE_REDIS === "1");

import type { Redis } from "@upstash/redis";
let redisClient: Redis | null = null;
async function redis(): Promise<Redis> {
  if (!redisClient) {
    const { Redis } = await import("@upstash/redis");
    redisClient = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    });
  }
  return redisClient;
}

const stateKey = (exp: string) => `swerve:${exp}:state`;
const runsKey = (exp: string) => `swerve:${exp}:runs`;
const lockKey = (exp: string) => `swerve:${exp}:lock`;

const DATA_DIR = path.join(process.cwd(), "data");

function dir(exp: string) {
  const d = path.join(DATA_DIR, exp);
  fs.mkdirSync(d, { recursive: true });
  return d;
}

export async function readState<T>(exp: string): Promise<T | null> {
  if (useRedis) {
    const r = await redis();
    return (await r.get<T>(stateKey(exp))) ?? null;
  }
  const f = path.join(dir(exp), "state.json");
  if (!fs.existsSync(f)) return null;
  try {
    return JSON.parse(fs.readFileSync(f, "utf8"));
  } catch {
    return null;
  }
}

export async function writeState(exp: string, state: unknown): Promise<void> {
  if (useRedis) {
    const r = await redis();
    await r.set(stateKey(exp), state);
    return;
  }
  fs.writeFileSync(path.join(dir(exp), "state.json"), JSON.stringify(state), "utf8");
}

export async function appendRun(exp: string, run: unknown): Promise<void> {
  if (useRedis) {
    const r = await redis();
    await r.rpush(runsKey(exp), JSON.stringify(run));
    return;
  }
  fs.appendFileSync(path.join(dir(exp), "runs.jsonl"), JSON.stringify(run) + "\n", "utf8");
}

export async function readRuns<T>(exp: string, last = 50): Promise<T[]> {
  if (useRedis) {
    const r = await redis();
    const raw = await r.lrange<T | string>(runsKey(exp), -last, -1);
    return raw.map((v) => (typeof v === "string" ? (JSON.parse(v) as T) : v));
  }
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

// Full documents (complete runs with every answer) live outside the
// slim runs list so summary polls stay small
export async function putDoc(exp: string, id: string, doc: unknown): Promise<void> {
  if (useRedis) {
    const r = await redis();
    await r.set(`swerve:${exp}:doc:${id}`, doc);
    return;
  }
  const d = path.join(dir(exp), "docs");
  fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, `${id}.json`), JSON.stringify(doc), "utf8");
}

export async function getDoc<T>(exp: string, id: string): Promise<T | null> {
  if (!/^[\w-]+$/.test(id)) return null;
  if (useRedis) {
    const r = await redis();
    return (await r.get<T>(`swerve:${exp}:doc:${id}`)) ?? null;
  }
  const f = path.join(dir(exp), "docs", `${id}.json`);
  if (!fs.existsSync(f)) return null;
  try {
    return JSON.parse(fs.readFileSync(f, "utf8"));
  } catch {
    return null;
  }
}

// Generic named lists (per-model in-progress answers for the program)
const safe = (name: string) => name.replace(/[^\w-]/g, "_");
const listKey = (exp: string, name: string) => `swerve:${exp}:list:${safe(name)}`;

function listFile(exp: string, name: string) {
  const d = path.join(dir(exp), "lists");
  fs.mkdirSync(d, { recursive: true });
  return path.join(d, `${safe(name)}.jsonl`);
}

export async function listPush(exp: string, name: string, item: unknown): Promise<number> {
  if (useRedis) {
    const r = await redis();
    return await r.rpush(listKey(exp, name), JSON.stringify(item));
  }
  const f = listFile(exp, name);
  fs.appendFileSync(f, JSON.stringify(item) + "\n", "utf8");
  return fs.readFileSync(f, "utf8").split("\n").filter(Boolean).length;
}

export async function listAll<T>(exp: string, name: string): Promise<T[]> {
  if (useRedis) {
    const r = await redis();
    const raw = await r.lrange<T | string>(listKey(exp, name), 0, -1);
    return raw.map((v) => (typeof v === "string" ? (JSON.parse(v) as T) : v));
  }
  const f = listFile(exp, name);
  if (!fs.existsSync(f)) return [];
  return fs
    .readFileSync(f, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

export async function listClear(exp: string, name: string): Promise<void> {
  if (useRedis) {
    const r = await redis();
    await r.del(listKey(exp, name));
    return;
  }
  const f = listFile(exp, name);
  if (fs.existsSync(f)) fs.unlinkSync(f);
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

// One in-flight step per experiment. In-memory flag for dev; a Redis
// NX lock in production so concurrent serverless instances can't
// double-step a run.
const busy = new Map<string, boolean>();

export function tryStep(exp: string, step: () => Promise<void>) {
  if (busy.get(exp)) return;
  busy.set(exp, true);
  void (async () => {
    if (useRedis) {
      const r = await redis();
      const claimed = await r.set(lockKey(exp), "1", { nx: true, px: 50_000 });
      if (claimed === null) return;
      try {
        await step();
      } finally {
        await r.del(lockKey(exp)).catch(() => {});
      }
    } else {
      await step();
    }
  })()
    .catch(() => {})
    .finally(() => busy.set(exp, false));
}
