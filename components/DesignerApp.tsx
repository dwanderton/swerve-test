"use client";

import { useState } from "react";
import { Btn, ModelSelect } from "./ui";
import { OutcomePanel } from "./ScenarioCard";
import { CHARACTERS, EMOJI, describeGroup } from "@/lib/characters";
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
  return { characters, where: d.where, legal: d.where === "passengers" ? null : d.legal };
}

function SideControls({
  draft,
  onChange,
}: {
  draft: SideDraft;
  onChange: (d: SideDraft) => void;
}) {
  const total = Object.values(draft.counts).reduce((a, b) => a + b, 0);
  const bump = (id: string, delta: number) => {
    if (delta > 0 && total >= 10) return;
    const next = { ...draft.counts, [id]: Math.max(0, (draft.counts[id] ?? 0) + delta) };
    if (next[id] === 0) delete next[id];
    onChange({ ...draft, counts: next });
  };
  return (
    <div className="rounded-lg border border-line bg-surface/50 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-3 text-[10px] tracking-[0.2em]">
        <label className="flex items-center gap-1.5 text-ink-muted">
          <input
            type="radio"
            checked={draft.where === "pedestrians"}
            onChange={() => onChange({ ...draft, where: "pedestrians" })}
          />
          PEDESTRIANS
        </label>
        <label className="flex items-center gap-1.5 text-ink-muted">
          <input
            type="radio"
            checked={draft.where === "passengers"}
            onChange={() => onChange({ ...draft, where: "passengers" })}
          />
          PASSENGERS
        </label>
        {draft.where === "pedestrians" && (
          <button
            onClick={() => onChange({ ...draft, legal: !draft.legal })}
            className={draft.legal ? "text-walk" : "text-primary"}
          >
            {draft.legal ? "● WALK SIGNAL" : "✕ JAYWALKING"}
          </button>
        )}
        <span className="ml-auto text-ink-faint">{total}/10</span>
      </div>
      <div className="grid grid-cols-4 gap-1 sm:grid-cols-5">
        {CHARACTERS.map((c) => {
          const n = draft.counts[c.id] ?? 0;
          return (
            <button
              key={c.id}
              onClick={() => bump(c.id, 1)}
              onContextMenu={(e) => {
                e.preventDefault();
                bump(c.id, -1);
              }}
              title={`${c.label} — click to add, right-click to remove`}
              className={`relative rounded border px-1 py-1.5 text-center transition-colors ${
                n > 0
                  ? "border-paint/70 bg-paint/10"
                  : "border-line/60 hover:border-ink-faint"
              }`}
            >
              <span className="text-xl leading-none">{EMOJI[c.id]}</span>
              <span className="block truncate text-[8px] tracking-wide text-ink-faint">
                {c.label.replace(/^an? /, "")}
              </span>
              {n > 0 && (
                <span className="display absolute -right-1 -top-1 rounded bg-paint px-1 text-[10px] text-black">
                  {n}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
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
  const choice = result && !result.error ? (result.choice as "A" | "B") : null;

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
    <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-5xl leading-none text-ink md:text-6xl">
            BUILD THE <span className="text-paint">DILEMMA</span>
          </h1>
          <p className="mt-2 text-[11px] tracking-[0.2em] text-ink-faint">
            COMPOSE BOTH OUTCOMES. CLICK ADDS A CHARACTER, RIGHT-CLICK REMOVES. THEN PUT IT
            TO A MODEL.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <ModelSelect value={model} onChange={setModel} label="MODEL ON TRIAL" />
          <Btn tone="go" disabled={!ready || busy} onClick={ask}>
            {busy ? "DELIBERATING…" : "ASK THE MODEL"}
          </Btn>
        </div>
      </div>

      <div className="mt-6 flex items-stretch gap-3 md:gap-4">
        <OutcomePanel
          side={toSide(a)}
          option="A"
          verdict={choice ? (choice === "A" ? "KILLED" : "SPARED") : null}
        />
        <div className="lane-divider w-1.5 shrink-0 rounded-full" />
        <OutcomePanel
          side={toSide(b)}
          option="B"
          verdict={choice ? (choice === "B" ? "KILLED" : "SPARED") : null}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SideControls draft={a} onChange={setA} />
        <SideControls draft={b} onChange={setB} />
      </div>

      {result && (
        <div className="mt-5 rounded border-l-4 border-paint bg-surface/60 px-4 py-3 text-[12px]">
          {result.error ? (
            <span className="text-paint">COMMS ERROR — {result.reason || "no verdict"}</span>
          ) : (
            <>
              <span className="text-ink-faint">VERDICT: </span>
              <span className="text-primary">
                kills {describeGroup(toSide(choice === "A" ? a : b).characters)}
              </span>
              {result.reason && <span className="italic text-ink"> — “{result.reason}”</span>}
            </>
          )}
          <details className="mt-2 text-ink-faint">
            <summary className="cursor-pointer text-[10px] tracking-[0.2em]">
              PROMPT SHOWN TO THE MODEL
            </summary>
            <pre className="mt-2 whitespace-pre-wrap rounded border border-line/50 bg-bg p-3 text-[10px]">
              {result.prompt}
            </pre>
          </details>
        </div>
      )}
    </main>
  );
}
