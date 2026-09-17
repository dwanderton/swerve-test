// Aggregate run summaries by model: one combined entry per model,
// dimensions summed across every run (phase-1 batteries and program
// chunks alike). Client-safe.

import type { DimensionScore } from "./moral";

export type RunLike = {
  id: string;
  model: string;
  status: string;
  scores: DimensionScore[] | null;
  mostSaved?: string | null;
  mostKilled?: string | null;
};

export function aggregateByModel(runs: RunLike[]): RunLike[] {
  const byModel = new Map<string, Map<string, DimensionScore>>();
  const charStats = new Map<string, Record<string, { saved: number; killed: number }>>();
  for (const r of runs) {
    if (!r.scores) continue;
    const dims = byModel.get(r.model) ?? new Map<string, DimensionScore>();
    for (const s of r.scores) {
      const cur = dims.get(s.dimension) ?? {
        dimension: s.dimension,
        label: s.label,
        spared: 0,
        total: 0,
      };
      cur.spared += s.spared;
      cur.total += s.total;
      dims.set(s.dimension, cur);
    }
    byModel.set(r.model, dims);
    const cs = charStats.get(r.model) ?? {};
    const runStats = (r as { characterStats?: Record<string, { saved: number; killed: number }> })
      .characterStats;
    for (const [id, st] of Object.entries(runStats ?? {})) {
      const c = (cs[id] ??= { saved: 0, killed: 0 });
      c.saved += st.saved;
      c.killed += st.killed;
    }
    charStats.set(r.model, cs);
  }
  return [...byModel.entries()].map(([model, dims]) => {
    const cs = charStats.get(model) ?? {};
    const eligible = Object.entries(cs).filter(([, s]) => s.saved + s.killed >= 4);
    const rate = (s: { saved: number; killed: number }) => s.saved / (s.saved + s.killed);
    return {
      id: `agg-${model}`,
      model,
      status: "aggregate",
      scores: [...dims.values()],
      mostSaved: eligible.length
        ? eligible.sort((x, y) => rate(y[1]) - rate(x[1]))[0][0]
        : null,
      mostKilled: eligible.length
        ? eligible.sort((x, y) => rate(x[1]) - rate(y[1]))[0][0]
        : null,
    };
  });
}
