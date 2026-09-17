"use client";

import { useState } from "react";
import { Btn, ModelSelect, Panel } from "./ui";
import { CHARACTERS, describeGroup } from "@/lib/characters";
import type { Side } from "@/lib/scenarios";

type SideDraft = {
  counts: Record<string, number>;
  where: "pedestrians" | "passengers";
  legal: boolean;
};

const emptySide = (): SideDraft => ({ counts: {}, where: "pedestrians", legal: true });

function toSide(d: SideDraft): Side {
  const characters = Object.entries(d.counts).flatMap(([id, n]) =>
    Array.from({ length: n }, () => id),
  );
  return {
    characters,
    where: d.where,
    legal: d.where === "passengers" ? null : d.legal,
  };
}

function SideEditor({
  title,
  draft,
  onChange,
}: {
  title: string;
  draft: SideDraft;
  onChange: (d: SideDraft) => void;
}) {
  const total = Object.values(draft.counts).reduce((a, b) => a + b, 0);
  const bump = (id: string, delta: number) => {
    const next = { ...draft.counts, [id]: Math.max(0, (draft.counts[id] ?? 0) + delta) };
    if (next[id] === 0) delete next[id];
    onChange({ ...draft, counts: next });
  };
  return (
    <Panel title={title}>
      <div className="mb-3 flex flex-wrap items-center gap-3 font-mono text-[11px]">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={draft.where === "pedestrians"}
            onChange={() => onChange({ ...draft, where: "pedestrians" })}
          />
          pedestrians
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={draft.where === "passengers"}
            onChange={() => onChange({ ...draft, where: "passengers" })}
          />
          passengers
        </label>
        {draft.where === "pedestrians" && (
          <label className="flex items-center gap-2 text-ink-muted">
            <input
              type="checkbox"
              checked={draft.legal}
              onChange={(e) => onChange({ ...draft, legal: e.target.checked })}
            />
            crossing legally
          </label>
        )}
        <span className="ml-auto text-ink-faint">{total}/10</span>
      </div>
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
        {CHARACTERS.map((c) => {
          const n = draft.counts[c.id] ?? 0;
          return (
            <div
              key={c.id}
              className={`flex items-center justify-between rounded border px-2 py-1 font-mono text-[10px] ${
                n > 0 ? "border-ink-faint text-ink" : "border-line/50 text-ink-faint"
              }`}
            >
              <span className="truncate">{c.label.replace(/^an? /, "")}</span>
              <span className="flex items-center gap-1">
                <button onClick={() => bump(c.id, -1)} className="px-1 hover:text-primary">
                  −
                </button>
                <span className="w-4 text-center tabular-nums">{n}</span>
                <button
                  onClick={() => total < 10 && bump(c.id, 1)}
                  className="px-1 hover:text-emerald-500"
                >
                  +
                </button>
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

export default function DesignerApp() {
  const [model, setModel] = useState("anthropic/claude-haiku-4.5");
  const [a, setA] = useState<SideDraft>(emptySide);
  const [b, setB] = useState<SideDraft>(emptySide);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    choice: string;
    reason: string;
    prompt: string;
    error: boolean;
  } | null>(null);

  const ready =
    Object.values(a.counts).some((n) => n > 0) && Object.values(b.counts).some((n) => n > 0);

  const ask = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/moral/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, a: toSide(a), b: toSide(b) }),
      });
      if (res.ok) setResult(await res.json());
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-mono text-sm tracking-[0.3em] text-ink">SCENARIO DESIGNER</h1>
          <p className="mt-1 font-mono text-[11px] tracking-[0.14em] text-ink-faint">
            BUILD YOUR OWN DILEMMA · OUTCOME A = CONTINUE STRAIGHT · B = SWERVE
          </p>
        </div>
        <div className="flex items-end gap-3">
          <ModelSelect value={model} onChange={setModel} label="MODEL" />
          <Btn tone="danger" disabled={!ready || busy} onClick={ask}>
            {busy ? "ASKING…" : "ASK THE MODEL"}
          </Btn>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SideEditor title="OUTCOME A — KILLED IF CHOSEN (STRAIGHT)" draft={a} onChange={setA} />
        <SideEditor title="OUTCOME B — KILLED IF CHOSEN (SWERVE)" draft={b} onChange={setB} />
      </div>

      <Panel title="VERDICT" className="mt-4">
        {result ? (
          <div className="space-y-2 font-mono text-[11px]">
            <div>
              <span className="text-ink-faint">CHOICE </span>
              <span className={result.error ? "text-amber-500" : "text-primary"}>
                {result.choice}
              </span>
              {!result.error && (
                <span className="text-ink-muted">
                  {" "}
                  — kills{" "}
                  {describeGroup(toSide(result.choice === "A" ? a : b).characters)}
                </span>
              )}
            </div>
            {result.reason && <div className="italic text-ink">“{result.reason}”</div>}
            <details className="text-ink-faint">
              <summary className="cursor-pointer">prompt shown to the model</summary>
              <pre className="mt-2 whitespace-pre-wrap rounded border border-line/50 bg-bg p-3 text-[10px]">
                {result.prompt}
              </pre>
            </details>
          </div>
        ) : (
          <div className="font-mono text-[11px] text-ink-faint">
            Compose both outcomes, pick a model, ask. Every verdict is logged to
            data/moral-custom/runs.jsonl.
          </div>
        )}
      </Panel>
    </main>
  );
}
