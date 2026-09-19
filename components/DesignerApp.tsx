"use client";

import { useState } from "react";
import { Btn, ModelSelect } from "./ui";
import { OutcomePanel, SceneTop } from "./ScenarioCard";
import { CharacterGlyph } from "./glyphs";
import { CHARACTERS, describeGroup } from "@/lib/characters";
import { buildRandom, rng, type Side } from "@/lib/scenarios";

type SideDraft = {
  characters: string[];
  where: "pedestrians" | "passengers";
  legal: boolean;
};

const emptySide = (): SideDraft => ({ characters: [], where: "pedestrians", legal: true });

function toSide(d: SideDraft): Side {
  return {
    characters: d.characters,
    where: d.where,
    legal: d.where === "passengers" ? null : d.legal,
  };
}

function LaneSettings({
  draft,
  onChange,
}: {
  draft: SideDraft;
  onChange: (d: SideDraft) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] tracking-[0.2em]">
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
  const [notice, setNotice] = useState<string | null>(null);

  const ready = a.characters.length > 0 && b.characters.length > 0;
  const choice = result && !result.error ? (result.choice as "A" | "B") : null;

  const drop = (target: "A" | "B") => (payload: string) => {
    setResult(null);
    const [kind, ...rest] = payload.split(":");
    const apply = (setter: typeof setA, d: SideDraft, chars: string[]) =>
      setter({ ...d, characters: chars });
    if (kind === "add") {
      const id = rest[0];
      const d = target === "A" ? a : b;
      if (d.characters.length >= 10) return;
      apply(target === "A" ? setA : setB, d, [...d.characters, id]);
    } else if (kind === "move") {
      const [from, idxStr] = rest;
      const idx = Number(idxStr);
      if (from === target) return;
      const src = from === "A" ? a : b;
      const dst = target === "A" ? a : b;
      if (dst.characters.length >= 10) return;
      const id = src.characters[idx];
      if (id === undefined) return;
      apply(
        from === "A" ? setA : setB,
        src,
        src.characters.filter((_, i) => i !== idx),
      );
      apply(target === "A" ? setA : setB, dst, [...dst.characters, id]);
    }
  };

  const removeFrom = (side: "A" | "B") => (index: number) => {
    setResult(null);
    const d = side === "A" ? a : b;
    (side === "A" ? setA : setB)({
      ...d,
      characters: d.characters.filter((_, i) => i !== index),
    });
  };

  const reset = () => {
    setA(emptySide());
    setB(emptySide());
    setResult(null);
  };

  const randomize = () => {
    const s = buildRandom(rng(Date.now() >>> 0), 0);
    setA({ characters: s.a.characters, where: s.a.where, legal: s.a.legal ?? true });
    setB({ characters: s.b.characters, where: s.b.where, legal: s.b.legal ?? true });
    setResult(null);
  };

  const ask = async () => {
    setBusy(true);
    setResult(null);
    setNotice(null);
    try {
      const res = await fetch("/api/moral/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, a: toSide(a), b: toSide(b) }),
      });
      if (res.ok) {
        setResult(await res.json());
      } else {
        const body = await res.json().catch(() => null);
        setNotice(body?.error ?? "THE MODEL IS UNAVAILABLE. TRY AGAIN.");
      }
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
            DRAG CHARACTERS FROM THE CAST INTO EITHER LANE. CLICK A PLACED FIGURE TO REMOVE
            IT. DRAG BETWEEN LANES TO MOVE.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <ModelSelect value={model} onChange={setModel} label="MODEL ON TRIAL" />
          <Btn tone="go" disabled={!ready || busy} onClick={ask}>
            {busy ? "DELIBERATING…" : "ASK THE MODEL"}
          </Btn>
          <Btn onClick={randomize}>RANDOM</Btn>
          <Btn onClick={reset}>RESET</Btn>
        </div>
      </div>

      {notice && (
        <div className="mt-3 rounded border-l-4 border-primary bg-surface/60 px-4 py-2 font-mono text-[11px] tracking-[0.14em] text-primary">
          {notice}
        </div>
      )}

      {/* the cast — one shared palette, drag into lanes */}
      <div className="mt-6 rounded-lg border border-line bg-surface/50 p-3">
        <div className="mb-2 text-[10px] tracking-[0.28em] text-ink-faint">
          THE CAST — DRAG INTO A LANE
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CHARACTERS.map((c) => (
            <div
              key={c.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/plain", `add:${c.id}`)}
              title={c.label}
              className="flex w-16 cursor-grab flex-col items-center rounded border border-line/60 px-1 py-1.5 transition-colors hover:border-paint active:cursor-grabbing"
            >
              <CharacterGlyph id={c.id} size={34} />
              <span className="mt-1 w-full truncate text-center text-[8px] tracking-wide text-ink-faint">
                {c.label.replace(/^an? /, "")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* the scene */}
      <div className="mt-5">
        <SceneTop
          choice={choice}
          deliberating={busy}
          aboard={
            a.where === "passengers"
              ? a.characters
              : b.where === "passengers"
                ? b.characters
                : null
          }
        />
        <div className="flex items-stretch gap-3 md:gap-4">
          <div className="flex flex-1 flex-col gap-2">
            <DraggableLane
              draft={a}
              option="A"
              verdict={choice ? (choice === "A" ? "KILLED" : "SPARED") : null}
              onDrop={drop("A")}
              onRemove={removeFrom("A")}
              onToggleLegal={() => { setResult(null); setA({ ...a, legal: !a.legal }); }}
            />
            <LaneSettings draft={a} onChange={(d) => { setResult(null); setA(d); }} />
          </div>
          <div className="lane-divider w-1.5 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <DraggableLane
              draft={b}
              option="B"
              verdict={choice ? (choice === "B" ? "KILLED" : "SPARED") : null}
              onDrop={drop("B")}
              onRemove={removeFrom("B")}
              onToggleLegal={() => { setResult(null); setB({ ...b, legal: !b.legal }); }}
            />
            <LaneSettings draft={b} onChange={(d) => { setResult(null); setB(d); }} />
          </div>
        </div>
      </div>

      {result && (
        <div className="mt-5 rounded border-l-4 border-paint bg-surface/60 px-4 py-3 text-[12px]">
          {result.error ? (
            <span className="text-paint">COMMS ERROR — {result.reason || "no verdict"}</span>
          ) : (
            <>
              <span className="text-ink-faint">VERDICT: </span>
              <span className="text-primary">
                kills {describeGroup((choice === "A" ? a : b).characters)}
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

function DraggableLane({
  draft,
  option,
  verdict,
  onDrop,
  onRemove,
  onToggleLegal,
}: {
  draft: SideDraft;
  option: "A" | "B";
  verdict: "KILLED" | "SPARED" | null;
  onDrop: (payload: string) => void;
  onRemove: (index: number) => void;
  onToggleLegal: () => void;
}) {
  // placed figures are draggable between lanes
  return (
    <div
      onDragStartCapture={(e) => {
        const idx = (e.target as HTMLElement).dataset?.idx;
        if (idx !== undefined) e.dataTransfer.setData("text/plain", `move:${option}:${idx}`);
      }}
    >
      <OutcomePanel
        side={toSide(draft)}
        option={option}
        verdict={verdict}
        onRemove={onRemove}
        onDropChar={onDrop}
        onToggleLegal={draft.where === "pedestrians" ? onToggleLegal : undefined}
      />
    </div>
  );
}
