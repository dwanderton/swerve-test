"use client";

import { useState } from "react";

import { modelName } from "@/lib/models";
import { CharacterGlyph } from "./glyphs";
import { byId } from "@/lib/characters";
import type { DimensionScore } from "@/lib/moral";

// The site's nine results sliders, same titles and pole labels. Each
// completed run plots as one pip, so models are directly comparable.

type RunSummary = {
  id: string;
  model: string;
  status: string;
  scores: DimensionScore[] | null;
  mostSaved?: string | null;
  mostKilled?: string | null;
};

const SLIDERS: {
  key: string;
  title: string;
  left: string;
  right: string;
  value: (rate: number) => number;
}[] = [
  { key: "utilitarian", title: "Saving More Lives", left: "Does Not Matter", right: "Matters a Lot", value: (r) => r },
  { key: "relation", title: "Protecting Passengers", left: "Does Not Matter", right: "Matters a Lot", value: (r) => 1 - r },
  { key: "law", title: "Upholding the Law", left: "Does Not Matter", right: "Matters a Lot", value: (r) => r },
  { key: "intervention", title: "Avoiding Intervention", left: "Does Not Matter", right: "Matters a Lot", value: (r) => r },
  { key: "gender", title: "Gender Preference", left: "Males", right: "Females", value: (r) => r },
  { key: "species", title: "Species Preference", left: "Humans", right: "Pets", value: (r) => 1 - r },
  { key: "age", title: "Age Preference", left: "Younger", right: "Older", value: (r) => 1 - r },
  { key: "fitness", title: "Fitness Preference", left: "Fit People", right: "Large People", value: (r) => 1 - r },
  { key: "status", title: "Social Value Preference", left: "Higher", right: "Lower", value: (r) => 1 - r },
  { key: "pets", title: "Pet Preference", left: "Dogs", right: "Cats", value: (r) => 1 - r },
];

const PALETTE = ["#ffb400", "#38bdf8", "#f87171", "#4ade80", "#c084fc", "#fb923c", "#f472b6", "#2dd4bf"];

export default function Dashboard({ runs }: { runs: RunSummary[] }) {
  // hovering a model anywhere spotlights it across every slider
  const [focus, setFocus] = useState<string | null>(null);
  const dimmed = (model: string) => (focus !== null && model !== focus ? 0.12 : 1);
  const done = runs.filter((r) => r.scores).slice(-16);
  if (done.length === 0) {
    return (
      <div className="font-mono text-[11px] text-ink-faint">
        JUDGE A MODEL TO POPULATE THE RESULTS
      </div>
    );
  }
  const pip = (run: RunSummary, key: string, fn: (r: number) => number) => {
    const s = run.scores!.find((x) => x.dimension === key);
    if (!s || s.total === 0) return null;
    return fn(s.spared / s.total);
  };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-4 font-mono text-[11px]">
        {done.map((r, i) => (
          <span
            key={r.id}
            className="flex cursor-default items-center gap-1.5"
            onMouseEnter={() => setFocus(r.model)}
            onMouseLeave={() => setFocus(null)}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
            <span className="text-ink-muted">
              {modelName(r.model)}
              {(r.status === "live" || r.status === "aggregate") && r.status === "live" ? <span className="deliberating text-paint"> · LIVE</span> : null}
            </span>
          </span>
        ))}
      </div>
      {SLIDERS.map((sl) => (
        <div key={sl.key}>
          <div className="display mb-1 text-base tracking-wide text-ink">{sl.title}</div>
          <div className="relative h-8">
            <div className="absolute left-0 right-0 top-3 h-1.5 rounded-full bg-bg" />
            <div className="absolute left-1/2 top-2 h-3.5 w-0.5 bg-line" />
            <div className="absolute left-0 top-2 h-3.5 w-0.5 bg-line" />
            <div className="absolute right-0 top-2 h-3.5 w-0.5 bg-line" />
            {done.map((r, i) => {
              const v = pip(r, sl.key, sl.value);
              if (v === null) return null;
              return (
                <div
                  key={r.id}
                  className="group absolute top-1 h-5 w-1.5"
                  style={{
                    left: `calc(${(v * 100).toFixed(1)}% - 3px)`,
                    opacity: dimmed(r.model),
                    zIndex: focus === r.model ? 50 : 1,
                    transition: "opacity 150ms ease",
                  }}
                  onMouseEnter={() => setFocus(r.model)}
                  onMouseLeave={() => setFocus(null)}
                >
                  {/* the bar scales; the container (and tooltip) never do */}
                  <div
                    className="h-full w-full rounded-sm"
                    style={{
                      background: PALETTE[i % PALETTE.length],
                      transform: focus === r.model ? "scaleX(1.9) scaleY(1.25)" : undefined,
                      boxShadow:
                        focus === r.model
                          ? `0 0 0 1.5px #0b0c0e, 0 0 10px ${PALETTE[i % PALETTE.length]}`
                          : undefined,
                      transition: "transform 150ms ease",
                    }}
                  />
                  <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded border border-line bg-bg px-2 py-1 text-[10px] text-ink opacity-0 transition-opacity group-hover:opacity-100">
                    {modelName(r.model)} · {Math.round(v * 100)}%
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between font-mono text-[10px] tracking-[0.14em] text-ink-faint">
            <span>{sl.left}</span>
            <span>{sl.right}</span>
          </div>
        </div>
      ))}
      <div className="grid gap-3 sm:grid-cols-2">
        {done.map((r, i) => (
          <div key={r.id} className="rounded-md border border-line bg-bg/60 px-3 py-2 font-mono text-[11px]">
            <span style={{ color: PALETTE[i % PALETTE.length] }}>{modelName(r.model)}</span>
            <div className="mt-1 text-ink-muted">
              most saved: <span className="text-emerald-500">{r.mostSaved ? byId(r.mostSaved)?.label ?? r.mostSaved : "—"}</span>
            </div>
            <div className="text-ink-muted">
              most killed: <span className="text-primary">{r.mostKilled ? byId(r.mostKilled)?.label ?? r.mostKilled : "—"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
